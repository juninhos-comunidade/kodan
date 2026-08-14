import { describe, expect, test } from "bun:test";

import {
  serializeAttempt,
  serializeChallengeDetail,
  serializeChallengeSummary,
} from "./serializers";
import { challengeDetailSchema } from "./schemas";

describe("challenge serializers", () => {
  test("expõe a linguagem no resumo público do desafio", () => {
    const serialized = serializeChallengeSummary({
      id: "challenge-language",
      title: "Narrowing seguro",
      difficulty: "MEDIUM",
      recommendedElo: 1200,
      language: "typescript",
      code: "const value: unknown = 1;",
      question: "Explique.",
      solution: "Segredo",
      tags: "typescript,narrowing",
      attempts: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(serialized.language).toBe("typescript");
  });

  test("expõe apenas a disponibilidade da avaliação no resumo público", () => {
    const serialized = serializeChallengeSummary({
      id: "challenge-evaluable",
      title: "Race condition",
      difficulty: "MEDIUM",
      recommendedElo: 1350,
      language: "react",
      code: "const value = 1;",
      question: "Explique.",
      solution: "Segredo",
      evaluationRubricJson: JSON.stringify({ version: "1.0.0" }),
      tags: "react,effects",
      attempts: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(serialized.evaluationAvailable).toBe(true);
    expect(serialized).not.toHaveProperty("evaluationRubricJson");
  });

  test("does not expose the reference solution in public challenge details", () => {
    const serialized = serializeChallengeDetail({
      id: "challenge-1",
      title: "Closure obsoleta",
      language: "react",
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
      language: "react",
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
    expect(serialized.availability).toBe("EDITORIAL_REVIEW");
    expect(serialized).not.toHaveProperty("evaluationRubricJson");
  });

  test("serializa o contexto conceitual sem inventar código", () => {
    const serialized = serializeChallengeDetail({
      id: "go-interface-vs-struct",
      title: "Interface ou struct?",
      language: "go",
      difficulty: "EASY",
      recommendedElo: 1100,
      code: null,
      codeFileName: null,
      scenario: "Um colega sugeriu trocar uma struct por uma interface.",
      topic: "interfaces-methods",
      presentation: "concept",
      intent: "compare",
      terminalJson: null,
      question: "Qual é a diferença entre as duas estruturas?",
      solution: "Segredo",
      evaluationRubricJson: JSON.stringify({ version: "1.0.0" }),
      tags: "go,interfaces,structs",
      attempts: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(serialized).toMatchObject({
      language: "go",
      code: null,
      scenario: "Um colega sugeriu trocar uma struct por uma interface.",
      topic: "interfaces-methods",
      presentation: "concept",
      intent: "compare",
      terminal: null,
      availability: "READY",
    });
    expect(() => challengeDetailSchema.parse(serialized)).not.toThrow();
  });

  test("desserializa o artefato de terminal persistido", () => {
    const serialized = serializeChallengeDetail({
      id: "python-output",
      title: "Saída inesperada",
      language: "python",
      difficulty: "MEDIUM",
      recommendedElo: 1300,
      code: "print(items)",
      codeFileName: "cart.py",
      topic: "collections-mutability",
      presentation: "code-terminal",
      intent: "diagnose",
      terminalJson: JSON.stringify({
        command: "python cart.py",
        blocks: [{ label: "Obtido", content: "[]", tone: "error" }],
      }),
      question: "Explique a saída.",
      solution: "Segredo",
      evaluationRubricJson: JSON.stringify({ version: "1.0.0" }),
      tags: "python,lists",
      attempts: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(serialized.terminal).toEqual({
      command: "python cart.py",
      blocks: [{ label: "Obtido", content: "[]", tone: "error" }],
    });
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
