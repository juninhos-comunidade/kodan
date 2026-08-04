import { describe, expect, test } from "bun:test";

import { challengeEvaluationRubricSchema } from "./challenge-schemas";

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
