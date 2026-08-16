import type { EvaluationFailureReason } from "./evaluation/types";

type FeedbackViewedInput = {
  userId: string;
  challengeId: string;
  attemptNumber: number;
  sessionAgeBucket: "UNDER_10_MIN" | "MIN_10_TO_30" | "OVER_30_MIN";
};

export type ProductEventInput =
  | { name: "home_viewed" | "landing_viewed" }
  | {
      name: "landing_cta_clicked";
      contextBucket:
        | "START_DIAGNOSIS"
        | "EXPLORE_CATALOG"
        | "CREATE_ACCOUNT";
    }
  | {
      name: "auth_completed";
      provider: "EMAIL" | "GITHUB" | "GOOGLE";
      journey: "LOGIN" | "SIGNUP";
      source: "LANDING" | "CHALLENGE" | "DIRECT";
    }
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
    count(input: { where: { id: string; promoted: true } }): Promise<number>;
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
  landing_viewed: { requiresChallenge: false, contextBuckets: ["NONE"] },
  landing_cta_clicked: {
    requiresChallenge: false,
    contextBuckets: [
      "START_DIAGNOSIS",
      "EXPLORE_CATALOG",
      "CREATE_ACCOUNT",
    ],
  },
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
  auth_completed: {
    requiresChallenge: false,
    contextBuckets: [
      "LOGIN_EMAIL",
      "LOGIN_GITHUB",
      "LOGIN_GOOGLE",
      "SIGNUP_EMAIL",
      "SIGNUP_GITHUB",
      "SIGNUP_GOOGLE",
    ],
  },
} as const;

const authProviders = ["EMAIL", "GITHUB", "GOOGLE"] as const;
const authJourneys = ["LOGIN", "SIGNUP"] as const;
const authSources = ["LANDING", "CHALLENGE", "DIRECT"] as const;

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
  let scopeKey = "global";
  let contextBucket = typeof rawInput.contextBucket === "string"
    ? rawInput.contextBucket
    : "NONE";
  if (eventName === "auth_completed") {
    if (
      !includes(authProviders, rawInput.provider) ||
      !includes(authJourneys, rawInput.journey) ||
      !includes(authSources, rawInput.source)
    ) {
      return false;
    }
    scopeKey = rawInput.source;
    contextBucket = `${rawInput.journey}_${rawInput.provider}`;
  }
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
      where: { id: challengeId, promoted: true },
    });
    if (challengeExists !== 1) return false;
    scopeKey = challengeId;
  }

  const aggregate = {
    name: eventName,
    scopeKey,
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

const funnelStepNames = [
  "landing_viewed",
  "landing_cta_clicked",
  "home_viewed",
  "challenge_viewed",
  "diagnosis_started",
  "auth_gate_viewed",
  "auth_completed",
  "first_feedback_viewed",
  "next_challenge_started",
] as const;

type FunnelStepName = typeof funnelStepNames[number];

export function buildProductFunnelReport(
  rows: ReadonlyArray<{ name: string; count: number }>,
) {
  const counts = new Map<FunnelStepName, number>(
    funnelStepNames.map((name) => [name, 0]),
  );
  for (const row of rows) {
    if (!includes(funnelStepNames, row.name)) continue;
    counts.set(row.name, (counts.get(row.name) ?? 0) + row.count);
  }

  let previousCount: number | null = null;
  const steps = funnelStepNames.map((name) => {
    const count = counts.get(name) ?? 0;
    const conversionFromPrevious = previousCount && previousCount > 0
      ? Math.round((count / previousCount) * 10_000) / 100
      : null;
    previousCount = count;
    return { name, count, conversionFromPrevious };
  });

  return {
    kind: "DIRECTIONAL_EVENT_VOLUME" as const,
    note:
      "Este relatório usa volumes agregados de eventos e não representa uma coorte de usuários únicos.",
    steps,
  };
}

export function formatProductFunnelReport(
  report: ReturnType<typeof buildProductFunnelReport>,
) {
  const header = ["evento", "contagem", "conversão anterior"].join("\t");
  const lines = report.steps.map((step) => [
    step.name,
    String(step.count),
    step.conversionFromPrevious === null
      ? "n/a"
      : `${step.conversionFromPrevious.toFixed(2)}%`,
  ].join("\t"));
  return [header, ...lines, "", report.note].join("\n");
}

type ProductFunnelPersistence = {
  productEventAggregate: {
    findMany(input: {
      where: {
        name: { in: readonly string[] };
        day: { gte: Date; lt: Date };
      };
      select: { name: true; count: true };
    }): Promise<Array<{ name: string; count: number }>>;
  };
};

export async function queryProductFunnel(
  persistence: ProductFunnelPersistence,
  period: { from: Date; to: Date },
) {
  if (period.from >= period.to) {
    throw new Error("O início do período deve ser anterior ao fim.");
  }
  const rows = await persistence.productEventAggregate.findMany({
    where: {
      name: { in: funnelStepNames },
      day: { gte: period.from, lt: period.to },
    },
    select: { name: true, count: true },
  });
  return buildProductFunnelReport(rows);
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

function includes<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}
