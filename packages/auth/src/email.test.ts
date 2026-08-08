import { describe, expect, mock, test } from "bun:test";

import {
  buildAuthEmailOptions,
  createAuthEmailSender,
} from "./email";

describe("createAuthEmailSender", () => {
  test("envia uma mensagem transacional pelo transporte configurado", async () => {
    const send = mock(async () => ({ error: null }));
    const sendAuthEmail = createAuthEmailSender({
      from: "Kodan <conta@kodan.dev>",
      send,
    });

    await sendAuthEmail({
      to: "praticante@example.com",
      subject: "Redefina sua senha",
      text: "Use o link seguro.",
    });

    expect(send).toHaveBeenCalledWith({
      from: "Kodan <conta@kodan.dev>",
      to: "praticante@example.com",
      subject: "Redefina sua senha",
      text: "Use o link seguro.",
    });
  });

  test("falha de forma explícita quando a entrega não está configurada", async () => {
    const sendAuthEmail = createAuthEmailSender({});

    await expect(sendAuthEmail({
      to: "praticante@example.com",
      subject: "Confirme seu e-mail",
      text: "Use o link seguro.",
    })).rejects.toThrow("Entrega de e-mail não configurada");
  });
});

describe("buildAuthEmailOptions", () => {
  test("não exige verificação quando não existe transporte de e-mail", () => {
    expect(buildAuthEmailOptions(null)).toEqual({
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        revokeSessionsOnPasswordReset: true,
        requireEmailVerification: false,
      },
    });
  });

  test("habilita reset e verificação quando a entrega está configurada", async () => {
    const sendAuthEmail = mock(async () => undefined);
    const options = buildAuthEmailOptions(sendAuthEmail);
    const user = { email: "praticante@example.com", name: "Praticante" };

    expect(options.emailAndPassword.requireEmailVerification).toBe(true);
    expect(options.emailVerification).toMatchObject({
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
    });
    if (!("sendResetPassword" in options.emailAndPassword)) {
      throw new Error("Reset deveria estar configurado");
    }
    options.emailAndPassword.sendResetPassword({
      user,
      url: "https://kodan.dev/redefinir?token=secret",
    });
    options.emailVerification?.sendVerificationEmail({
      user,
      url: "https://kodan.dev/verificar?token=secret",
    });
    await Promise.resolve();

    expect(sendAuthEmail).toHaveBeenCalledTimes(2);
  });
});
