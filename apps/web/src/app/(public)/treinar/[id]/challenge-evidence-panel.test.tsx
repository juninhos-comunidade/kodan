import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ChallengeEvidencePanel } from "./challenge-evidence-panel";

describe("ChallengeEvidencePanel", () => {
  test("renderiza código com arquivo e linguagem reais", () => {
    const markup = renderToStaticMarkup(
      <ChallengeEvidencePanel
        challenge={{
          language: "go",
          presentation: "code",
          code: "package main\nfunc main() {}",
          codeFileName: "main.go",
          scenario: null,
          question: "Explique o código.",
          terminal: null,
        }}
        difficulty="EASY"
        onCopyCode={() => undefined}
      />,
    );

    expect(markup).toContain('data-presentation="code"');
    expect(markup).toContain("main.go");
    expect(markup).toContain("Go");
    expect(markup).toContain("package");
    expect(markup).toContain(" main");
  });

  test("oferece abas acessíveis para código e terminal", () => {
    const markup = renderToStaticMarkup(
      <ChallengeEvidencePanel
        challenge={{
          language: "python",
          presentation: "code-terminal",
          code: "print(items)",
          codeFileName: "cart.py",
          scenario: "O carrinho duplicou um item.",
          question: "Explique a divergência.",
          terminal: {
            command: "python cart.py",
            blocks: [{ label: "Obtido", content: "['livro', 'livro']", tone: "error" }],
          },
        }}
        difficulty="MEDIUM"
        onCopyCode={() => undefined}
      />,
    );

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tab"');
    expect(markup).toContain("cart.py");
    expect(markup).toContain("Terminal");
    expect(markup).toContain("O carrinho duplicou um item.");
    expect(markup).toContain('aria-selected="true"');
  });

  test("mostra comando, rótulos e saída no modo terminal", () => {
    const markup = renderToStaticMarkup(
      <ChallengeEvidencePanel
        challenge={{
          language: "java",
          presentation: "terminal",
          code: null,
          codeFileName: null,
          scenario: "A suíte falhou após uma alteração.",
          question: "Interprete a falha.",
          terminal: {
            command: "./mvnw test",
            blocks: [
              { label: "Esperado", content: "BUILD SUCCESS", tone: "success" },
              { label: "Obtido", content: "NullPointerException", tone: "error" },
            ],
          },
        }}
        difficulty="MEDIUM"
        onCopyCode={() => undefined}
      />,
    );

    expect(markup).toContain('data-presentation="terminal"');
    expect(markup).toContain("./mvnw test");
    expect(markup).toContain("Esperado");
    expect(markup).toContain("BUILD SUCCESS");
    expect(markup).toContain("Obtido");
    expect(markup).toContain("NullPointerException");
    expect(markup).toContain("A suíte falhou após uma alteração.");
  });

  test("coloca contexto e pergunta no painel principal conceitual", () => {
    const markup = renderToStaticMarkup(
      <ChallengeEvidencePanel
        challenge={{
          language: "typescript",
          presentation: "concept",
          code: null,
          codeFileName: null,
          scenario: "A equipe precisa decidir como compartilhar estado.",
          question: "Qual é a diferença entre um hook e um webhook?",
          terminal: null,
        }}
        difficulty="EASY"
        onCopyCode={() => undefined}
      />,
    );

    expect(markup).toContain('data-presentation="concept"');
    expect(markup).toContain("Comparação conceitual");
    expect(markup).toContain("A equipe precisa decidir como compartilhar estado.");
    expect(markup).toContain("Qual é a diferença entre um hook e um webhook?");
    expect(markup).not.toContain("App.tsx");
  });
});
