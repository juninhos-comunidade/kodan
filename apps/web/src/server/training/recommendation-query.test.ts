import { describe, expect, test } from "bun:test";

import { buildRecommendationWhere } from "./recommendation-query";

describe("buildRecommendationWhere", () => {
  test("recomenda apenas desafios com avaliacao disponivel", () => {
    expect(buildRecommendationWhere([])).toEqual({
      promoted: true,
      evaluationRubricJson: { not: null },
    });
  });

  test("tambem exclui desafios ja tentados", () => {
    expect(buildRecommendationWhere(["challenge-1", "challenge-2"])).toEqual({
      promoted: true,
      evaluationRubricJson: { not: null },
      id: { notIn: ["challenge-1", "challenge-2"] },
    });
  });
});
