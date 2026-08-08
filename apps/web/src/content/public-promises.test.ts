import { describe, expect, test } from "bun:test";

import {
  APP_DESCRIPTION,
  APP_LOCALE,
  AUTH_PROMISE,
  HELP_COPY,
} from "./public-promises";

describe("promessas publicas", () => {
  test("posiciona o Kodan para entrevistas tecnicas sem limitar a categoria a React", () => {
    expect(APP_DESCRIPTION).toContain("entrevistas técnicas");
    expect(APP_DESCRIPTION).not.toMatch(/React/i);
    expect(APP_LOCALE).toBe("pt-BR");
  });

  test("explica o valor da conta sem personificar a avaliacao como Tech Lead ou IA", () => {
    expect(AUTH_PROMISE.description).toContain("salvar seus diagnósticos");
    expect(AUTH_PROMISE.description).toContain("receber avaliações quando estiverem disponíveis");
    expect(AUTH_PROMISE.description).toContain("acompanhar seu progresso");

    expect(Object.values(AUTH_PROMISE).join(" ")).not.toMatch(
      /Tech Lead|Inteligência Artificial|\bmestre\b|Master the art|Read\. Diagnose\. Improve/i,
    );
  });

  test("explica ELO e disponibilidade da avaliacao sem prometer suporte inexistente", () => {
    expect(HELP_COPY.eloDescription).toContain("avaliação válida");
    expect(HELP_COPY.evaluationDescription).toContain("rubrica validada");
    expect(HELP_COPY.evaluationDescription).toContain("não aprova a resposta nem altera o ELO");
    expect(Object.values(HELP_COPY).join(" ")).not.toMatch(/suporte|Tech Lead/i);
  });
});
