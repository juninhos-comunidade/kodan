"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle, MailCheck, MailQuestion } from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { authClient } from "@/lib/auth-client";
import { PENDING_VERIFICATION_EMAIL_KEY } from "./verification-email-utils";

export function VerificationEmailForm({
  enabled,
  initialError,
}: {
  enabled: boolean;
  initialError: string | null;
}) {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "accepted" | "error">(
    initialError ? "error" : "idle",
  );

  useEffect(() => {
    try {
      const pendingEmail = window.sessionStorage.getItem(
        PENDING_VERIFICATION_EMAIL_KEY,
      );
      if (pendingEmail && emailInputRef.current) {
        emailInputRef.current.value = pendingEmail;
      }
    } catch {
      // O endereço pode ser informado manualmente.
    }
  }, []);

  if (!enabled) {
    return (
      <div className="space-y-6 text-center">
        <MailQuestion className="mx-auto size-14 text-amber-700" aria-hidden="true" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verificação por e-mail indisponível</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">A entrega transacional não está configurada neste ambiente.</p>
        </div>
        <Link href="/login"><Button className="w-full">Entrar no Kodan</Button></Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/inicio",
    });
    setStatus(error ? "error" : "accepted");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {status === "accepted" ? <MailCheck className="mx-auto size-14 text-emerald-700" aria-hidden="true" /> : null}
        <h2 className="mt-3 text-2xl font-bold text-gray-900">Confirme seu e-mail</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          {status === "accepted"
            ? "Se o endereço estiver associado a uma conta pendente, um novo link foi solicitado."
            : "Informe o endereço da conta para solicitar um link de verificação."}
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="verification-email">E-mail</Label>
          <Input ref={emailInputRef} id="verification-email" name="email" type="email" autoComplete="email" required />
        </div>
        {status === "error" ? <p role="alert" className="text-sm text-red-700">O link anterior é inválido ou não foi possível solicitar um novo envio.</p> : null}
        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Enviar e-mail de verificação
        </Button>
      </form>
      <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-gray-800">Voltar ao login</Link>
    </div>
  );
}
