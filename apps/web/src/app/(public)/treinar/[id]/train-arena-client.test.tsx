import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("../../../actions", () => ({
  recordFeedbackViewed: async () => ({ success: true }),
  revealSolution: async () => ({ success: false }),
  submitAttempt: async () => ({ success: false }),
}));

const { default: TrainArenaClient } = await import("./train-arena-client");

test("oferece o próximo desafio avaliável depois do feedback", () => {
  const markup = renderToStaticMarkup(
    <TrainArenaClient
      id="desafio-atual"
      initialChallenge={{
        id: "desafio-atual",
        title: "Desafio atual",
        difficulty: "EASY",
        recommendedElo: 1000,
        code: "const atual = true;",
        question: "Explique.",
        evaluationAvailable: true,
        tags: "react",
      }}
      nextChallenge={{ id: "proximo-desafio", title: "Próximo diagnóstico" }}
      isAuthenticated
      initialSession={{
        phase: "feedback",
        showComparison: false,
        result: {
          score: 8,
          eloChange: 12,
          isFirstAttempt: true,
          attemptNumber: 1,
          status: "SOLVED",
          canRetry: false,
          canRevealSolution: false,
          remainingEvaluatedAttempts: 0,
          nextEloPotentialPercent: 0,
          eloFinalized: true,
          feedback: {
            score: 8,
            summary: "Bom diagnóstico.",
            strengths: ["Identificou a causa."],
            blindspots: [],
            seniorSolution: "",
          },
        },
      }}
      initialUserAnswer="A causa é o efeito."
    />,
  );

  expect(markup).toContain('href="/treinar/proximo-desafio"');
  expect(markup).toContain("Próximo diagnóstico");
  expect(markup).not.toContain("Concluir arena");
});
