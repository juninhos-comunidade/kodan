"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({
  token,
  error,
}: {
  token: string | null;
  error: string | null;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  if (!token || error) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="size-8 text-amber-700" aria-hidden="true" />
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Link inválido ou expirado</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Solicite um novo link para redefinir sua senha com segurança.
          </p>
        </div>
        <Link href="/recuperar-senha"><Button className="w-full">Solicitar novo link</Button></Link>
      </div>
    );
  }
  const resetToken = token;

  if (status === "success") {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto size-14 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Senha redefinida</h2>
          <p className="mt-2 text-sm text-gray-500">O servidor confirmou a alteração e encerrou as outras sessões.</p>
        </div>
        <Link href="/login"><Button className="w-full">Entrar com a nova senha</Button></Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token: resetToken,
    });
    setStatus(resetError ? "error" : "success");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Redefinir senha</h2>
        <p className="mt-2 text-sm text-gray-500">Use pelo menos 8 caracteres.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirmar senha</Label>
          <Input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </div>
        {status === "error" ? <p role="alert" className="text-sm text-red-700">O link pode ter expirado ou as senhas não conferem.</p> : null}
        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Redefinir senha
        </Button>
      </form>
    </div>
  );
}
