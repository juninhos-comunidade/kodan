import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: mock(async () => ({ error: null })),
    resetPassword: mock(async () => ({ error: null })),
    sendVerificationEmail: mock(async () => ({ error: null })),
  },
}));

const { PasswordRecoveryForm } = await import("./recuperar-senha/password-recovery-form");
const { ResetPasswordForm } = await import("./redefinir-senha/reset-password-form");
const { VerificationEmailForm } = await import("./verificar-email/verification-email-form");

test("oferece recuperação real somente quando a entrega está configurada", () => {
  const enabled = renderToStaticMarkup(<PasswordRecoveryForm enabled />);
  const disabled = renderToStaticMarkup(<PasswordRecoveryForm enabled={false} />);

  expect(enabled).toContain("Enviar link de recuperação");
  expect(enabled).toContain('type="email"');
  expect(disabled).toContain("Recuperação por e-mail indisponível");
  expect(disabled).not.toContain("Enviar link de recuperação");
});

test("só permite redefinição quando existe token verificado", () => {
  const enabled = renderToStaticMarkup(
    <ResetPasswordForm token="valid-token" error={null} />,
  );
  const invalid = renderToStaticMarkup(
    <ResetPasswordForm token={null} error="INVALID_TOKEN" />,
  );

  expect(enabled).toContain("Redefinir senha");
  expect(enabled).toContain('minLength="8"');
  expect(invalid).toContain("Link inválido ou expirado");
  expect(invalid).not.toContain('name="password"');
});

test("permite solicitar verificação sem afirmar envio antes da resposta", () => {
  const enabled = renderToStaticMarkup(
    <VerificationEmailForm enabled initialError={null} />,
  );
  const disabled = renderToStaticMarkup(
    <VerificationEmailForm enabled={false} initialError={null} />,
  );

  expect(enabled).toContain("Enviar e-mail de verificação");
  expect(enabled).not.toContain("Sua conta já pode ser usada");
  expect(disabled).toContain("Verificação por e-mail indisponível");
});
