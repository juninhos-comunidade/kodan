import { describe, expect, test } from "bun:test";

import { calculateEvaluationScore } from "./score-policy";

describe("calculateEvaluationScore", () => {
  test("calcula nota decimal e aprovação a partir dos critérios e conceitos", () => {
    const result = calculateEvaluationScore({
      status: "VALID",
      centralCorrectness: 80,
      technicalReasoning: 70,
      technicalPrecision: 90,
      concepts: [
        { id: "central", importance: "critical", state: "MATCHED" },
        { id: "reasoning", importance: "essential", state: "PARTIAL" },
      ],
      hasCriticalMisconception: false,
    });

    expect(result).toEqual({
      score: 7.8,
      passed: true,
      essentialCoverage: 80,
    });
  });

  test("limita abaixo do corte quando um conceito crítico está parcial", () => {
    const result = calculateEvaluationScore({
      status: "VALID",
      centralCorrectness: 100,
      technicalReasoning: 100,
      technicalPrecision: 100,
      concepts: [
        { id: "central", importance: "critical", state: "PARTIAL" },
        { id: "reasoning", importance: "essential", state: "MATCHED" },
      ],
      hasCriticalMisconception: false,
    });

    expect(result).toMatchObject({ score: 6.9, passed: false });
  });

  test("atribui nota zero para resposta fora do assunto", () => {
    const result = calculateEvaluationScore({
      status: "OFF_TOPIC",
      centralCorrectness: 100,
      technicalReasoning: 100,
      technicalPrecision: 100,
      concepts: [
        { id: "central", importance: "critical", state: "MATCHED" },
      ],
      hasCriticalMisconception: false,
    });

    expect(result).toMatchObject({ score: 0, passed: false });
  });

  test("limita a nota quando um conceito crítico é contradito", () => {
    const result = calculateEvaluationScore({
      status: "VALID",
      centralCorrectness: 100,
      technicalReasoning: 100,
      technicalPrecision: 100,
      concepts: [
        { id: "central", importance: "critical", state: "CONTRADICTED" },
      ],
      hasCriticalMisconception: false,
    });

    expect(result).toMatchObject({ score: 5.9, passed: false });
  });

  test("limita a nota quando existe uma misconception crítica", () => {
    const result = calculateEvaluationScore({
      status: "VALID",
      centralCorrectness: 100,
      technicalReasoning: 100,
      technicalPrecision: 100,
      concepts: [
        { id: "central", importance: "critical", state: "MATCHED" },
      ],
      hasCriticalMisconception: true,
    });

    expect(result).toMatchObject({ score: 5.9, passed: false });
  });

  test("impede aprovacao quando a correcao central fica abaixo de oitenta", () => {
    const result = calculateEvaluationScore({
      status: "VALID",
      centralCorrectness: 79,
      technicalReasoning: 100,
      technicalPrecision: 100,
      concepts: [
        { id: "critical", importance: "critical", state: "MATCHED" },
      ],
      hasCriticalMisconception: false,
    });

    expect(result).toEqual({
      score: 6.9,
      passed: false,
      essentialCoverage: 100,
    });
  });

  test("limita em 8.9 quando a precisao para uma nota alta e insuficiente", () => {
    const result = calculateEvaluationScore({
      status: "VALID",
      centralCorrectness: 95,
      technicalReasoning: 95,
      technicalPrecision: 80,
      concepts: [
        { id: "critical", importance: "critical", state: "MATCHED" },
        { id: "essential", importance: "essential", state: "MATCHED" },
      ],
      hasCriticalMisconception: false,
    });

    expect(result.score).toBe(8.9);
    expect(result.passed).toBe(true);
  });

  test("reserva nota dez para resposta precisa e sem misconception", () => {
    const result = calculateEvaluationScore({
      status: "VALID",
      centralCorrectness: 100,
      technicalReasoning: 100,
      technicalPrecision: 100,
      concepts: [
        { id: "critical", importance: "critical", state: "MATCHED" },
        { id: "essential", importance: "essential", state: "MATCHED" },
      ],
      hasCriticalMisconception: false,
      hasRelevantMisconception: true,
    });

    expect(result.score).toBe(9.9);
    expect(result.passed).toBe(true);
  });
});
