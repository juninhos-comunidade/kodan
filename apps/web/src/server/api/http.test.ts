import { describe, expect, test } from "bun:test";

import { jsonFailure } from "./http";

describe("jsonFailure", () => {
  test("preserva os campos recuperaveis de uma falha de avaliacao", async () => {
    const response = jsonFailure(
      "Nao foi possivel avaliar agora.",
      503,
      {
        code: "EVALUATION_UNAVAILABLE",
        reason: "MODEL_UNAVAILABLE",
        retryable: true,
        preserveAnswer: true,
      },
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      error: "Nao foi possivel avaliar agora.",
      code: "EVALUATION_UNAVAILABLE",
      reason: "MODEL_UNAVAILABLE",
      retryable: true,
      preserveAnswer: true,
    });
  });
});
