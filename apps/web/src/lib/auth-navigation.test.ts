import { describe, expect, test } from "bun:test";

import * as authNavigation from "./auth-navigation";
import {
  getLoginHref,
  getPostSignupPath,
  getSafeCallbackPath,
  requiresEmailVerification,
} from "./auth-navigation";

describe("auth navigation", () => {
  test("keeps local callback paths", () => {
    expect(String(getSafeCallbackPath("/train/react-hooks?step=2", "/inicio"))).toBe(
      "/train/react-hooks?step=2",
    );
  });

  test("rejects external and protocol-relative callbacks", () => {
    expect(getSafeCallbackPath("https://evil.example", "/inicio")).toBe(
      "/inicio",
    );
    expect(getSafeCallbackPath("//evil.example", "/inicio")).toBe(
      "/inicio",
    );
  });

  test("builds a registration link with an encoded return path", () => {
    expect(getLoginHref("/train/challenge-1", "register")).toBe(
      "/login?mode=register&callbackURL=%2Ftrain%2Fchallenge-1",
    );
  });

  test("encaminha cadastro não verificado para a confirmação de e-mail", () => {
    expect(String(getPostSignupPath(
      { emailVerified: false, sessionCreated: false },
      "/treinar/challenge-1",
    ))).toBe(
      "/verificar-email",
    );
    expect(String(getPostSignupPath(
      { emailVerified: true, sessionCreated: true },
      "/treinar/challenge-1",
    ))).toBe(
      "/treinar/challenge-1",
    );
  });

  test("segue para a jornada quando a conta sem verificação já recebeu sessão", () => {
    expect(String(getPostSignupPath(
      { emailVerified: false, sessionCreated: true },
      "/treinar/challenge-1",
    ))).toBe("/treinar/challenge-1");
  });

  test("reconhece a resposta de login que exige verificação", () => {
    expect(requiresEmailVerification(403)).toBe(true);
    expect(requiresEmailVerification(401)).toBe(false);
  });

  test("monta callback social intermediário sem aceitar retorno externo", () => {
    expect(typeof authNavigation.getAuthCompletionHref).toBe("function");
    if (typeof authNavigation.getAuthCompletionHref !== "function") return;

    expect(String(authNavigation.getAuthCompletionHref({
      callbackURL: "/treinar/challenge-1",
      provider: "github",
      journey: "login",
      source: "challenge",
    }))).toBe(
      "/auth/concluido?callbackURL=%2Ftreinar%2Fchallenge-1&provider=GITHUB&journey=LOGIN&source=CHALLENGE",
    );
    expect(String(authNavigation.getAuthCompletionHref({
      callbackURL: "https://evil.example",
      provider: "google",
      journey: "signup",
      source: "landing",
    }))).toContain("callbackURL=%2Finicio");
  });

  test("classifica a origem da autenticação com vocabulário fechado", () => {
    expect(typeof authNavigation.getAuthEventSource).toBe("function");
    if (typeof authNavigation.getAuthEventSource !== "function") return;

    expect(authNavigation.getAuthEventSource("landing", "/inicio")).toBe("LANDING");
    expect(authNavigation.getAuthEventSource(null, "/treinar/challenge-1"))
      .toBe("CHALLENGE");
    expect(authNavigation.getAuthEventSource("anything", "/inicio"))
      .toBe("DIRECT");
  });

  test("valida o retorno OAuth antes de registrar o evento", () => {
    expect(typeof authNavigation.parseAuthCompletionParams).toBe("function");
    if (typeof authNavigation.parseAuthCompletionParams !== "function") return;

    expect(authNavigation.parseAuthCompletionParams({
      callbackURL: "/inicio",
      provider: "GOOGLE",
      journey: "SIGNUP",
      source: "LANDING",
    })).toEqual({
      callbackURL: "/inicio",
      event: {
        name: "auth_completed",
        provider: "GOOGLE",
        journey: "SIGNUP",
        source: "LANDING",
      },
    });
    expect(authNavigation.parseAuthCompletionParams({
      callbackURL: "https://evil.example",
      provider: "custom",
      journey: "LOGIN",
      source: "DIRECT",
    })).toBeNull();
  });
});
