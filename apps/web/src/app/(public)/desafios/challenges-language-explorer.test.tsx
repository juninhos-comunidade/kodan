import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ChallengesLanguageExplorer } from "./challenges-language-explorer";

function renderExplorer() {
  return renderToStaticMarkup(
    <ChallengesLanguageExplorer
      challenges={[]}
      userElo={1200}
      authenticated={false}
      selectedLanguage={null}
      selectedTopic="ALL"
      onSelectLanguage={() => undefined}
      onSelectTopic={() => undefined}
      onBackToTree={() => undefined}
    >
      <div>Lista</div>
    </ChallengesLanguageExplorer>,
  );
}

describe("ChallengesLanguageExplorer", () => {
  test("inicia diretamente pelos filtros e pela árvore", () => {
    const markup = renderExplorer();

    expect(markup).not.toContain("Árvore de tecnologias");
    expect(markup).not.toContain(
      "Escolha uma linguagem para explorar os desafios",
    );
    expect(markup).toContain("Front-end");
  });

  test("preenche toda a altura disponível sem expor o fundo do shell", () => {
    expect(renderExplorer()).toContain(
      'class="min-h-full min-w-0 overflow-hidden',
    );
  });

  test("renderiza os ícones oficiais das quatro linguagens", () => {
    const markup = renderExplorer();

    expect(markup).toContain('data-icon="react"');
    expect(markup).toContain('data-icon="typescript"');
    expect(markup).toContain('data-icon="python"');
    expect(markup).toContain('data-icon="node-js"');
  });

  test("usa a marca do Kodan em vez do portão torii", () => {
    const markup = renderExplorer();

    expect(markup).toContain('data-kodan-logo="true"');
    expect(markup).not.toContain("⛩");
  });

  test("não apresenta ELO como domínio pessoal para visitantes", () => {
    expect(renderExplorer()).not.toContain("1200 ELO · seu domínio");
  });
});
