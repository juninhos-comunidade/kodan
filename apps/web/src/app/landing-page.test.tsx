import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import * as pageModule from "./page";

const HomePage = pageModule.default;

describe("landing pública", () => {
  test("contextualiza o produto antes de entrar no dojo", () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain("Treine o raciocínio");
    expect(markup).toContain("Começar diagnóstico");
    expect(markup).toContain("Explorar desafios");
    expect(markup).toContain("data-landing-cta");
    expect(markup).not.toContain("NEXT_REDIRECT");
  });

  test("publica metadados sociais completos", () => {
    expect(pageModule.metadata).toBeTruthy();
    if (!("metadata" in pageModule) || !pageModule.metadata) return;
    expect(pageModule.metadata.title).toBeTruthy();
    expect(pageModule.metadata.description).toBeTruthy();
    expect(pageModule.metadata.openGraph).toBeTruthy();
    expect(pageModule.metadata.twitter).toBeTruthy();
  });
});

describe("descoberta por buscadores", () => {
  test("publica sitemap e robots com rotas públicas", async () => {
    expect(existsSync(new URL("./sitemap.ts", import.meta.url))).toBe(true);
    expect(existsSync(new URL("./robots.ts", import.meta.url))).toBe(true);
    expect(existsSync(new URL("./opengraph-image.tsx", import.meta.url)))
      .toBe(true);

    const [{ default: sitemap }, { default: robots }] = await Promise.all([
      import("./sitemap"),
      import("./robots"),
    ]);
    expect(sitemap().some((entry) => entry.url.endsWith("/privacidade")))
      .toBe(true);
    expect(robots().rules).toBeTruthy();
  });
});
