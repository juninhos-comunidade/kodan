import { describe, expect, test } from "bun:test";

import {
  attemptSessionReducer,
  initialAttemptSessionState,
  restoreAttemptSession,
  type ArenaAttemptResult,
} from "./attempt-session-state";

const retryResult: ArenaAttemptResult = {
  score: 4,
  eloChange: 0,
  newElo: 1200,
  isFirstAttempt: true,
  attemptNumber: 1,
  status: "RETRY_AVAILABLE",
  canRetry: true,
  canRevealSolution: true,
  remainingEvaluatedAttempts: 2,
  nextEloPotentialPercent: 80,
  eloFinalized: false,
  feedback: {
    score: 4,
    summary: "Ainda há pontos para investigar.",
    strengths: ["Boa observação inicial."],
    blindspots: ["Revise o ciclo de vida do efeito."],
    seniorSolution: "",
  },
};

describe("attemptSessionReducer", () => {
  test("transiciona do envio para feedback parcial", () => {
    const submitting = attemptSessionReducer(initialAttemptSessionState, {
      type: "submit_started",
    });
    const feedback = attemptSessionReducer(submitting, {
      type: "submit_succeeded",
      result: retryResult,
    });

    expect(submitting.phase).toBe("submitting");
    expect(feedback).toMatchObject({
      phase: "feedback",
      result: retryResult,
      showComparison: false,
    });
  });

  test("permite uma nova resposta somente quando o resultado autoriza", () => {
    const feedback = {
      ...initialAttemptSessionState,
      phase: "feedback" as const,
      result: retryResult,
    };

    expect(attemptSessionReducer(feedback, { type: "retry_requested" })).toEqual(
      initialAttemptSessionState,
    );

    const solved = {
      ...feedback,
      result: {
        ...retryResult,
        status: "SOLVED" as const,
        canRetry: false,
        canRevealSolution: false,
        eloFinalized: true,
        feedback: {
          ...retryResult.feedback,
          seniorSolution: "Solução de referência.",
        },
      },
    };
    expect(attemptSessionReducer(solved, { type: "retry_requested" })).toBe(solved);
  });

  test("só abre a comparação quando existe solução liberada", () => {
    const partial = {
      ...initialAttemptSessionState,
      phase: "feedback" as const,
      result: retryResult,
    };
    expect(
      attemptSessionReducer(partial, { type: "comparison_toggled" }).showComparison,
    ).toBe(false);

    const revealed = {
      ...partial,
      result: {
        ...retryResult,
        status: "REVEALED" as const,
        canRetry: false,
        canRevealSolution: false,
        eloFinalized: true,
        feedback: {
          ...retryResult.feedback,
          seniorSolution: "Solução de referência.",
        },
      },
    };
    expect(
      attemptSessionReducer(revealed, { type: "comparison_toggled" }).showComparison,
    ).toBe(true);
  });

  test("restaura feedback, resposta e bloqueio depois de recarregar", () => {
    const restored = restoreAttemptSession({
      score: 4,
      eloChange: 0,
      attemptNumber: 2,
      sessionStatus: "REVEALED",
      userAnswer: "Minha análise anterior.",
      feedbackJson: JSON.stringify({
        score: 4,
        summary: "Feedback preservado.",
        strengths: ["Boa leitura."],
        blindspots: ["Faltou o cleanup."],
        seniorSolution: "Solução de referência.",
      }),
    });

    expect(restored.userAnswer).toBe("Minha análise anterior.");
    expect(restored.state.phase).toBe("feedback");
    expect(restored.state.result).toMatchObject({
      attemptNumber: 2,
      status: "REVEALED",
      canRetry: false,
      canRevealSolution: false,
    });
    expect(restored.state.showComparison).toBe(true);
  });

  test("mantém a comparação de uma sessão resolvida fechada após recarregar", () => {
    const restored = restoreAttemptSession({
      score: 8,
      eloChange: 10,
      attemptNumber: 1,
      sessionStatus: "SOLVED",
      userAnswer: "Minha análise correta.",
      feedbackJson: JSON.stringify({
        score: 8,
        summary: "Problema resolvido.",
        strengths: ["Boa leitura."],
        blindspots: [],
        seniorSolution: "Solução de referência.",
      }),
    });

    expect(restored.state.showComparison).toBe(false);
  });

  test("restaura somente o feedback publico do envelope V2", () => {
    const restored = restoreAttemptSession({
      score: 7.8,
      eloChange: 9,
      attemptNumber: 1,
      sessionStatus: "SOLVED",
      feedbackJson: JSON.stringify({
        schemaVersion: 2,
        evaluation: { decisionRationale: "nao deve chegar a arena" },
        publicFeedback: {
          score: 7.8,
          summary: "Resposta aprovada.",
          strengths: ["Ponto central"],
          blindspots: ["???"],
          seniorSolution: "",
        },
      }),
    });

    expect(restored.state.result?.feedback).toEqual({
      score: 7.8,
      summary: "Resposta aprovada.",
      strengths: ["Ponto central"],
      blindspots: ["???"],
      seniorSolution: "",
    });
    expect(restored.state.result?.feedback).not.toHaveProperty("evaluation");
    expect(restored.state.result).toMatchObject({
      canRetry: true,
      canRevealSolution: true,
      nextEloPotentialPercent: 100,
      eloFinalized: false,
    });
  });
});
