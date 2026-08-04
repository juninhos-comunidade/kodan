import { describe, expect, test } from "bun:test";

import { validateTrainingAnswer } from "./training-input-guard";

describe("validateTrainingAnswer", () => {
  test("rejeita vazio, espacos e conteudo sem caractere alfanumerico", () => {
    expect(validateTrainingAnswer("").valid).toBe(false);
    expect(validateTrainingAnswer("   \n").valid).toBe(false);
    expect(validateTrainingAnswer("!!! ???").valid).toBe(false);
  });

  test("rejeita payload excessivo e repeticao massiva", () => {
    expect(validateTrainingAnswer("a".repeat(10_001)).valid).toBe(false);
    expect(validateTrainingAnswer(`explicacao ${"x".repeat(80)}`).valid)
      .toBe(false);
  });

  test("aceita uma explicacao curta sem decidir se ela esta correta", () => {
    expect(validateTrainingAnswer("É um closure.")).toEqual({ valid: true });
  });
});
