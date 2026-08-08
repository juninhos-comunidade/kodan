import { describe, expect, mock, test } from "bun:test";

import { EvaluationUnavailableError } from "@/server/training/evaluation/errors";
import { handleEvaluationUnavailable } from "./evaluation-failure-handler";

const recordProductEvent = mock(async () => undefined);

describe("submitChallengeAttempt", () => {
  test("agrega a falha do avaliador sem persistir resposta ou usuário", async () => {
    const response = await handleEvaluationUnavailable(
      new EvaluationUnavailableError("TIMEOUT", true),
      "challenge-1",
      recordProductEvent,
    );

    expect(response).toMatchObject({
      success: false,
      code: "EVALUATION_UNAVAILABLE",
      reason: "TIMEOUT",
    });
    expect(recordProductEvent).toHaveBeenCalledWith({
      name: "attempt_evaluation_failed",
      challengeId: "challenge-1",
      contextBucket: "TIMEOUT",
    });
    expect(JSON.stringify(recordProductEvent.mock.calls)).not.toContain("user-1");
    expect(JSON.stringify(recordProductEvent.mock.calls)).not.toContain("userAnswer");
  });
});
