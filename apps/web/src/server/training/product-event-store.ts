import type { EvaluationFailureReason } from "./evaluation/types";

type FeedbackViewedInput = {
  userId: string;
  challengeId: string;
  attemptNumber: number;
  sessionAgeBucket: "UNDER_10_MIN" | "MIN_10_TO_30" | "OVER_30_MIN";
};

export type ProductEventInput =
  | { name: "home_viewed" }
  | {
      name:
        | "challenge_viewed"
        | "diagnosis_started"
        | "auth_gate_viewed"
        | "next_challenge_started";
      challengeId: string;
    }
  | {
      name: "attempt_evaluation_failed" | "attempt_evaluation_succeeded";
      challengeId: string;
      contextBucket:
        | EvaluationFailureReason
        | "UNDER_2_SEC"
        | "SEC_2_TO_5"
        | "OVER_5_SEC";
    }
  | {
      name: "active_day";
      contextBucket: "D1" | "D2_TO_D6" | "D7_PLUS";
    };

type AggregateEventPersistence = {
  challenge: {
    count(input: { where: { id: string } }): Promise<number>;
  };
  productEventAggregate: {
    upsert(input: AggregateUpsertInput): Promise<unknown>;
  };
};

type AggregateIdentity = {
  name: ProductEventInput["name"] | "first_feedback_viewed";
  scopeKey: string;
  contextBucket: string;
  day: Date;
};

type AggregateUpsertInput = {
  where: {
    name_scopeKey_contextBucket_day: AggregateIdentity;
  };
  create: AggregateIdentity & { count: 1 };
  update: { count: { increment: 1 } };
};

const evaluationFailureBuckets = [
  "MISSING_RUBRIC",
  "MISSING_CONFIGURATION",
  "TIMEOUT",
  "RATE_LIMIT",
  "AUTHENTICATION",
  "INSUFFICIENT_CREDITS",
  "MODEL_UNAVAILABLE",
  "INVALID_PROVIDER_RESPONSE",
  "INVALID_EVALUATION",
  "UNKNOWN_PROVIDER_ERROR",
] as const satisfies readonly EvaluationFailureReason[];

const productEventPolicy = {
  home_viewed: { requiresChallenge: false, contextBuckets: ["NONE"] },
  challenge_viewed: { requiresChallenge: true, contextBuckets: ["NONE"] },
  diagnosis_started: { requiresChallenge: true, contextBuckets: ["NONE"] },
  auth_gate_viewed: { requiresChallenge: true, contextBuckets: ["NONE"] },
  next_challenge_started: { requiresChallenge: true, contextBuckets: ["NONE"] },
  attempt_evaluation_failed: {
    requiresChallenge: true,
    contextBuckets: evaluationFailureBuckets,
  },
  attempt_evaluation_succeeded: {
    requiresChallenge: true,
    contextBuckets: ["UNDER_2_SEC", "SEC_2_TO_5", "OVER_5_SEC"],
  },
  active_day: {
    requiresChallenge: false,
    contextBuckets: ["D1", "D2_TO_D6", "D7_PLUS"],
  },
} as const;

type ProductEventPersistence = {
  $transaction<T>(operation: (transaction: ProductEventTransaction) => Promise<T>): Promise<T>;
};

type ProductEventTransaction = {
  attempt: {
    count(input: { where: { userId: string } }): Promise<number>;
    updateMany(input: {
      where: Pick<FeedbackViewedInput, "userId" | "challengeId" | "attemptNumber"> & {
        activationCounted: false;
      };
      data: { activationCounted: true };
    }): Promise<{ count: number }>;
  };
  productEventAggregate: {
    upsert(input: {
      where: {
        name_scopeKey_contextBucket_day: {
          name: "first_feedback_viewed";
          scopeKey: string;
          contextBucket: FeedbackViewedInput["sessionAgeBucket"];
          day: Date;
        };
      };
      create: {
        name: "first_feedback_viewed";
        scopeKey: string;
        contextBucket: FeedbackViewedInput["sessionAgeBucket"];
        day: Date;
        count: 1;
      };
      update: { count: { increment: 1 } };
    }): Promise<unknown>;
  };
};

export async function recordFeedbackViewed(
  persistence: ProductEventPersistence,
  input: FeedbackViewedInput,
  now = new Date(),
) {
  const day = toUtcDay(now);
  const aggregate = {
    name: "first_feedback_viewed" as const,
    scopeKey: input.challengeId,
    contextBucket: input.sessionAgeBucket,
    day,
  };
  return persistence.$transaction(async (transaction) => {
    const userAttemptCount = await transaction.attempt.count({
      where: { userId: input.userId },
    });
    if (userAttemptCount !== 1) return false;

    const marked = await transaction.attempt.updateMany({
      where: {
        userId: input.userId,
        challengeId: input.challengeId,
        attemptNumber: input.attemptNumber,
        activationCounted: false,
      },
      data: { activationCounted: true },
    });
    if (marked.count !== 1) return false;

    await transaction.productEventAggregate.upsert({
      where: { name_scopeKey_contextBucket_day: aggregate },
      create: { ...aggregate, count: 1 },
      update: { count: { increment: 1 } },
    });
    return true;
  });
}

export async function recordProductEvent(
  persistence: AggregateEventPersistence,
  input: ProductEventInput,
  now = new Date(),
) {
  const rawInput = input as unknown as Record<string, unknown>;
  const name = rawInput.name;
  if (typeof name !== "string" || !(name in productEventPolicy)) return false;
  const eventName = name as keyof typeof productEventPolicy;
  const policy = productEventPolicy[eventName];
  const contextBucket = typeof rawInput.contextBucket === "string"
    ? rawInput.contextBucket
    : "NONE";
  if (!(policy.contextBuckets as readonly string[]).includes(contextBucket)) {
    return false;
  }
  if (!policy.requiresChallenge && rawInput.challengeId !== undefined) return false;
  if (policy.requiresChallenge && typeof rawInput.challengeId !== "string") {
    return false;
  }
  const challengeId = policy.requiresChallenge
    ? (rawInput.challengeId as string).trim()
    : null;
  if (challengeId !== null) {
    if (challengeId.length === 0 || challengeId.length > 128) return false;
    const challengeExists = await persistence.challenge.count({
      where: { id: challengeId },
    });
    if (challengeExists !== 1) return false;
  }

  const aggregate = {
    name: eventName,
    scopeKey: challengeId ?? "global",
    contextBucket,
    day: toUtcDay(now),
  } satisfies AggregateIdentity;
  await persistence.productEventAggregate.upsert({
    where: { name_scopeKey_contextBucket_day: aggregate },
    create: { ...aggregate, count: 1 },
    update: { count: { increment: 1 } },
  });
  return true;
}

export function toEvaluationLatencyBucket(latencyMs: number) {
  if (latencyMs < 2_000) return "UNDER_2_SEC" as const;
  if (latencyMs < 5_000) return "SEC_2_TO_5" as const;
  return "OVER_5_SEC" as const;
}

function toUtcDay(now: Date) {
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  ));
}
