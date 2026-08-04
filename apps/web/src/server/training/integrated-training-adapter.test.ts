import { describe, expect, mock, test } from "bun:test";

import { EvaluationUnavailableError } from "./evaluation/errors";
import { createOpenRouterEvaluator } from "./evaluation/openrouter-evaluator";
import type { AnswerEvaluator } from "./evaluation/types";
import { submitIntegratedAttempt } from "./integrated-attempt-submission";

const challenge = {
  id: "challenge-1",
  title: "Desafio",
  question: "Explique o comportamento.",
  code: "const value = 1;",
  solution: "O valor permanece constante.",
  evaluationRubricJson: JSON.stringify({
    version: "1.0.0",
    questionKind: "explain-code",
    centralAnswer: "O valor permanece constante.",
    concepts: [
      {
        id: "constant-value",
        importance: "critical",
        internalDescription: "O valor nao e alterado.",
        publicLabel: "A estabilidade do valor.",
      },
    ],
  }),
};

function createPrismaBoundary() {
  const transaction = mock(async (_operation: unknown) => undefined);
  return {
    prisma: {
      challenge: { findUnique: mock(async () => challenge) },
      user: { findUnique: mock(async () => ({ id: "user-1" })) },
      attempt: { findMany: mock(async () => []) },
      $transaction: transaction,
    },
    transaction,
  };
}

describe("submitIntegratedAttempt", () => {
  test("nao chama o provider quando a nota maxima ja foi atingida", async () => {
    const evaluate = mock(async () => ({
      ok: false as const,
      reason: "UNKNOWN_PROVIDER_ERROR" as const,
      retryable: true,
    }));
    const evaluator: AnswerEvaluator = { evaluate };
    const transaction = mock(async (_operation: unknown) => undefined);
    const prisma = {
      challenge: { findUnique: mock(async () => challenge) },
      user: { findUnique: mock(async () => ({ id: "user-1" })) },
      attempt: {
        findMany: mock(async () => [
          { score: 10, eloChange: 20, sessionStatus: "SOLVED" },
        ]),
      },
      $transaction: transaction,
    };

    await expect(submitIntegratedAttempt(
      prisma as never,
      evaluator,
      "user-1",
      challenge.id,
      { userAnswer: "Outra resposta." },
    )).rejects.toThrow("Tentativa encerrada");
    expect(evaluate).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  test("nao abre transacao nem grava tentativa quando o avaliador falha", async () => {
    const { prisma, transaction } = createPrismaBoundary();
    const evaluator: AnswerEvaluator = {
      async evaluate() {
        return {
          ok: false,
          reason: "MODEL_UNAVAILABLE",
          retryable: true,
        };
      },
    };

    const submission = submitIntegratedAttempt(
      prisma as never,
      evaluator,
      "user-1",
      challenge.id,
      { userAnswer: "O valor e constante." },
    );

    await expect(submission).rejects.toBeInstanceOf(EvaluationUnavailableError);
    await expect(submission).rejects.toMatchObject({
      code: "EVALUATION_UNAVAILABLE",
      reason: "MODEL_UNAVAILABLE",
      retryable: true,
      preserveAnswer: true,
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  test("sem chave de IA preserva a resposta e nao cria tentativa nem ELO", async () => {
    const { prisma, transaction } = createPrismaBoundary();
    const telemetryEvents: Array<Record<string, unknown>> = [];
    const evaluator = createOpenRouterEvaluator({
      apiKey: undefined,
      model: "modelo-fixo",
      fetchImplementation: mock(async () => new Response()),
    });

    const submission = submitIntegratedAttempt(
      prisma as never,
      evaluator,
      "user-1",
      challenge.id,
      { userAnswer: "Minha resposta continua no campo de treino." },
      {
        telemetry: (event: Record<string, unknown>) => telemetryEvents.push(event),
      },
    );

    await expect(submission).rejects.toMatchObject({
      code: "EVALUATION_UNAVAILABLE",
      reason: "MISSING_CONFIGURATION",
      retryable: false,
      preserveAnswer: true,
    });
    expect(transaction).not.toHaveBeenCalled();
    expect(telemetryEvents).toMatchObject([
      { name: "attempt_evaluation_started", attemptNumber: 1 },
      {
        name: "attempt_evaluation_failed",
        failureReason: "MISSING_CONFIGURATION",
        retryable: false,
      },
      {
        name: "attempt_evaluation_completed",
        failureReason: "MISSING_CONFIGURATION",
      },
    ]);
    expect(JSON.stringify(telemetryEvents)).not.toContain(
      "Minha resposta continua no campo de treino.",
    );
  });

  test("com IA estruturada retorna feedback ao campo de treino e persiste V2", async () => {
    let createdAttempt: Record<string, unknown> | undefined;
    const telemetryEvents: Array<Record<string, unknown>> = [];
    const tx = {
      user: {
        findUnique: mock(async () => ({ id: "user-1", elo: 1200 })),
        update: mock(async () => undefined),
      },
      attempt: {
        findMany: mock(async () => []),
        create: mock(async ({ data }: { data: Record<string, unknown> }) => {
          createdAttempt = data;
        }),
      },
    };
    const prisma = {
      challenge: { findUnique: mock(async () => challenge) },
      user: { findUnique: mock(async () => ({ id: "user-1" })) },
      attempt: { findMany: mock(async () => []) },
      $transaction: mock(async (operation: (boundary: typeof tx) => unknown) =>
        operation(tx),
      ),
    };
    const providerEvaluation = {
      status: "VALID",
      centralCorrectness: 80,
      technicalReasoning: 70,
      technicalPrecision: 90,
      conceptAssessments: [
        {
          conceptId: "constant-value",
          state: "MATCHED",
          evidence: "Reconheceu que o valor nao muda.",
        },
      ],
      misconceptionIds: [],
      decisionRationale: "Resposta correta.",
    };
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      promptVersion: "1.0.0",
      fetchImplementation: mock(async () => Response.json({
        id: "generation-test",
        choices: [
          { message: { content: JSON.stringify(providerEvaluation) } },
        ],
      })),
    });

    const result = await submitIntegratedAttempt(
      prisma as never,
      evaluator,
      "user-1",
      challenge.id,
      { userAnswer: "O valor e constante." },
      {
        telemetry: (event: Record<string, unknown>) => telemetryEvents.push(event),
      },
    );

    expect(result).toMatchObject({ score: 8.1, status: "SOLVED" });
    expect(JSON.parse(String(createdAttempt?.feedbackJson))).toMatchObject({
      schemaVersion: 2,
      score: 8.1,
      evaluation: { decisionRationale: "Resposta correta." },
      publicFeedback: {
        score: 8.1,
        strengths: ["A estabilidade do valor."],
      },
    });
    expect(telemetryEvents.map((event) => event.name)).toEqual([
      "attempt_evaluation_started",
      "attempt_evaluation_succeeded",
      "attempt_evaluation_completed",
    ]);
    expect(telemetryEvents[1]).toMatchObject({
      challengeId: challenge.id,
      attemptNumber: 1,
      model: "modelo-fixo",
      promptVersion: "1.0.0",
      rubricVersion: "1.0.0",
      scoreRange: "8-8.9",
      status: "SOLVED",
      matchedConceptCount: 1,
      missingCriticalCount: 0,
      misconceptionCount: 0,
    });
    expect(JSON.stringify(telemetryEvents)).not.toContain("O valor e constante.");
  });
});
