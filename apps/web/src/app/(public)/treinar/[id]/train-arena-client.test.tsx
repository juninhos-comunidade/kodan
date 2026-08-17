import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("../../../actions", () => ({
  recordFeedbackViewed: async () => ({ success: true }),
  recordProductEvent: async () => ({ success: true }),
  revealSolution: async () => ({ success: false }),
  submitAttempt: async () => ({ success: false }),
}));
mock.module("@/components/product-event-beacon", () => ({
  ProductEventBeacon: ({ event }: { event: { name: string } }) => (
    <i data-product-event={event.name} />
  ),
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
  expect(markup).toContain('data-product-event="challenge_viewed"');
  expect(markup).toContain('data-product-event="diagnosis_started"');
  expect(markup).toContain("Explique.");
  expect(markup).not.toContain("Este componente apresenta comportamento incorreto");
});

test("volta ao catálogo sem chamar um item editorial de próximo desafio", () => {
  const markup = renderToStaticMarkup(
    <TrainArenaClient
      id="unico-avaliavel"
      initialChallenge={{
        id: "unico-avaliavel",
        title: "Único diagnóstico avaliável",
        difficulty: "EASY",
        recommendedElo: 1000,
        code: "const unico = true;",
        question: "Explique.",
        evaluationAvailable: true,
        tags: "react",
      }}
      nextChallenge={null}
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

  expect(markup).toContain('href="/desafios"');
  expect(markup).toContain("Explorar catálogo");
  expect(markup).not.toContain("Escolher próximo desafio");
});

test("bloqueia acesso direto a um desafio em revisão sem registrar início", () => {
  const markup = renderToStaticMarkup(
    <TrainArenaClient
      id="desafio-em-revisao"
      initialChallenge={{
        id: "desafio-em-revisao",
        title: "Desafio em revisão",
        difficulty: "EASY",
        recommendedElo: 1000,
        language: "react",
        code: "const value = true;",
        question: "Explique.",
        evaluationAvailable: false,
        tags: "react",
      }}
      nextChallenge={null}
      isAuthenticated
      initialSession={{ phase: "answering", showComparison: false, result: null }}
      initialUserAnswer=""
    />,
  );

  expect(markup).toContain("Desafio em revisão editorial");
  expect(markup).toContain("não afeta seu resultado nem seu ELO");
  expect(markup).not.toContain('data-product-event="challenge_viewed"');
  expect(markup).not.toContain("Enviar diagnóstico");
});

test("mantém desafios de outras linguagens acessíveis sem rubrica", () => {
  const markup = renderToStaticMarkup(
    <TrainArenaClient
      id="desafio-java"
      initialChallenge={{
        id: "desafio-java",
        title: "Desafio Java",
        difficulty: "EASY",
        recommendedElo: 1000,
        language: "java",
        code: "class Main { public static void main(String[] args) {} }",
        question: "Explique.",
        evaluationAvailable: false,
        tags: "java",
      }}
      nextChallenge={null}
      isAuthenticated
      initialSession={{ phase: "answering", showComparison: false, result: null }}
      initialUserAnswer=""
    />,
  );

  expect(markup).toContain("Seu diagnóstico");
  expect(markup).toContain("Enviar Diagnóstico");
  expect(markup).not.toContain("Desafio em revisão editorial");
});
