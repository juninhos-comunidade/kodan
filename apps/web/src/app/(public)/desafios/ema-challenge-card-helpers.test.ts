import { describe, expect, it } from "bun:test";

import {
  getChallengeProgress,
  getChallengeTags,
  getStatusPresentation,
} from "./ema-challenge-card-helpers";

describe("ema-challenge-card-helpers", () => {
  it("retorna estado nao iniciado quando nao ha tentativas", () => {
    expect(getStatusPresentation([])).toEqual(
      expect.objectContaining({
        label: "Não iniciado",
        note: "Sem tentativas registradas.",
      }),
    );
  });

  it("retorna estado resolvido quando a ultima tentativa passou", () => {
    expect(getStatusPresentation([{ id: "a1", score: 8 }])).toEqual(
      expect.objectContaining({
        label: "Resolvido",
      }),
    );
  });

  it("mantem resolvido quando uma tentativa de melhoria fica abaixo do corte", () => {
    expect(getStatusPresentation([
      { id: "a2", score: 6.5, sessionStatus: "SOLVED" },
      { id: "a1", score: 7.5, sessionStatus: "SOLVED" },
    ])).toEqual(expect.objectContaining({ label: "Resolvido" }));
  });

  it("usa sete como corte quando nao existe estado persistido", () => {
    expect(getStatusPresentation([{ id: "a1", score: 6.9 }])).toEqual(
      expect.objectContaining({ label: "Em progresso" }),
    );
    expect(getStatusPresentation([{ id: "a1", score: 7 }])).toEqual(
      expect.objectContaining({ label: "Resolvido" }),
    );
  });

  it("retorna estado em progresso quando a ultima tentativa falhou", () => {
    expect(getStatusPresentation([{ id: "a1", score: 3 }])).toEqual(
      expect.objectContaining({
        label: "Em progresso",
      }),
    );
  });

  it("normaliza as tags do desafio para uso nos componentes", () => {
    expect(getChallengeTags("react, hooks,  race condition ,,")).toEqual([
      "react",
      "hooks",
      "race condition",
    ]);
  });

  it("projeta o progresso do desafio a partir da ultima tentativa", () => {
    expect(getChallengeProgress([])).toEqual(
      expect.objectContaining({
        label: "Não iniciado",
        percent: 0,
      }),
    );

    expect(getChallengeProgress([{ id: "a1", score: 3 }])).toEqual(
      expect.objectContaining({
        label: "Em progresso",
        percent: 60,
      }),
    );

    expect(getChallengeProgress([{ id: "a1", score: 8 }])).toEqual(
      expect.objectContaining({
        label: "Resolvido",
        percent: 100,
      }),
    );
  });
});
