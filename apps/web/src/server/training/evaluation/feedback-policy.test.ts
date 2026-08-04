import { describe, expect, test } from "bun:test";

import { buildPublicFeedback } from "./feedback-policy";
import type { ChallengeEvaluationRubric, ModelEvaluation } from "./types";

const rubric: ChallengeEvaluationRubric = {
  version: "1.0.0",
  questionKind: "explain-code",
  centralAnswer: "O valor permanece constante.",
  concepts: [
    {
      id: "central",
      importance: "critical",
      internalDescription: "SEGREDO: o valor nao e alterado.",
      publicLabel: "A estabilidade do valor",
    },
    {
      id: "reasoning",
      importance: "essential",
      internalDescription: "SEGREDO: nao existe nova atribuicao.",
      publicLabel: "A ausencia de uma nova atribuicao",
      reflectionPrompt: "Pense no que poderia alterar o valor depois da declaracao.",
    },
    {
      id: "bonus",
      importance: "complementary",
      internalDescription: "SEGREDO: detalhe complementar.",
      publicLabel: "Um detalhe complementar",
    },
  ],
};

const evaluation: ModelEvaluation = {
  status: "VALID",
  centralCorrectness: 80,
  technicalReasoning: 70,
  technicalPrecision: 90,
  conceptAssessments: [
    { conceptId: "central", state: "MATCHED", evidence: "Evidencia interna." },
    { conceptId: "reasoning", state: "MISSING", evidence: "" },
    { conceptId: "bonus", state: "MISSING", evidence: "" },
  ],
  misconceptionIds: [],
  decisionRationale: "Racional interno.",
};

describe("buildPublicFeedback", () => {
  test("nao revela criterios ausentes nem detalhes internos da rubrica", () => {
    const feedback = buildPublicFeedback({
      rubric,
      evaluation,
      score: 7.8,
      passed: true,
    });

    expect(feedback).toMatchObject({
      schemaVersion: 2,
      score: 7.8,
      level: "PARTIALLY_CORRECT",
      summary: "Resposta aprovada. Voce cobriu o ponto central, com espaco para aprofundar alguns criterios.",
      strengths: ["A estabilidade do valor"],
      blindspots: ["???"],
      points: [
        {
          kind: "MATCHED",
          conceptId: "central",
          label: "A estabilidade do valor",
        },
        { kind: "HIDDEN", slot: "hidden-2", label: "???" },
      ],
      reflectionPrompt: "Pense no que poderia alterar o valor depois da declaracao.",
      detailedReviewAvailable: true,
      seniorSolution: "",
    });
    expect(JSON.stringify(feedback)).not.toContain("SEGREDO");
    expect(JSON.stringify(feedback)).not.toContain("Evidencia interna");
    expect(JSON.stringify(feedback)).not.toContain("Um detalhe complementar");
  });

  test.each([
    [3.9, "INCORRECT"],
    [4, "RELATED_BUT_INCORRECT"],
    [5.9, "RELATED_BUT_INCORRECT"],
    [6, "PARTIALLY_CORRECT"],
    [7.9, "PARTIALLY_CORRECT"],
    [8, "CORRECT"],
    [8.9, "CORRECT"],
    [9, "PRECISE"],
  ] as const)("classifica a nota %s como %s", (score, level) => {
    expect(buildPublicFeedback({ rubric, evaluation, score, passed: score >= 7 }).level)
      .toBe(level);
  });

  test("nao antecipa um conceito complementar mesmo quando ele foi identificado", () => {
    const withMatchedComplement: ModelEvaluation = {
      ...evaluation,
      conceptAssessments: evaluation.conceptAssessments.map((assessment) =>
        assessment.conceptId === "bonus"
          ? { ...assessment, state: "MATCHED" }
          : assessment,
      ),
    };

    const feedback = buildPublicFeedback({
      rubric,
      evaluation: withMatchedComplement,
      score: 8.5,
      passed: true,
    });

    expect(feedback.strengths).not.toContain("Um detalhe complementar");
    expect(feedback.points).not.toContainEqual(expect.objectContaining({
      kind: "COMPLEMENT",
    }));
  });
});
