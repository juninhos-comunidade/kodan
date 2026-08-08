export function buildRecommendationWhere(
  attemptedChallengeIds: string[],
) {
  return {
    evaluationRubricJson: { not: null },
    ...(attemptedChallengeIds.length > 0
      ? { id: { notIn: attemptedChallengeIds } }
      : {}),
  };
}
