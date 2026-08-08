"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { useAuthActionFeedback } from "@/components/auth-action-feedback";
import { authClient } from "@/lib/auth-client";
import {
  getRegisterHref,
  getSafeCallbackPath,
  requiresEmailVerification,
} from "@/lib/auth-navigation";
import { rememberPendingVerificationEmail } from "../verificar-email/verification-email-form";
import { SocialLoginSection } from "./social-login-section";

const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ githubEnabled }: { githubEnabled: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getSafeCallbackPath(
    searchParams.get("callbackURL"),
    "/inicio",
  );
  const {
    startAuthAction,
    finishAuthAction,
    showAuthError,
  } = useAuthActionFeedback();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(formData: LoginFormValues) {
    startAuthAction("Entrando na sua conta…");
    await authClient.signIn.email(
      {
        email: formData.email,
        password: formData.password,
        callbackURL,
      },
      {
        onSuccess: () => {
          finishAuthAction();
          router.replace(callbackURL);
        },
        onError: (context) => {
          finishAuthAction();
          if (requiresEmailVerification(context.error.status)) {
            rememberPendingVerificationEmail(formData.email);
            router.replace("/verificar-email");
            return;
          }
          showAuthError(
            context.error.message ||
              "Confira seu e-mail e senha e tente novamente.",
          );
        },
      },
    );
  }

  function onInvalid() {
    const firstError = Object.values(errors)[0]?.message;
    showAuthError(
      firstError || "Revise os dados informados e tente novamente.",
    );
  }

  async function signInWithGithub() {
    startAuthAction("Redirecionando para o GitHub…");
    await authClient.signIn.social(
      { provider: "github", callbackURL },
      {
        onError: (context) => {
          finishAuthAction();
          showAuthError(
            context.error.message ||
              "Não foi possível iniciar o login social.",
          );
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Entrar na sua conta
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Não tem conta?{" "}
          <Link
            href={getRegisterHref(callbackURL)}
            className="font-medium text-violet-600 hover:text-violet-500"
          >
            Criar conta
          </Link>
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <div className="space-y-1.5 text-black/80">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            {...register("email")}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-black/80">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/recuperar-senha"
              className="text-xs text-violet-600 hover:text-violet-500"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#2783c0] hover:bg-[#1f6da0]"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Entrando…
            </>
          ) : "Entrar"}
        </Button>
      </form>

      <SocialLoginSection
        githubEnabled={githubEnabled}
        onSignIn={() => void signInWithGithub()}
      />
    </div>
  );
}
