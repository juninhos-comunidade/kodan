export type EvaluationTelemetryEventName =
  | "attempt_evaluation_started"
  | "attempt_evaluation_succeeded"
  | "attempt_evaluation_failed"
  | "attempt_evaluation_retried"
  | "attempt_evaluation_schema_rejected"
  | "attempt_evaluation_completed";

export type EvaluationTelemetryEvent = {
  name: EvaluationTelemetryEventName;
  challengeId: string;
  attemptNumber: number;
  model?: string;
  promptVersion?: string;
  rubricVersion?: string;
  latencyMs?: number;
  failureReason?: string;
  retryable?: boolean;
  scoreRange?: string;
  status?: string;
  matchedConceptCount?: number;
  missingCriticalCount?: number;
  misconceptionCount?: number;
};

export type EvaluationTelemetry = (
  event: EvaluationTelemetryEvent,
) => void;

export const logEvaluationEvent: EvaluationTelemetry = (event) => {
  console.info(`[evaluation] ${JSON.stringify(event)}`);
};
