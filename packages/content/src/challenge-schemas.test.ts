import { describe, expect, test } from "bun:test";

import {
  challengeEvaluationRubricSchema,
  challengeLanguageSchema,
  challengeSplitMetaSchema,
  challengeTerminalArtifactSchema,
} from "./challenge-schemas";

const validRubric = {
  version: "1.0.0",
  questionKind: "debugging" as const,
  centralAnswer: "Uma resposta antiga pode sobrescrever o estado atual.",
  concepts: [{
    id: "race",
    importance: "critical" as const,
    internalDescription: "As respostas podem chegar fora de ordem.",
    publicLabel: "A concorrencia entre requisicoes.",
    reflectionPrompt: "As respostas chegam necessariamente na ordem de envio?",
  }],
};

describe("challengeEvaluationRubricSchema", () => {
  test("aceita uma pergunta de reflexao editorial que nao entrega a resposta", () => {
    expect(challengeEvaluationRubricSchema.safeParse(validRubric).success).toBe(true);
  });

  test.each([
    validRubric.centralAnswer,
    validRubric.concepts[0].internalDescription,
  ])("rejeita pergunta de reflexao que copia conteudo interno", (reflectionPrompt) => {
    const parsed = challengeEvaluationRubricSchema.safeParse({
      ...validRubric,
      concepts: [{ ...validRubric.concepts[0], reflectionPrompt }],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("contrato multiformato de desafios", () => {
  test("aceita as cinco linguagens públicas e rejeita Node.js", () => {
    for (const language of ["react", "typescript", "python", "java", "go"]) {
      expect(challengeLanguageSchema.safeParse(language).success).toBe(true);
    }
    expect(challengeLanguageSchema.safeParse("nodejs").success).toBe(false);
  });

  test("aceita um artefato de terminal com blocos visuais", () => {
    expect(challengeTerminalArtifactSchema.parse({
      command: "go test ./...",
      blocks: [
        { label: "Esperado", content: "ok  carrinho", tone: "success" },
        { label: "Obtido", content: "panic: concurrent map writes", tone: "error" },
      ],
    })).toMatchObject({ command: "go test ./...", blocks: [{ tone: "success" }, { tone: "error" }] });
  });

  test("permite desafio conceitual sem arquivo de código", () => {
    const parsed = challengeSplitMetaSchema.safeParse({
      id: "go-interface-vs-struct",
      title: "Interface ou struct?",
      language: "go",
      topic: "interfaces-methods",
      presentation: "concept",
      intent: "compare",
      difficulty: "EASY",
      recommendedElo: 1100,
      scenario: "Um colega sugeriu trocar uma struct por uma interface.",
      question: "Qual é a diferença entre as duas estruturas?",
      tags: ["go", "interfaces", "structs"],
    });

    expect(parsed.success).toBe(true);
  });

  test("exige terminal nos modos que dependem de saída", () => {
    const parsed = challengeSplitMetaSchema.safeParse({
      id: "python-terminal",
      title: "Saída inesperada",
      language: "python",
      topic: "collections-mutability",
      presentation: "code-terminal",
      intent: "diagnose",
      difficulty: "MEDIUM",
      recommendedElo: 1300,
      question: "Explique o resultado.",
      tags: ["python", "lists"],
    });

    expect(parsed.success).toBe(false);
  });
});
