import { PASSING_ATTEMPT_SCORE } from "@/lib/attempt-session-rules";

import type {
  ConceptAssessmentState,
  ConceptImportance,
  EvaluationScore,
  EvaluationScoreInput,
} from "./types";

const IMPORTANCE_WEIGHT: Record<ConceptImportance, number> = {
  critical: 3,
  essential: 2,
  complementary: 0,
};

const STATE_FACTOR: Record<ConceptAssessmentState, number> = {
  MATCHED: 1,
  PARTIAL: 0.5,
  MISSING: 0,
  CONTRADICTED: 0,
};

export function calculateEvaluationScore(
  input: EvaluationScoreInput,
): EvaluationScore {
  if (input.status !== "VALID") {
    return { score: 0, passed: false, essentialCoverage: 0 };
  }

  const gradedConcepts = input.concepts.filter(
    (concept) => concept.importance !== "complementary",
  );
  const possibleCoverage = gradedConcepts.reduce(
    (sum, concept) => sum + IMPORTANCE_WEIGHT[concept.importance],
    0,
  );
  const earnedCoverage = gradedConcepts.reduce(
    (sum, concept) =>
      sum +
      IMPORTANCE_WEIGHT[concept.importance] * STATE_FACTOR[concept.state],
    0,
  );
  const essentialCoverage = possibleCoverage > 0
    ? Math.round((earnedCoverage / possibleCoverage) * 100)
    : 0;
  const weightedScore =
    input.centralCorrectness * 0.45 +
    input.technicalReasoning * 0.3 +
    essentialCoverage * 0.15 +
    input.technicalPrecision * 0.1;
  const criticalConcepts = input.concepts.filter(
    (concept) => concept.importance === "critical",
  );
  const hasIncompleteCriticalConcept = criticalConcepts.some(
    (concept) => concept.state === "MISSING" || concept.state === "PARTIAL",
  );
  const hasContradictedCriticalConcept = criticalConcepts.some(
    (concept) => concept.state === "CONTRADICTED",
  );
  const roundedScore = Math.round(weightedScore) / 10;
  let score = hasContradictedCriticalConcept || input.hasCriticalMisconception
    ? Math.min(roundedScore, 5.9)
    : hasIncompleteCriticalConcept || input.centralCorrectness < 80
      ? Math.min(roundedScore, PASSING_ATTEMPT_SCORE - 0.1)
      : roundedScore;
  if (
    score >= 9 &&
    (essentialCoverage < 85 || input.technicalPrecision < 85)
  ) {
    score = 8.9;
  }
  const allCriticalConceptsMatched = criticalConcepts
    .every((concept) => concept.state === "MATCHED");
  const allEssentialConceptsMatched = input.concepts
    .filter((concept) => concept.importance === "essential")
    .every((concept) => concept.state === "MATCHED");
  const qualifiesForPerfectScore =
    allCriticalConceptsMatched &&
    allEssentialConceptsMatched &&
    input.centralCorrectness >= 95 &&
    input.technicalReasoning >= 90 &&
    input.technicalPrecision >= 90 &&
    !input.hasRelevantMisconception;
  if (score === 10 && !qualifiesForPerfectScore) score = 9.9;

  return {
    score,
    passed:
      input.status === "VALID" &&
      score >= PASSING_ATTEMPT_SCORE &&
      input.centralCorrectness >= 80 &&
      allCriticalConceptsMatched &&
      !input.hasCriticalMisconception,
    essentialCoverage,
  };
}
