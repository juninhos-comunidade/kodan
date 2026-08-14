import { describe, expect, test } from "bun:test";

import type { ChallengeContentEntry } from "../../packages/content/src/promoted-challenge-catalog";
import type { EvaluationBenchmarkCase } from "../../packages/content/src/challenge-schemas";
import {
  selectLanguagePilot,
  selectRepresentativeCases,
} from "./benchmark-selection";

const caseFactory = (
  id: string,
  category: EvaluationBenchmarkCase["category"],
): EvaluationBenchmarkCase => ({
  id,
  category,
  answer: `Resposta ${id}`,
  expectedScore: { min: 0, max: 10 },
  expectedStatus: "RETRY_AVAILABLE",
});

const cases = [
  caseFactory("accepted-1", "accepted"),
  caseFactory("accepted-2", "accepted"),
  caseFactory("accepted-extra", "accepted"),
  caseFactory("partial-1", "partial"),
  caseFactory("partial-2", "partial"),
  caseFactory("rejected-1", "rejected"),
  caseFactory("adversarial-1", "adversarial"),
];

function challenge(id: string, language: ChallengeContentEntry["language"]): ChallengeContentEntry {
  return {
    id,
    title: id,
    language,
    difficulty: "MEDIUM",
    recommendedElo: 1200,
    code: null,
    question: "Explique.",
    solution: "Segredo.",
    tags: [language],
    topic: "topic",
    presentation: "concept",
    intent: "compare",
    evaluationRubric: {
      version: "1.0.0",
      questionKind: "compare-concepts",
      centralAnswer: "Resposta.",
      concepts: [{
        id: "critical",
        importance: "critical",
        internalDescription: "Resposta.",
        publicLabel: "Conceito.",
      }],
    },
    evaluationCases: cases,
  };
}

describe("seleção estática do benchmark", () => {
  test("seleciona seis casos representativos por desafio", () => {
    expect(selectRepresentativeCases(cases).map((item) => item.id)).toEqual([
      "accepted-1",
      "accepted-2",
      "partial-1",
      "partial-2",
      "rejected-1",
      "adversarial-1",
    ]);
  });

  test("exige cinco desafios avaliáveis no piloto da linguagem", () => {
    const challenges = Array.from({ length: 5 }, (_, index) =>
      challenge(`go-${index + 1}`, "go")
    );
    expect(selectLanguagePilot({ challenges, language: "go" })).toHaveLength(5);
    expect(() => selectLanguagePilot({
      challenges: challenges.slice(0, 4),
      language: "go",
    })).toThrow("exatamente 5 desafios");
  });

  test("permite validar um desafio isolado sem reduzir o contrato do piloto", () => {
    const selected = selectLanguagePilot({
      challenges: [challenge("python-one", "python")],
      language: "python",
      requestedChallengeId: "python-one",
    });
    expect(selected.map((item) => item.id)).toEqual(["python-one"]);
  });
});
