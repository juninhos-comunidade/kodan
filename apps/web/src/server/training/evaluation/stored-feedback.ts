import type {
  PublicAttemptFeedback,
  StoredEvaluationV2,
} from "./types";

export function parseStoredPublicFeedback(
  serialized: string,
): PublicAttemptFeedback | null {
  const stored = parseStoredValue(serialized);
  if (!stored) return null;

  const candidate = isStoredEvaluationV2(stored)
    ? stored.publicFeedback
    : stored;
  return isPublicAttemptFeedback(candidate) ? candidate : null;
}

export function revealStoredFeedback(serialized: string, solution: string) {
  const stored = parseStoredValue(serialized);
  if (!stored) throw new Error("Feedback persistido invalido");

  if (isStoredEvaluationV2(stored)) {
    if (!isPublicAttemptFeedback(stored.publicFeedback)) {
      throw new Error("Feedback persistido invalido");
    }
    return JSON.stringify({
      ...stored,
      publicFeedback: {
        ...stored.publicFeedback,
        ...(stored.detailedReview
          ? {
              points: stored.detailedReview.points,
              blindspots: stored.detailedReview.blindspots,
              corrections: stored.detailedReview.corrections,
              detailedReviewAvailable: false,
            }
          : {}),
        seniorSolution: solution,
      },
    });
  }

  if (!isPublicAttemptFeedback(stored)) {
    throw new Error("Feedback persistido invalido");
  }
  return JSON.stringify({ ...stored, seniorSolution: solution });
}

export function serializeStoredEvaluation(value: StoredEvaluationV2) {
  return JSON.stringify(value);
}

function parseStoredValue(serialized: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(serialized) as unknown;
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function isStoredEvaluationV2(
  value: Record<string, unknown>,
): value is unknown & StoredEvaluationV2 {
  return value.schemaVersion === 2 &&
    Boolean(value.publicFeedback && typeof value.publicFeedback === "object");
}

function isPublicAttemptFeedback(
  value: unknown,
): value is PublicAttemptFeedback {
  if (!value || typeof value !== "object") return false;
  const feedback = value as Record<string, unknown>;
  return typeof feedback.score === "number" &&
    Number.isFinite(feedback.score) &&
    typeof feedback.summary === "string" &&
    isStringArray(feedback.strengths) &&
    isStringArray(feedback.blindspots) &&
    typeof feedback.seniorSolution === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.every((item) => typeof item === "string");
}
