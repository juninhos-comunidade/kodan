import { describe, expect, test } from "bun:test";

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
    expect(String(getPostSignupPath(false, "/treinar/challenge-1"))).toBe(
      "/verificar-email",
    );
    expect(String(getPostSignupPath(true, "/treinar/challenge-1"))).toBe(
      "/treinar/challenge-1",
    );
  });

  test("reconhece a resposta de login que exige verificação", () => {
    expect(requiresEmailVerification(403)).toBe(true);
    expect(requiresEmailVerification(401)).toBe(false);
  });
});
