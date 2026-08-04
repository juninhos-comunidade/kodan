import { describe, expect, test } from "bun:test";

import { EvaluationUnavailableError } from "./errors";
import { resolveFreeOpenRouterModel } from "./model-policy";

describe("resolveFreeOpenRouterModel", () => {
  test("usa um modelo gratuito fixo por padrao", () => {
    expect(resolveFreeOpenRouterModel(undefined)).toBe(
      "google/gemma-4-26b-a4b-it:free",
    );
  });

  test("aceita a troca para outro modelo gratuito explicito", () => {
    expect(resolveFreeOpenRouterModel("provider/outro-modelo:free"))
      .toBe("provider/outro-modelo:free");
  });

  test("rejeita modelo pago e o router gratuito aleatorio", () => {
    expect(() => resolveFreeOpenRouterModel("provider/modelo-pago"))
      .toThrow(EvaluationUnavailableError);
    expect(() => resolveFreeOpenRouterModel("openrouter/free"))
      .toThrow(EvaluationUnavailableError);
  });
});
