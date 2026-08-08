import { describe, expect, mock, test } from "bun:test";

import {
  recordFeedbackViewed,
  recordProductEvent,
  toEvaluationLatencyBucket,
} from "./product-event-store";

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

    const recorded = await recordFeedbackViewed(
      persistence,
      {
        userId: "user-1",
        challengeId: "challenge-1",
        attemptNumber: 1,
        sessionAgeBucket: "UNDER_10_MIN",
      },
      now,
    );

    expect(recorded).toBe(true);
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
        name_scopeKey_contextBucket_day: {
          name: "first_feedback_viewed",
          scopeKey: "challenge-1",
          contextBucket: "UNDER_10_MIN",
          day: new Date("2026-08-08T00:00:00.000Z"),
        },
      },
      create: {
        name: "first_feedback_viewed",
        scopeKey: "challenge-1",
        contextBucket: "UNDER_10_MIN",
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

    const recorded = await recordFeedbackViewed(persistence, {
      userId: "user-1",
      challengeId: "challenge-1",
      attemptNumber: 1,
      sessionAgeBucket: "UNDER_10_MIN",
    });

    expect(recorded).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  test("não incrementa ativação depois da primeira tentativa do usuário", async () => {
    const { persistence, updateMany, upsert } = createPersistence({
      attemptCount: 2,
    });

    const recorded = await recordFeedbackViewed(persistence, {
      userId: "user-1",
      challengeId: "challenge-1",
      attemptNumber: 2,
      sessionAgeBucket: "MIN_10_TO_30",
    });

    expect(recorded).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("recordProductEvent", () => {
  test("agrega sucesso do avaliador por faixa de latência controlada", async () => {
    const upsert = mock(async () => ({ count: 1 }));
    const persistence = {
      challenge: { count: mock(async () => 1) },
      productEventAggregate: { upsert },
    };

    const recorded = await recordProductEvent(persistence, {
      name: "attempt_evaluation_succeeded",
      challengeId: "challenge-1",
      contextBucket: "SEC_2_TO_5",
    });

    expect(recorded).toBe(true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        name: "attempt_evaluation_succeeded",
        scopeKey: "challenge-1",
        contextBucket: "SEC_2_TO_5",
      }),
    }));
  });

  test("classifica latência do avaliador sem alta cardinalidade", () => {
    expect(toEvaluationLatencyBucket(1999)).toBe("UNDER_2_SEC");
    expect(toEvaluationLatencyBucket(2000)).toBe("SEC_2_TO_5");
    expect(toEvaluationLatencyBucket(5000)).toBe("OVER_5_SEC");
  });

  test("agrega uma visualização da home sem identificador ou desafio", async () => {
    const challengeCount = mock(async () => 0);
    const upsert = mock(async () => ({ count: 1 }));
    const persistence = {
      challenge: { count: challengeCount },
      productEventAggregate: { upsert },
    };

    const recorded = await recordProductEvent(
      persistence,
      { name: "home_viewed" },
      new Date("2026-08-09T01:30:00.000Z"),
    );

    expect(recorded).toBe(true);
    expect(challengeCount).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith({
      where: {
        name_scopeKey_contextBucket_day: {
          name: "home_viewed",
          scopeKey: "global",
          contextBucket: "NONE",
          day: new Date("2026-08-09T00:00:00.000Z"),
        },
      },
      create: {
        name: "home_viewed",
        scopeKey: "global",
        contextBucket: "NONE",
        day: new Date("2026-08-09T00:00:00.000Z"),
        count: 1,
      },
      update: { count: { increment: 1 } },
    });
    expect(JSON.stringify(upsert.mock.calls)).not.toContain("userId");
  });

  test("não agrega evento de desafio quando o desafio não existe", async () => {
    const upsert = mock(async () => ({ count: 1 }));
    const persistence = {
      challenge: { count: mock(async () => 0) },
      productEventAggregate: { upsert },
    };

    const recorded = await recordProductEvent(persistence, {
      name: "challenge_viewed",
      challengeId: "unknown-challenge",
    });

    expect(recorded).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  test("rejeita nomes e dimensões fora do vocabulário controlado", async () => {
    const upsert = mock(async () => ({ count: 1 }));
    const persistence = {
      challenge: { count: mock(async () => 1) },
      productEventAggregate: { upsert },
    };

    await expect(recordProductEvent(
      persistence,
      { name: "arbitrary_event", contextBucket: "user@example.com" } as never,
    )).resolves.toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });
});
