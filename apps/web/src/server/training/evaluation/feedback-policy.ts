import type {
  ChallengeEvaluationRubric,
  DetailedAttemptReview,
  ModelEvaluation,
  PublicAttemptFeedback,
} from "./types";

type BuildPublicFeedbackInput = {
  rubric: ChallengeEvaluationRubric;
  evaluation: ModelEvaluation;
  score: number;
  passed: boolean;
};

export function buildPublicFeedback({
  rubric,
  evaluation,
  score,
  passed,
}: BuildPublicFeedbackInput): PublicAttemptFeedback {
  const assessmentByConceptId = new Map(
    evaluation.conceptAssessments.map((assessment) => [
      assessment.conceptId,
      assessment.state,
    ]),
  );
  const strengths = rubric.concepts
    .filter(
      (concept) =>
        concept.importance !== "complementary" &&
        assessmentByConceptId.get(concept.id) === "MATCHED",
    )
    .map((concept) => concept.publicLabel);
  const blindspots = rubric.concepts
    .filter(
      (concept) =>
        concept.importance !== "complementary" &&
        assessmentByConceptId.get(concept.id) !== "MATCHED",
    )
    .map(() => "???");
  const points: NonNullable<PublicAttemptFeedback["points"]> = [];
  for (const concept of rubric.concepts) {
    const state = assessmentByConceptId.get(concept.id);
    if (state === "MATCHED" && concept.importance !== "complementary") {
      points.push({
          kind: "MATCHED",
          conceptId: concept.id,
          label: concept.publicLabel,
      });
    } else if (concept.importance !== "complementary") {
      points.push({ kind: "HIDDEN", slot: `hidden-${points.length + 1}`, label: "???" });
    }
  }
  const reflectionPrompt = rubric.concepts
    .filter((concept) => concept.importance !== "complementary")
    .sort((left, right) =>
      importancePriority(left.importance) - importancePriority(right.importance),
    )
    .find(
      (concept) =>
        assessmentByConceptId.get(concept.id) !== "MATCHED" &&
        concept.reflectionPrompt,
    )?.reflectionPrompt;

  return {
    schemaVersion: 2,
    score,
    level: getFeedbackLevel(evaluation.status, score),
    summary: passed
      ? blindspots.length > 0
        ? "Resposta aprovada. Voce cobriu o ponto central, com espaco para aprofundar alguns criterios."
        : "Resposta aprovada. Voce cobriu os criterios esperados com clareza."
      : "A resposta ainda nao atingiu o criterio de aprovacao. Revise os pontos em aberto antes de tentar novamente.",
    strengths,
    blindspots,
    points,
    ...(reflectionPrompt ? { reflectionPrompt } : {}),
    detailedReviewAvailable: passed,
    seniorSolution: "",
  };
}

export function buildDetailedReview({
  rubric,
  evaluation,
}: Pick<BuildPublicFeedbackInput, "rubric" | "evaluation">): DetailedAttemptReview {
  const assessmentByConceptId = new Map(
    evaluation.conceptAssessments.map((assessment) => [
      assessment.conceptId,
      assessment.state,
    ]),
  );
  const requiredConcepts = rubric.concepts.filter(
    (concept) => concept.importance !== "complementary",
  );
  const points: DetailedAttemptReview["points"] = requiredConcepts.map(
    (concept) => ({
      kind: assessmentByConceptId.get(concept.id) === "MATCHED"
        ? "MATCHED"
        : "REVEALED",
      conceptId: concept.id,
      label: concept.publicLabel,
    }),
  );
  points.push(
    ...rubric.concepts
      .filter((concept) => concept.importance === "complementary")
      .map((concept) => ({
        kind: "COMPLEMENT" as const,
        conceptId: concept.id,
        label: concept.publicLabel,
      })),
  );

  const misconceptionIds = new Set(evaluation.misconceptionIds);
  return {
    points,
    blindspots: requiredConcepts
      .filter((concept) => assessmentByConceptId.get(concept.id) !== "MATCHED")
      .map((concept) => concept.publicLabel),
    corrections: (rubric.misconceptions ?? [])
      .filter((misconception) => misconceptionIds.has(misconception.id))
      .flatMap((misconception) =>
        misconception.publicCorrection ? [misconception.publicCorrection] : []
      ),
  };
}

function importancePriority(
  importance: "critical" | "essential" | "complementary",
) {
  return importance === "critical" ? 0 : importance === "essential" ? 1 : 2;
}

function getFeedbackLevel(
  status: ModelEvaluation["status"],
  score: number,
): PublicAttemptFeedback["level"] {
  if (status !== "VALID" || score < 4) return "INCORRECT";
  if (score < 6) return "RELATED_BUT_INCORRECT";
  if (score < 8) return "PARTIALLY_CORRECT";
  return score < 9 ? "CORRECT" : "PRECISE";
}
