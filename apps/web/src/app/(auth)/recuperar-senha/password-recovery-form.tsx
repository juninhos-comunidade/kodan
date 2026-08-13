"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Mail, MailCheck, MailWarning } from "lucide-react";

import { ZenButton } from "@kodan/ui/components/zen";
import { AuthInput } from "@/components/auth-input";
import { AuthPage } from "@/components/auth-page";
import { authClient } from "@/lib/auth-client";

import { PASSWORD_RECOVERY_ACCEPTED_COPY } from "./password-recovery-copy";

export function PasswordRecoveryForm({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "accepted" | "error"
  >("idle");

  if (!enabled) {
    return (
      <AccountEmailUnavailable
        title="Recuperação por e-mail indisponível"
        description="A entrega transacional ainda não está configurada neste ambiente. Nenhuma solicitação foi enviada."
      />
    );
  }

  if (status === "accepted") {
    return (
      <AuthPage view="recover">
        <div className="mx-auto max-w-[23.75rem] text-center">
          <MailCheck
            className="mx-auto size-10 text-[#c7a45d]"
            aria-hidden="true"
          />
          <h2 className="mt-4 font-serif text-2xl text-[#f5f0e6]">
            {PASSWORD_RECOVERY_ACCEPTED_COPY.title}
          </h2>
          <p className="mt-2 font-mono text-sm leading-6 text-[#f5f0e6]/60">
            {PASSWORD_RECOVERY_ACCEPTED_COPY.description}
          </p>
          <ZenButton
            variant="washi"
            className="mt-5 w-full py-3"
            onClick={() => setStatus("idle")}
          >
            Enviar novamente
          </ZenButton>
          <LoginLink />
        </div>
      </AuthPage>
    );
  }

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    const email = String(formData.get("email") ?? "").trim();
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/redefinir-senha",
    });
    setStatus(error ? "error" : "accepted");
  }

  return (
    <AuthPage view="recover">
      <form
        className="mx-auto max-w-[23.75rem] space-y-3"
        action={handleSubmit}
      >
        <label htmlFor="recovery-email" className="sr-only">
          E-mail
        </label>
        <AuthInput
          id="recovery-email"
          name="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          required
        />
        {status === "error" ? (
          <p role="alert" className="font-mono text-xs text-[#e98572]">
            Não foi possível solicitar o link agora. Tente novamente em
            instantes.
          </p>
        ) : null}
        <ZenButton
          type="submit"
          variant="hanko"
          disabled={status === "submitting"}
          className="mt-1.5 w-full py-3.5"
        >
          {status === "submitting" ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              Solicitando…
            </span>
          ) : (
            "Enviar link de recuperação"
          )}
        </ZenButton>
      </form>
      <LoginLink />
    </AuthPage>
  );
}

function AccountEmailUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AuthPage view="recover">
      <div className="mx-auto max-w-[23.75rem] text-center">
        <MailWarning
          className="mx-auto size-10 text-[#c7a45d]"
          aria-hidden="true"
        />
        <h2 className="mt-4 font-serif text-2xl text-[#f5f0e6]">{title}</h2>
        <p className="mt-2 font-mono text-sm leading-6 text-[#f5f0e6]/60">
          {description}
        </p>
        <LoginLink />
      </div>
    </AuthPage>
  );
}

function LoginLink() {
  return (
    <p className="mt-6.5 text-center font-mono text-[0.78125rem] text-[#f5f0e6]/55">
      Lembrou a senha?{" "}
      <Link
        href="/login"
        className="text-[#c7a45d] underline underline-offset-3"
      >
        Entrar
      </Link>
    </p>
  );
}
