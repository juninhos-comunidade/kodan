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

  const evaluation = evaluatorResult.evaluation.status === "VALID"
    ? evaluatorResult.evaluation
    : {
        ...evaluatorResult.evaluation,
        centralCorrectness: 0,
        technicalReasoning: 0,
        technicalPrecision: 0,
        conceptAssessments: evaluatorResult.evaluation.conceptAssessments.map(
          (assessment) => ({ ...assessment, state: "MISSING" as const, evidence: "" }),
        ),
        misconceptionIds: [],
      };

  const assessmentByConceptId = new Map(
    evaluation.conceptAssessments.map((assessment) => [
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

  const criticalMisconceptionIds = new Set<string>();
  for (const misconception of input.rubric.misconceptions ?? []) {
    if (misconception.severity === "critical") {
      criticalMisconceptionIds.add(misconception.id);
    }
  }
  const score = calculateEvaluationScore({
    status: evaluation.status,
    centralCorrectness: evaluation.centralCorrectness,
    technicalReasoning: evaluation.technicalReasoning,
    technicalPrecision: evaluation.technicalPrecision,
    concepts: concepts.filter((concept) => concept !== null),
    hasCriticalMisconception: evaluation.misconceptionIds.some(
      (id) => criticalMisconceptionIds.has(id),
    ),
    hasRelevantMisconception:
      evaluation.misconceptionIds.length > 0,
  });
  const publicFeedback = buildPublicFeedback({
    rubric: input.rubric,
    evaluation,
    score: score.score,
    passed: score.passed,
  });
  const detailedReview = buildDetailedReview({
    rubric: input.rubric,
    evaluation,
  });
  const storedEvaluation = {
    schemaVersion: 2 as const,
    ...score,
    evaluation,
    provider: evaluatorResult.metadata,
    publicFeedback,
    detailedReview,
  };

  return {
    ok: true as const,
    ...score,
    evaluation,
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
