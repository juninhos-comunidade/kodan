import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SocialLoginSection } from "./social-login-section";

test("só oferece GitHub quando o provedor está configurado", () => {
  const onSignIn = mock(() => undefined);

  expect(renderToStaticMarkup(
    <SocialLoginSection githubEnabled={false} onSignIn={onSignIn} />,
  )).toBe("");
  expect(renderToStaticMarkup(
    <SocialLoginSection githubEnabled onSignIn={onSignIn} />,
  )).toContain("Entrar com GitHub");
});
