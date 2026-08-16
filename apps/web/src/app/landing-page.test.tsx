import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import * as pageModule from "./page";

const HomePage = pageModule.default;

describe("landing pública", () => {
  test("redireciona diretamente para a entrada do produto", () => {
    expect(() => renderToStaticMarkup(<HomePage />)).toThrow("NEXT_REDIRECT");
  });

  test("mantém metadados básicos na rota de entrada", () => {
    expect(pageModule.metadata).toBeTruthy();
    if (!("metadata" in pageModule) || !pageModule.metadata) return;
    expect(pageModule.metadata.title).toBeTruthy();
    expect(pageModule.metadata.description).toBeTruthy();
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
