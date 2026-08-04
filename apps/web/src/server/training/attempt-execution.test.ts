import { describe, expect, test } from "bun:test";

import {
  InvalidAttemptEvaluationError,
  evaluateAttempt,
  revealAttemptSolution,
} from "./attempt-execution";

const validFeedback = {
  score: 8,
  summary: "Bom diagnóstico.",
  strengths: ["Identificou a causa."],
  blindspots: ["Poderia detalhar o cleanup."],
};

const failedAttempt = {
  score: 4,
  eloChange: 0,
  sessionStatus: "RETRY_AVAILABLE" as const,
};

describe("evaluateAttempt", () => {
  test("recusa avaliação ausente em vez de aprovar por fallback", () => {
    expect(() =>
      evaluateAttempt({
        currentElo: 1200,
        previousAttempts: [],
        usedHint: false,
        solution: "Solução",
        feedback: undefined,
      })
    ).toThrow(InvalidAttemptEvaluationError);
  });

  test("recusa uma quarta avaliação mesmo com status legado incorreto", () => {
    expect(() =>
      evaluateAttempt({
        currentElo: 1200,
        previousAttempts: [failedAttempt, failedAttempt, failedAttempt],
        usedHint: false,
        solution: "Solução",
        feedback: { score: 8 },
      })
    ).toThrow("Limite de tentativas atingido");
  });

  test("mantém a sessão aberta e oculta a solução após o primeiro erro", () => {
    const result = evaluateAttempt({
      currentElo: 1200,
      previousAttempts: [],
      usedHint: false,
      solution: "Solução de referência.",
      feedback: { ...validFeedback, score: 4 },
    });

    expect(result).toMatchObject({
      attemptNumber: 1,
      status: "RETRY_AVAILABLE",
      score: 4,
      eloChange: 0,
      newElo: 1200,
      canRetry: true,
      canRevealSolution: true,
      remainingEvaluatedAttempts: 2,
      nextEloPotentialPercent: 80,
      eloFinalized: false,
    });
    expect(result.feedback.seniorSolution).toBe("");
  });

  test("reduz o ganho quando o praticante acerta na segunda resposta", () => {
    const result = evaluateAttempt({
      currentElo: 1200,
      previousAttempts: [failedAttempt],
      usedHint: false,
      solution: "Solução de referência.",
      feedback: validFeedback,
    });

    expect(result).toMatchObject({
      attemptNumber: 2,
      status: "SOLVED",
      eloChange: 8,
      newElo: 1208,
      canRetry: true,
      canRevealSolution: true,
      nextEloPotentialPercent: 100,
      eloFinalized: false,
    });
    expect(result.feedback.seniorSolution).toBe("");
  });

  test("mantem 100 por cento do potencial ao tentar melhorar uma aprovacao", () => {
    const result = evaluateAttempt({
      currentElo: 1206,
      previousAttempts: [
        { score: 7.5, eloChange: 6, sessionStatus: "SOLVED" },
      ],
      usedHint: false,
      solution: "Solução de referência.",
      feedback: { ...validFeedback, score: 8.5 },
    });

    expect(result).toMatchObject({
      status: "SOLVED",
      attemptNumber: 2,
      eloChange: 7,
      newElo: 1213,
      canRetry: true,
      nextEloPotentialPercent: 100,
      eloFinalized: false,
      feedback: { seniorSolution: "" },
    });
  });

  test("nao remove ELO quando uma tentativa de melhoria recebe nota menor", () => {
    const result = evaluateAttempt({
      currentElo: 1206,
      previousAttempts: [
        { score: 7.5, eloChange: 6, sessionStatus: "SOLVED" },
      ],
      usedHint: false,
      solution: "Solução de referência.",
      feedback: { ...validFeedback, score: 6.5 },
    });

    expect(result).toMatchObject({
      status: "SOLVED",
      eloChange: 0,
      newElo: 1206,
      canRetry: true,
      nextEloPotentialPercent: 100,
    });
  });

  test("executa a jornada erro, aprovacao com 80 por cento e melhoria incremental", () => {
    const first = evaluateAttempt({
      currentElo: 1200,
      previousAttempts: [],
      usedHint: false,
      solution: "Solução",
      feedback: { ...validFeedback, score: 4 },
    });
    const second = evaluateAttempt({
      currentElo: first.newElo,
      previousAttempts: [{ score: first.score, eloChange: first.eloChange, sessionStatus: first.status }],
      usedHint: false,
      solution: "Solução",
      feedback: { ...validFeedback, score: 8 },
    });
    const third = evaluateAttempt({
      currentElo: second.newElo,
      previousAttempts: [
        { score: first.score, eloChange: first.eloChange, sessionStatus: first.status },
        { score: second.score, eloChange: second.eloChange, sessionStatus: second.status },
      ],
      usedHint: false,
      solution: "Solução",
      feedback: { ...validFeedback, score: 9 },
    });

    expect([first, second, third].map((attempt) => ({
      attempt: attempt.attemptNumber,
      score: attempt.score,
      eloChange: attempt.eloChange,
      newElo: attempt.newElo,
      status: attempt.status,
    }))).toEqual([
      { attempt: 1, score: 4, eloChange: 0, newElo: 1200, status: "RETRY_AVAILABLE" },
      { attempt: 2, score: 8, eloChange: 8, newElo: 1208, status: "SOLVED" },
      { attempt: 3, score: 9, eloChange: 7, newElo: 1215, status: "SOLVED" },
    ]);
  });

  test("encerra a disputa por ELO depois da terceira resposta incorreta", () => {
    const result = evaluateAttempt({
      currentElo: 1200,
      previousAttempts: [failedAttempt, failedAttempt],
      usedHint: false,
      solution: "Solução de referência.",
      feedback: { ...validFeedback, score: 3 },
    });

    expect(result).toMatchObject({
      attemptNumber: 3,
      status: "ELO_EXHAUSTED",
      eloChange: 0,
      newElo: 1200,
      canRetry: false,
      canRevealSolution: true,
      remainingEvaluatedAttempts: 0,
      nextEloPotentialPercent: 0,
      eloFinalized: true,
    });
    expect(result.feedback.seniorSolution).toBe("");
  });

  test("limita o ganho a sete pontos quando uma dica foi usada", () => {
    const result = evaluateAttempt({
      currentElo: 1200,
      previousAttempts: [],
      usedHint: true,
      solution: "Solução de referência.",
      feedback: { ...validFeedback, score: 10 },
    });

    expect(result).toMatchObject({
      status: "SOLVED",
      score: 10,
      eloChange: 7,
      newElo: 1207,
    });
  });

  test("mantém o ELO mínimo em cem", () => {
    const result = evaluateAttempt({
      currentElo: 105,
      previousAttempts: [],
      usedHint: false,
      solution: "Solução de referência.",
      feedback: { ...validFeedback, score: 7 },
    });

    expect(result).toMatchObject({ eloChange: 5, newElo: 110 });
  });

  test("normaliza feedback inválido e revela a solução quando a resposta está correta", () => {
    const result = evaluateAttempt({
      currentElo: 1200,
      previousAttempts: [],
      usedHint: false,
      solution: "Solução canônica.",
      feedback: { score: 99, strengths: ["", 42], blindspots: null },
    });

    expect(result.score).toBe(10);
    expect(result.feedback.summary.length).toBeGreaterThan(0);
    expect(result.feedback.strengths.length).toBeGreaterThan(0);
    expect(result.feedback.blindspots.length).toBeGreaterThan(0);
    expect(result.feedback.seniorSolution).toBe("Solução canônica.");
  });
});

describe("revealAttemptSolution", () => {
  test("encerra a sessão e libera a solução sem alterar o ELO", () => {
    const result = revealAttemptSolution({
      currentElo: 1200,
      attemptNumber: 1,
      solution: "Solução canônica.",
      feedback: { ...validFeedback, score: 4 },
    });

    expect(result).toMatchObject({
      attemptNumber: 1,
      status: "REVEALED",
      eloChange: 0,
      newElo: 1200,
      canRetry: false,
      canRevealSolution: false,
      eloFinalized: true,
    });
    expect(result.feedback.seniorSolution).toBe("Solução canônica.");
  });

  test("preserva conceitos revelados e correcoes da analise completa", () => {
    const result = revealAttemptSolution({
      currentElo: 1200,
      attemptNumber: 1,
      solution: "Solução canônica.",
      feedback: {
        schemaVersion: 2,
        level: "PARTIALLY_CORRECT",
        score: 6.5,
        summary: "Quase.",
        strengths: ["Causa"],
        blindspots: ["Correção"],
        points: [{ kind: "REVEALED", conceptId: "guard", label: "Proteção" }],
        corrections: ["setState não é aguardável."],
        detailedReviewAvailable: false,
        seniorSolution: "",
      },
    });

    expect(result.feedback).toMatchObject({
      points: [{ kind: "REVEALED", conceptId: "guard", label: "Proteção" }],
      corrections: ["setState não é aguardável."],
    });
  });
});
