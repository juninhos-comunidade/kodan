import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

const { default: AuthLayout } = await import("./layout");

test("leva a autenticação para a política publicada", () => {
  const markup = renderToStaticMarkup(
    <AuthLayout><div>Autenticação</div></AuthLayout>,
  );

  expect(markup).toContain('href="/privacidade"');
  expect(markup).not.toContain('href="/ajuda">Política de Privacidade');
});
