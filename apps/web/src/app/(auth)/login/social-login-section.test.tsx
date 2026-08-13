import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SocialLoginSection } from "./social-login-section";

test("mantém GitHub e Google sempre visíveis no login", () => {
  const markup = renderToStaticMarkup(
    <SocialLoginSection onSignIn={mock(() => undefined)} />,
  );

  expect(markup).toContain("Continuar com GitHub");
  expect(markup).toContain("Continuar com Google");
});
