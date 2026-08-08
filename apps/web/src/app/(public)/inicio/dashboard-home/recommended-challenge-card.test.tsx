import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RecommendedChallengeCard } from "./recommended-challenge-card";

const challenge = {
  id: "react-race-condition",
  title: "Race condition no perfil",
  difficulty: "MEDIUM",
  tags: ["React", "useEffect"],
  code: "useEffect(() => {}, []);",
  question: "Explique o problema.",
};

test("convida visitantes a começar o primeiro diagnóstico", () => {
  const markup = renderToStaticMarkup(
    <RecommendedChallengeCard
      challenge={challenge}
      recommendationReason="POPULAR_BEGINNER"
      authenticated={false}
    />,
  );

  expect(markup).toContain("Começar diagnóstico");
  expect(markup).not.toContain("Continuar treino");
});
