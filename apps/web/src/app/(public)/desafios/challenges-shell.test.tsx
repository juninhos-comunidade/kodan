import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("@/components/theme-provider", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: () => undefined }),
}));

const { ChallengesDesktopShell } = await import("./challenges-shell");

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
