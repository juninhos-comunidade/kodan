import { describe, expect, test } from "bun:test";

import {
  parseStoredPublicFeedback,
  revealStoredFeedback,
} from "./stored-feedback";
import type { StoredEvaluationV2 } from "./types";

const storedEvaluation: StoredEvaluationV2 = {
  schemaVersion: 2,
  score: 7.8,
  passed: true,
  essentialCoverage: 80,
  evaluation: {
    status: "VALID",
    centralCorrectness: 80,
    technicalReasoning: 70,
    technicalPrecision: 90,
    conceptAssessments: [],
    misconceptionIds: [],
    decisionRationale: "interno",
  },
  provider: {
    mechanism: "OPENROUTER",
    model: "modelo-fixo",
    promptVersion: "1.0.0",
    rubricVersion: "1.0.0",
    latencyMs: 10,
  },
  publicFeedback: {
    score: 7.8,
    summary: "Aprovada",
    strengths: ["Ponto central"],
    blindspots: ["???"],
    seniorSolution: "",
  },
  detailedReview: {
    points: [
      { kind: "MATCHED", conceptId: "central", label: "Ponto central" },
      { kind: "REVEALED", conceptId: "reasoning", label: "Causa tecnica" },
      { kind: "COMPLEMENT", conceptId: "bonus", label: "Limite adicional" },
    ],
    blindspots: ["Causa tecnica"],
    corrections: ["O valor nao muda sozinho."],
  },
};

describe("stored feedback", () => {
  test("le feedback V2 sem expor a avaliacao interna", () => {
    const publicFeedback = parseStoredPublicFeedback(
      JSON.stringify(storedEvaluation),
    );

    expect(publicFeedback).toEqual(storedEvaluation.publicFeedback);
    expect(publicFeedback).not.toHaveProperty("evaluation");
  });

  test("revela a solucao preservando o envelope V2", () => {
    const revealed = revealStoredFeedback(
      JSON.stringify(storedEvaluation),
      "Solucao completa",
    );

    expect(JSON.parse(revealed)).toMatchObject({
      schemaVersion: 2,
      evaluation: { decisionRationale: "interno" },
      publicFeedback: {
        seniorSolution: "Solucao completa",
        detailedReviewAvailable: false,
        blindspots: ["Causa tecnica"],
        corrections: ["O valor nao muda sozinho."],
        points: [
          { kind: "MATCHED", conceptId: "central", label: "Ponto central" },
          { kind: "REVEALED", conceptId: "reasoning", label: "Causa tecnica" },
          { kind: "COMPLEMENT", conceptId: "bonus", label: "Limite adicional" },
        ],
      },
    });
  });

  test("mantem compatibilidade com feedback legado", () => {
    const legacy = {
      score: 6,
      summary: "Tente novamente",
      strengths: [],
      blindspots: ["???"],
      seniorSolution: "",
    };

    expect(parseStoredPublicFeedback(JSON.stringify(legacy))).toEqual(legacy);
    expect(JSON.parse(revealStoredFeedback(JSON.stringify(legacy), "Solucao")))
      .toEqual({ ...legacy, seniorSolution: "Solucao" });
  });
});
