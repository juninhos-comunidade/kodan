import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { FirstFeedbackCelebration } from "./first-feedback-celebration";

test("explica o marco de ativação sem inventar progresso da trilha", () => {
  const markup = renderToStaticMarkup(<FirstFeedbackCelebration />);

  expect(markup).toContain("Primeiro feedback concluído");
  expect(markup).toContain("próximo diagnóstico");
  expect(markup).not.toContain("2 de 5");
});
