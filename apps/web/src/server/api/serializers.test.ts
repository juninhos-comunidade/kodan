import { describe, expect, test } from "bun:test";

import { serializeAttempt, serializeChallengeDetail } from "./serializers";
import { challengeDetailSchema } from "./schemas";

describe("challenge serializers", () => {
  test("does not expose the reference solution in public challenge details", () => {
    const serialized = serializeChallengeDetail({
      id: "challenge-1",
      title: "Closure obsoleta",
      difficulty: "MEDIUM",
      recommendedElo: 1200,
      code: "const value = 1;",
      question: "Explique o problema.",
      solution: "Resposta secreta",
      evaluationRubricJson: JSON.stringify({
        version: "1.0.0",
        centralAnswer: "Resposta ainda mais secreta",
      }),
      tags: "react-hooks",
      attempts: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(serialized).not.toHaveProperty("solution");
    expect(serialized).not.toHaveProperty("evaluationRubricJson");
    expect(serialized.evaluationAvailable).toBe(true);
    expect(serialized.question).toBe("Explique o problema.");
    expect(() => challengeDetailSchema.parse(serialized)).not.toThrow();
  });

  test("informa indisponibilidade sem expor detalhes quando nao existe rubrica", () => {
    const serialized = serializeChallengeDetail({
      id: "challenge-without-rubric",
      title: "Em revisão",
      difficulty: "EASY",
      recommendedElo: 1000,
      code: "const value = 1;",
      question: "Explique.",
      solution: "Segredo",
      evaluationRubricJson: null,
      tags: "react",
      attempts: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(serialized.evaluationAvailable).toBe(false);
    expect(serialized).not.toHaveProperty("evaluationRubricJson");
  });

  test("preserva o estado da sessão ao serializar uma tentativa", () => {
    const serialized = serializeAttempt({
      id: "attempt-1",
      userId: "user-1",
      challengeId: "challenge-1",
      userAnswer: "Uma resposta suficientemente detalhada.",
      feedbackJson: "{}",
      score: 4,
      eloChange: 0,
      attemptNumber: 1,
      sessionStatus: "RETRY_AVAILABLE",
      createdAt: new Date("2026-07-24T00:00:00.000Z"),
    });

    expect(serialized).toMatchObject({
      attemptNumber: 1,
      sessionStatus: "RETRY_AVAILABLE",
    });
  });
});
