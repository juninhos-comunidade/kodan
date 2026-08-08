type FeedbackViewedInput = {
  userId: string;
  challengeId: string;
  attemptNumber: number;
  sessionAgeBucket: "UNDER_10_MIN" | "MIN_10_TO_30" | "OVER_30_MIN";
};

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
        name_challengeId_sessionAgeBucket_day: {
          name: "first_feedback_viewed";
          challengeId: string;
          sessionAgeBucket: FeedbackViewedInput["sessionAgeBucket"];
          day: Date;
        };
      };
      create: {
        name: "first_feedback_viewed";
        challengeId: string;
        sessionAgeBucket: FeedbackViewedInput["sessionAgeBucket"];
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
  const day = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  ));
  const aggregate = {
    name: "first_feedback_viewed" as const,
    challengeId: input.challengeId,
    sessionAgeBucket: input.sessionAgeBucket,
    day,
  };
  await persistence.$transaction(async (transaction) => {
    const userAttemptCount = await transaction.attempt.count({
      where: { userId: input.userId },
    });
    if (userAttemptCount !== 1) return;

    const marked = await transaction.attempt.updateMany({
      where: {
        userId: input.userId,
        challengeId: input.challengeId,
        attemptNumber: input.attemptNumber,
        activationCounted: false,
      },
      data: { activationCounted: true },
    });
    if (marked.count !== 1) return;

    await transaction.productEventAggregate.upsert({
      where: { name_challengeId_sessionAgeBucket_day: aggregate },
      create: { ...aggregate, count: 1 },
      update: { count: { increment: 1 } },
    });
  });
}
