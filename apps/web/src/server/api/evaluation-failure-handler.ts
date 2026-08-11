import { EvaluationUnavailableError } from "@/server/training/evaluation/errors";
import type { ProductEventInput } from "@/server/training/product-event-store";

type ProductEventRecorder = (input: ProductEventInput) => Promise<unknown>;

export async function handleEvaluationUnavailable(
  error: EvaluationUnavailableError,
  challengeId: string,
  recordProductEvent: ProductEventRecorder,
) {
  try {
    await recordProductEvent({
      name: "attempt_evaluation_failed",
      challengeId,
      contextBucket: error.reason,
    });
  } catch {
    // A resposta original do avaliador não depende da telemetria agregada.
  }
  return {
    success: false as const,
    error: error.message,
    code: error.code,
    reason: error.reason,
    retryable: error.retryable,
    preserveAnswer: error.preserveAnswer,
  };
}
