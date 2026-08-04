import { describe, expect, test } from "bun:test";

import { evaluateAnswer } from "./evaluation-service";
import type { AnswerEvaluator, EvaluationInput } from "./types";

const input: EvaluationInput = {
  challenge: {
    id: "challenge-1",
    title: "Desafio",
    question: "Explique o comportamento.",
    code: "const value = 1;",
  },
  userAnswer: "O valor permanece constante, mas faltou explicar um detalhe.",
  rubric: {
    version: "1.0.0",
    questionKind: "explain-code",
    centralAnswer: "O valor permanece constante.",
    concepts: [
      {
        id: "central",
        importance: "critical",
        internalDescription: "O valor não é alterado.",
        publicLabel: "A estabilidade do valor.",
      },
      {
        id: "reasoning",
        importance: "essential",
        internalDescription: "A declaração não possui uma atribuição posterior.",
        publicLabel: "A ausência de uma nova atribuição.",
      },
    ],
  },
};

describe("evaluateAnswer", () => {
  test("calcula a nota oficial sem aceitar uma nota final do avaliador", async () => {
    const evaluator: AnswerEvaluator = {
      async evaluate() {
        return {
          ok: true,
          evaluation: {
            status: "VALID",
            centralCorrectness: 80,
            technicalReasoning: 70,
            technicalPrecision: 90,
            conceptAssessments: [
              {
                conceptId: "central",
                state: "MATCHED",
                evidence: "Reconheceu a estabilidade.",
              },
              {
                conceptId: "reasoning",
                state: "PARTIAL",
                evidence: "Não explicou todo o mecanismo.",
              },
            ],
            misconceptionIds: [],
            decisionRationale: "Resposta correta, mas incompleta.",
          },
          metadata: {
            mechanism: "OPENROUTER",
            model: "modelo-fixo",
            promptVersion: "1.0.0",
            rubricVersion: "1.0.0",
            latencyMs: 10,
          },
        };
      },
    };

    const result = await evaluateAnswer(evaluator, input);

    expect(result).toMatchObject({
      ok: true,
      score: 7.8,
      passed: true,
      essentialCoverage: 80,
      publicFeedback: {
        score: 7.8,
        strengths: ["A estabilidade do valor."],
        blindspots: ["???"],
        seniorSolution: "",
      },
      storedEvaluation: {
        schemaVersion: 2,
        score: 7.8,
        passed: true,
      },
    });
  });
});
