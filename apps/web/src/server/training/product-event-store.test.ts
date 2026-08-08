import { describe, expect, mock, test } from "bun:test";

import { recordFeedbackViewed } from "./product-event-store";

function createPersistence({
  attemptCount = 1,
  markedCount = 1,
}: {
  attemptCount?: number;
  markedCount?: number;
} = {}) {
  const count = mock(async () => attemptCount);
  const updateMany = mock(async () => ({ count: markedCount }));
  const upsert = mock(async () => ({ count: 1 }));
  const transaction = {
    attempt: { count, updateMany },
    productEventAggregate: { upsert },
  };
  const $transaction = async <T>(
    operation: (boundary: typeof transaction) => Promise<T>,
  ): Promise<T> => operation(transaction);

  return { persistence: { $transaction }, count, updateMany, upsert };
}

describe("recordFeedbackViewed", () => {
  test("marca a primeira tentativa e incrementa somente um agregado diário", async () => {
    const { persistence, count, updateMany, upsert } = createPersistence();
    const now = new Date("2026-08-08T19:30:00.000Z");

    await recordFeedbackViewed(
      persistence,
      {
        userId: "user-1",
        challengeId: "challenge-1",
        attemptNumber: 1,
        sessionAgeBucket: "UNDER_10_MIN",
      },
      now,
    );

    expect(count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        challengeId: "challenge-1",
        attemptNumber: 1,
        activationCounted: false,
      },
      data: { activationCounted: true },
    });
    expect(upsert).toHaveBeenCalledWith({
      where: {
        name_challengeId_sessionAgeBucket_day: {
          name: "first_feedback_viewed",
          challengeId: "challenge-1",
          sessionAgeBucket: "UNDER_10_MIN",
          day: new Date("2026-08-08T00:00:00.000Z"),
        },
      },
      create: {
        name: "first_feedback_viewed",
        challengeId: "challenge-1",
        sessionAgeBucket: "UNDER_10_MIN",
        day: new Date("2026-08-08T00:00:00.000Z"),
        count: 1,
      },
      update: { count: { increment: 1 } },
    });
    expect(JSON.stringify(upsert.mock.calls)).not.toContain("userId");
    expect(JSON.stringify(upsert.mock.calls)).not.toContain("userAnswer");
  });

  test("não duplica o agregado quando a tentativa já foi marcada", async () => {
    const { persistence, upsert } = createPersistence({ markedCount: 0 });

    await recordFeedbackViewed(persistence, {
      userId: "user-1",
      challengeId: "challenge-1",
      attemptNumber: 1,
      sessionAgeBucket: "UNDER_10_MIN",
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  test("não incrementa ativação depois da primeira tentativa do usuário", async () => {
    const { persistence, updateMany, upsert } = createPersistence({
      attemptCount: 2,
    });

    await recordFeedbackViewed(persistence, {
      userId: "user-1",
      challengeId: "challenge-1",
      attemptNumber: 2,
      sessionAgeBucket: "MIN_10_TO_30",
    });

    expect(updateMany).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});
