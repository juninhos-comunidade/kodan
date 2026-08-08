import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("@/components/theme-provider", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: () => undefined }),
}));

const { ChallengesDesktopShell, ChallengesMobileShell } = await import("./challenges-shell");

describe("ChallengesDesktopShell", () => {
  test("mantém somente a busca como controle da barra desktop", () => {
    const markup = renderToStaticMarkup(
      <ChallengesDesktopShell
        userElo={1200}
        user={{ name: "Gabriel", image: null }}
        title="Árvore de tecnologias"
        description="Escolha uma linguagem."
        searchQuery=""
        onSearchChange={() => undefined}
      >
        <div>Conteúdo</div>
      </ChallengesDesktopShell>,
    );

    expect(markup).toContain("Buscar desafios, tópicos, conceitos...");
    expect(markup).not.toContain(">Rank<");
    expect(markup).not.toContain('aria-label="Alternar tema"');
    expect(markup).not.toContain('aria-label="Perfil"');
  });
});

describe("ChallengesMobileShell", () => {
  test("não apresenta ELO ou perfil fictícios para visitantes", () => {
    const markup = renderToStaticMarkup(
      <ChallengesMobileShell
        userElo={1200}
        user={{ name: "Kodan", image: null }}
        authenticated={false}
        searchQuery=""
        filtersOpen={false}
        filtersDisabled={false}
        onSearchChange={() => undefined}
        onOpenFilters={() => undefined}
      >
        <div>Conteúdo</div>
      </ChallengesMobileShell>,
    );

    expect(markup).toContain("Entrar");
    expect(markup).not.toContain(">1200<");
    expect(markup).not.toContain('aria-label="Perfil"');
  });
});
