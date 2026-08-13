import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SocialLoginSection } from "./social-login-section";

test("só oferece GitHub quando o provedor está configurado", () => {
  const onSignIn = mock(() => undefined);

  expect(
    renderToStaticMarkup(
      <SocialLoginSection
        githubEnabled={false}
        googleEnabled={false}
        onSignIn={onSignIn}
      />,
    ),
  ).toBe("");
  expect(
    renderToStaticMarkup(
      <SocialLoginSection
        githubEnabled
        googleEnabled={false}
        onSignIn={onSignIn}
      />,
    ),
  ).toContain("Continuar com GitHub");
});

test("oferece Google somente quando o provedor está configurado", () => {
  const markup = renderToStaticMarkup(
    <SocialLoginSection
      githubEnabled={false}
      googleEnabled
      onSignIn={() => undefined}
    />,
  );

  expect(markup).toContain("Continuar com Google");
  expect(markup).not.toContain("Continuar com GitHub");
});
