import { describe, expect, test } from "bun:test";

import { createMockTrainingStore } from "./mock-store";
import type {
  ChallengeEvaluationRubric,
  ModelEvaluation,
} from "@/server/training/evaluation/types";

function modelEvaluation(
  rubric: ChallengeEvaluationRubric,
  correct: boolean,
): ModelEvaluation {
  return {
    status: "VALID",
    centralCorrectness: correct ? 80 : 30,
    technicalReasoning: correct ? 80 : 30,
    technicalPrecision: correct ? 80 : 30,
    conceptAssessments: rubric.concepts.map((concept) => ({
      conceptId: concept.id,
      state: correct ? "MATCHED" : "MISSING",
      evidence: correct ? "Criterio identificado." : "Criterio ausente.",
    })),
    misconceptionIds: [],
    decisionRationale: "Avaliacao controlada pelo teste.",
  };
}

describe("createMockTrainingStore", () => {
  test("fornece desafios e registra uma tentativa sem banco de dados", () => {
    const store = createMockTrainingStore();
    const firstChallenge = store.listChallenges({ limit: 1, offset: 0 }).items[0];

    expect(firstChallenge).toBeDefined();
    expect(firstChallenge?.attempts).toHaveLength(0);

    const result = store.submitAttempt(firstChallenge!.id, {
      userAnswer: "O efeito depende de rows, mas a lista de dependências está vazia e produz dados desatualizados.",
      usedHint: false,
    });

    expect(result.isFirstAttempt).toBe(true);
    expect(result.newElo).toBeGreaterThan(1200);
    expect(store.getChallengeById(firstChallenge!.id)?.attempts).toHaveLength(1);
  });

  test("mantém a mesma sessão até resolver e reduz o ELO potencial", () => {
    const store = createMockTrainingStore({
      modelEvaluationForAnswer: (answer, rubric) => modelEvaluation(
        rubric,
        answer === "resposta correta e suficientemente detalhada",
      ),
    });
    const challengeId = store.listChallenges({ limit: 1, offset: 0 }).items[0]!.id;

    const first = store.submitAttempt(challengeId, {
      userAnswer: "primeira resposta incorreta e incompleta",
    });
    const second = store.submitAttempt(challengeId, {
      userAnswer: "resposta correta e suficientemente detalhada",
    });

    expect(first).toMatchObject({
      status: "RETRY_AVAILABLE",
      attemptNumber: 1,
      eloChange: 0,
    });
    expect(second).toMatchObject({
      status: "SOLVED",
      attemptNumber: 2,
      eloChange: 9,
      newElo: 1209,
      feedback: { blindspots: [] },
    });
    const improvementAttempt = store.submitAttempt(challengeId, {
      userAnswer: "uma resposta pior durante a tentativa de melhoria",
    });
    expect(improvementAttempt).toMatchObject({
      status: "SOLVED",
      attemptNumber: 3,
      eloChange: 0,
      newElo: 1209,
    });
    expect(() => store.submitAttempt(challengeId, {
      userAnswer: "uma quarta resposta",
    })).toThrow("Limite de tentativas atingido");
  });

  test("revela a solução e bloqueia novas respostas", () => {
    const store = createMockTrainingStore({
      modelEvaluationForAnswer: (_answer, rubric) =>
        modelEvaluation(rubric, false),
    });
    const challengeId = store.listChallenges({ limit: 1, offset: 0 }).items[0]!.id;

    store.submitAttempt(challengeId, { userAnswer: "resposta incorreta mas detalhada" });
    const revealed = store.revealSolution(challengeId);

    expect(revealed).toMatchObject({ status: "REVEALED", eloChange: 0, newElo: 1200 });
    expect(revealed.feedback.seniorSolution.length).toBeGreaterThan(0);
    expect(revealed.feedback.points?.some((point) => point.kind === "REVEALED")).toBe(true);
    expect(revealed.feedback.points?.some((point) => point.label === "???")).toBe(false);
    expect(() => store.submitAttempt(challengeId, {
      userAnswer: "tentativa depois de revelar a solução",
    })).toThrow("Tentativa encerrada");
  });
});
