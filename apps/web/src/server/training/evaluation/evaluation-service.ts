import { calculateEvaluationScore } from "./score-policy";
import { buildDetailedReview, buildPublicFeedback } from "./feedback-policy";
import type {
  AnswerEvaluator,
  EvaluationInput,
  EvaluatorResult,
} from "./types";

export async function evaluateAnswer(
  evaluator: AnswerEvaluator,
  input: EvaluationInput,
) {
  const evaluatorResult = await evaluator.evaluate(input);
  return finalizeEvaluation(input, evaluatorResult);
}

export function finalizeEvaluation(
  input: EvaluationInput,
  evaluatorResult: EvaluatorResult,
) {
  if (!evaluatorResult.ok) return evaluatorResult;

  const assessmentByConceptId = new Map(
    evaluatorResult.evaluation.conceptAssessments.map((assessment) => [
      assessment.conceptId,
      assessment,
    ]),
  );
  const concepts = input.rubric.concepts.map((concept) => {
    const assessment = assessmentByConceptId.get(concept.id);
    return assessment
      ? {
          id: concept.id,
          importance: concept.importance,
          state: assessment.state,
        }
      : null;
  });
  if (concepts.some((concept) => concept === null)) {
    return invalidEvaluation();
  }

  const criticalMisconceptionIds = new Set(
    input.rubric.misconceptions
      ?.filter((misconception) => misconception.severity === "critical")
      .map((misconception) => misconception.id) ?? [],
  );
  const score = calculateEvaluationScore({
    status: evaluatorResult.evaluation.status,
    centralCorrectness: evaluatorResult.evaluation.centralCorrectness,
    technicalReasoning: evaluatorResult.evaluation.technicalReasoning,
    technicalPrecision: evaluatorResult.evaluation.technicalPrecision,
    concepts: concepts.filter((concept) => concept !== null),
    hasCriticalMisconception: evaluatorResult.evaluation.misconceptionIds.some(
      (id) => criticalMisconceptionIds.has(id),
    ),
    hasRelevantMisconception:
      evaluatorResult.evaluation.misconceptionIds.length > 0,
  });
  const publicFeedback = buildPublicFeedback({
    rubric: input.rubric,
    evaluation: evaluatorResult.evaluation,
    score: score.score,
    passed: score.passed,
  });
  const detailedReview = buildDetailedReview({
    rubric: input.rubric,
    evaluation: evaluatorResult.evaluation,
  });
  const storedEvaluation = {
    schemaVersion: 2 as const,
    ...score,
    evaluation: evaluatorResult.evaluation,
    provider: evaluatorResult.metadata,
    publicFeedback,
    detailedReview,
  };

  return {
    ok: true as const,
    ...score,
    evaluation: evaluatorResult.evaluation,
    metadata: evaluatorResult.metadata,
    publicFeedback,
    storedEvaluation,
  };
}

function invalidEvaluation(): Extract<EvaluatorResult, { ok: false }> {
  return {
    ok: false,
    reason: "INVALID_EVALUATION",
    retryable: false,
  };
}
