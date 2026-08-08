import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import RecuperarSenhaPage from "./recuperar-senha/page";
import RedefinirSenhaPage from "./redefinir-senha/[token]/page";
import VerificarEmailPage from "./verificar-email/page";

test("não simula o envio de recuperação de senha", () => {
  const markup = renderToStaticMarkup(<RecuperarSenhaPage />);

  expect(markup).toContain("Recuperação por e-mail indisponível");
  expect(markup).not.toContain("Enviaremos um link");
  expect(markup).not.toContain("Enviar link de recuperação");
});

test("não permite redefinição sem integração de servidor", () => {
  const markup = renderToStaticMarkup(<RedefinirSenhaPage />);

  expect(markup).toContain("Este link de redefinição não está disponível");
  expect(markup).not.toContain("Redefinir senha");
});

test("não afirma que um e-mail de verificação foi enviado", () => {
  const markup = renderToStaticMarkup(<VerificarEmailPage />);

  expect(markup).toContain("Verificação por e-mail indisponível");
  expect(markup).not.toContain("Sua conta já pode ser usada");
  expect(markup).not.toContain("Enviamos um link");
  expect(markup).not.toContain("Reenviar e-mail");
});
