import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { FirstFeedbackCelebration } from "./first-feedback-celebration";

test("aponta para o próximo diagnóstico somente quando ele existe", () => {
  const markup = renderToStaticMarkup(
    <FirstFeedbackCelebration hasNextChallenge />,
  );

  expect(markup).toContain("Primeiro feedback concluído");
  expect(markup).toContain("próximo diagnóstico");
  expect(markup).not.toContain("2 de 5");
});

test("encerra o ciclo sem prometer outro diagnóstico avaliável", () => {
  const markup = renderToStaticMarkup(
    <FirstFeedbackCelebration hasNextChallenge={false} />,
  );

  expect(markup).toContain("Primeiro feedback concluído");
  expect(markup).toContain("Explore o catálogo");
  expect(markup).not.toContain("próximo diagnóstico avaliável");
});
