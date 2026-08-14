import { describe, expect, test } from "bun:test";

import { parseChallengeEvaluationRubric, parseModelEvaluation } from "./schemas";
import type { ChallengeEvaluationRubric } from "./types";

const rubric: ChallengeEvaluationRubric = {
  version: "1.0.0",
  questionKind: "debugging",
  centralAnswer: "Resposta central.",
  concepts: [{
    id: "critical",
    importance: "critical",
    internalDescription: "Conceito central.",
    publicLabel: "Conceito central.",
  }],
};

describe("parseChallengeEvaluationRubric", () => {
  test("aceita uma rubrica valida persistida como JSON", () => {
    const rubric = parseChallengeEvaluationRubric(JSON.stringify({
      version: "1.0.0",
      questionKind: "debugging",
      centralAnswer: "O efeito usa valores desatualizados.",
      concepts: [
        {
          id: "stale-values",
          importance: "critical",
          internalDescription: "As dependencias estao ausentes.",
          publicLabel: "As dependencias usadas pelo efeito.",
        },
      ],
    }));

    expect(rubric).toMatchObject({
      version: "1.0.0",
      concepts: [{ id: "stale-values", importance: "critical" }],
    });
  });

  test("rejeita rubrica sem criterio critico", () => {
    const rubric = parseChallengeEvaluationRubric(JSON.stringify({
      version: "1.0.0",
      questionKind: "debugging",
      centralAnswer: "Resposta.",
      concepts: [
        {
          id: "detail",
          importance: "essential",
          internalDescription: "Detalhe.",
          publicLabel: "Detalhe publico.",
        },
      ],
    }));

    expect(rubric).toBeNull();
  });

  test.each([
    "output-diagnosis",
    "compare-concepts",
    "behavior-validation",
  ] as const)("aceita o novo tipo de questão %s", (questionKind) => {
    const parsed = parseChallengeEvaluationRubric(JSON.stringify({
      version: "1.0.0",
      questionKind,
      centralAnswer: "Resposta central.",
      concepts: [{
        id: "critical",
        importance: "critical",
        internalDescription: "Conceito central.",
        publicLabel: "Conceito central.",
      }],
    }));

    expect(parsed?.questionKind).toBe(questionKind);
  });
});

describe("parseModelEvaluation", () => {
  test("aceita evidencia vazia somente para conceito ausente", () => {
    const base = {
      status: "VALID",
      centralCorrectness: 50,
      technicalReasoning: 50,
      technicalPrecision: 50,
      misconceptionIds: [],
      decisionRationale: "Resposta parcial.",
    };
    expect(parseModelEvaluation({
      ...base,
      conceptAssessments: [{ conceptId: "critical", state: "MISSING", evidence: "" }],
    }, rubric)).not.toBeNull();
    expect(parseModelEvaluation({
      ...base,
      conceptAssessments: [{ conceptId: "critical", state: "MATCHED", evidence: "" }],
    }, rubric)).toBeNull();
  });
});
