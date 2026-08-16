import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AuthPage } from "./auth-page";

test("preserva a origem da landing ao alternar entre login e cadastro", () => {
  const markup = renderToStaticMarkup(
    <AuthPage view="login" callbackURL="/inicio" source="landing">
      Conteúdo
    </AuthPage>,
  );

  expect(markup).toContain("source=landing");
  expect(markup).toContain("callbackURL=%2Finicio");
  expect(markup).not.toContain("Centenas de exercícios");
  expect(markup).not.toContain("toda semana");
});
