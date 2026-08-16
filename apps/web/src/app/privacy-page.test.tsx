import { existsSync } from "node:fs";
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

test("publica uma política de privacidade legível e específica", async () => {
  const pageUrl = new URL("./privacidade/page.tsx", import.meta.url);
  expect(existsSync(pageUrl)).toBe(true);
  if (!existsSync(pageUrl)) return;

  const { default: PrivacyPage } = await import("./privacidade/page");
  const markup = renderToStaticMarkup(<PrivacyPage />);

  expect(markup).toContain("Política de Privacidade");
  expect(markup).toContain("dados de conta");
  expect(markup).toContain("GitHub e Google");
  expect(markup).toContain("exclusão");
  expect(markup).toContain("16 de agosto de 2026");
});
