"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle, MailCheck, MailWarning } from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { authClient } from "@/lib/auth-client";

import { PASSWORD_RECOVERY_ACCEPTED_COPY } from "./password-recovery-copy";

export function PasswordRecoveryForm({ enabled }: { enabled: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "accepted" | "error">("idle");

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
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
            <MailCheck className="size-8 text-emerald-700" aria-hidden="true" />
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {PASSWORD_RECOVERY_ACCEPTED_COPY.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {PASSWORD_RECOVERY_ACCEPTED_COPY.description}
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full text-black/80">Voltar ao login</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: "/redefinir-senha",
    });
    setStatus(error ? "error" : "accepted");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Recuperar senha</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Informe seu e-mail para solicitar um link de redefinição com validade limitada.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="recovery-email">E-mail</Label>
          <Input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {status === "error" ? (
          <p role="alert" className="text-sm text-red-700">
            Não foi possível solicitar o link agora. Tente novamente em instantes.
          </p>
        ) : null}
        <Button type="submit" disabled={status === "submitting"} className="w-full">
          {status === "submitting" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Enviar link de recuperação
        </Button>
      </form>
      <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-gray-800">
        Voltar ao login
      </Link>
    </div>
  );
}

function AccountEmailUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-amber-100">
          <MailWarning className="size-8 text-amber-700" aria-hidden="true" />
        </span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
      </div>
      <Link href="/login">
        <Button variant="outline" className="w-full text-black/80">Voltar ao login</Button>
      </Link>
    </div>
  );
}
