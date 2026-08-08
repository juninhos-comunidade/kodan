"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {authClient} from "@/lib/auth-client"
import {
  getLoginHref,
  getPostSignupPath,
  getSafeCallbackPath,
} from "@/lib/auth-navigation";
import { useAuthActionFeedback } from "@/components/auth-action-feedback";
import { rememberPendingVerificationEmail } from "../verificar-email/verification-email-form";

const registerSchema = z
  .object({
    name: z.string().min(3, "Informe seu nome"),
    email: z.email("E-mail inválido"),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function CadastroForm() {
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getSafeCallbackPath(searchParams.get("callbackURL"), "/inicio");
  const { startAuthAction, finishAuthAction, showAuthError } = useAuthActionFeedback();

  const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
  resolver: zodResolver(registerSchema),
  });

  async function onSubmit (formData: RegisterForm) {
  startAuthAction("Criando sua conta...");
  await authClient.signUp.email({
    name: formData.name,
    email: formData.email,
    password: formData.password,
    callbackURL,
  }, 
  {
  onSuccess: (ctx)=> {
    finishAuthAction();
    const emailVerified = Boolean(ctx.data.user.emailVerified);
    if (!emailVerified) rememberPendingVerificationEmail(formData.email);
    router.replace(getPostSignupPath(emailVerified, callbackURL));
  },
  onError:(ctx)=>{
    finishAuthAction();
    showAuthError(ctx.error.message || "Não foi possível criar sua conta. Tente novamente.");
  }})
};

  function onInvalid() {
    const firstError = Object.values(errors)[0]?.message;
    showAuthError(firstError || "Revise os dados informados e tente novamente.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Criar sua conta
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Já tem conta?{" "}
          <Link
            href={getLoginHref(callbackURL)}
            className="font-medium text-violet-600 hover:text-violet-500"
          >
            Entrar
          </Link>
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            placeholder="João Silva"
            {...register("name")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@exemplo.com"
            {...register("email")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>

          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register("password")}
            />

            <button
              type="button"
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPwd ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>

          <Input
            id="confirmPassword"
            type={showPwd ? "text" : "password"}
            placeholder="Repita a senha"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {isSubmitting ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Criando conta...</> : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400">
        Os Termos de Uso e a Política de Privacidade ainda não estão publicados.
      </p>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="min-h-72" aria-label="Carregando cadastro" />}>
      <CadastroForm />
    </Suspense>
  );
}
