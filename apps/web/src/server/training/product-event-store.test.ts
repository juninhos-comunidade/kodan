import { describe, expect, mock, test } from "bun:test";

import * as productEventStore from "./product-event-store";
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

  test("agrega autenticação concluída por origem, jornada e provedor", async () => {
    const upsert = mock(async () => ({ count: 1 }));
    const persistence = {
      challenge: { count: mock(async () => 0) },
      productEventAggregate: { upsert },
    };

    const recorded = await recordProductEvent(persistence, {
      name: "auth_completed",
      provider: "GOOGLE",
      journey: "SIGNUP",
      source: "LANDING",
    });

    expect(recorded).toBe(true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        name: "auth_completed",
        scopeKey: "LANDING",
        contextBucket: "SIGNUP_GOOGLE",
      }),
    }));
    expect(JSON.stringify(upsert.mock.calls)).not.toContain("userId");
    expect(JSON.stringify(upsert.mock.calls)).not.toContain("email");
  });

  test("agrega a intenção do CTA da landing sem identificadores", async () => {
    const upsert = mock(async () => ({ count: 1 }));
    const persistence = {
      challenge: { count: mock(async () => 0) },
      productEventAggregate: { upsert },
    };

    const recorded = await recordProductEvent(persistence, {
      name: "landing_cta_clicked",
      contextBucket: "EXPLORE_CATALOG",
    });

    expect(recorded).toBe(true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        name: "landing_cta_clicked",
        scopeKey: "global",
        contextBucket: "EXPLORE_CATALOG",
      }),
    }));
  });
});

describe("buildProductFunnelReport", () => {
  test("soma os agregados e explicita que o funil é direcional", () => {
    expect(typeof productEventStore.buildProductFunnelReport).toBe("function");
    if (typeof productEventStore.buildProductFunnelReport !== "function") return;
    const report = productEventStore.buildProductFunnelReport([
      { name: "landing_viewed", count: 10 },
      { name: "landing_viewed", count: 5 },
      { name: "landing_cta_clicked", count: 6 },
      { name: "auth_completed", count: 3 },
      { name: "first_feedback_viewed", count: 2 },
    ]);

    expect(report.kind).toBe("DIRECTIONAL_EVENT_VOLUME");
    expect(report.steps.find((step) => step.name === "landing_viewed")?.count)
      .toBe(15);
    expect(report.steps.find((step) => step.name === "auth_completed")?.count)
      .toBe(3);
    expect(report.note).toContain("não representa uma coorte");
  });

  test("consulta o período solicitado sem ler usuários ou tentativas", async () => {
    expect(typeof productEventStore.queryProductFunnel).toBe("function");
    if (typeof productEventStore.queryProductFunnel !== "function") return;
    const findMany = mock(async () => [
      { name: "landing_viewed", count: 4 },
      { name: "auth_completed", count: 1 },
    ]);
    const from = new Date("2026-08-01T00:00:00.000Z");
    const to = new Date("2026-08-17T00:00:00.000Z");

    const report = await productEventStore.queryProductFunnel(
      { productEventAggregate: { findMany } },
      { from, to },
    );

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ day: { gte: from, lt: to } }),
    }));
    expect(report.steps.find((step) => step.name === "auth_completed")?.count)
      .toBe(1);
    expect(JSON.stringify(findMany.mock.calls)).not.toContain("user");
    expect(JSON.stringify(findMany.mock.calls)).not.toContain("attempt");
  });

  test("formata uma leitura de terminal com a ressalva metodológica", () => {
    expect(typeof productEventStore.formatProductFunnelReport).toBe("function");
    if (typeof productEventStore.formatProductFunnelReport !== "function") return;

    const output = productEventStore.formatProductFunnelReport(
      productEventStore.buildProductFunnelReport([
        { name: "landing_viewed", count: 15 },
        { name: "landing_cta_clicked", count: 6 },
      ]),
    );

    expect(output).toContain("landing_viewed");
    expect(output).toContain("15");
    expect(output).toContain("não representa uma coorte");
  });
});
