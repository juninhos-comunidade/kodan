"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, Lock, Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ZenButton } from "@kodan/ui/components/zen";
import { useAuthActionFeedback } from "@/components/auth-action-feedback";
import { AuthInput } from "@/components/auth-input";
import { AuthPage } from "@/components/auth-page";
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

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getSafeCallbackPath(
    searchParams.get("callbackURL"),
    "/inicio",
  );
  const { startAuthAction, finishAuthAction, showAuthError } =
    useAuthActionFeedback();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(formData: LoginFormValues) {
    startAuthAction("Entrando na sua conta…");
    await authClient.signIn.email(
      { ...formData, callbackURL },
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
    showAuthError(
      Object.values(errors)[0]?.message ||
        "Revise os dados informados e tente novamente.",
    );
  }

  async function signInWithProvider(provider: "github" | "google") {
    const providerName = provider === "github" ? "GitHub" : "Google";
    startAuthAction(`Redirecionando para o ${providerName}…`);
    await authClient.signIn.social(
      { provider, callbackURL },
      {
        onError: (context) => {
          finishAuthAction();
          showAuthError(
            context.error.message ||
              `Não foi possível iniciar o login com ${providerName}.`,
          );
        },
      },
    );
  }

  return (
    <AuthPage view="login" callbackURL={callbackURL}>
      <div className="mx-auto grid max-w-[45rem] items-center gap-5 md:grid-cols-[1fr_2rem_1fr]">
        <form
          className="space-y-3"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          <label htmlFor="email" className="sr-only">
            E-mail
          </label>
          <AuthInput
            id="email"
            icon={Mail}
            type="email"
            autoComplete="username"
            placeholder="ID de Praticante ou e-mail"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <label htmlFor="password" className="sr-only">
            Senha
          </label>
          <AuthInput
            id="password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Senha"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="grid size-8 shrink-0 place-items-center rounded-md text-[#f5f0e6]/45 transition-colors hover:text-[#f5f0e6] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#c4432b]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            }
          />
          <ZenButton
            type="submit"
            variant="hanko"
            disabled={isSubmitting}
            className="mt-1.5 w-full py-3.5"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Entrando…
              </span>
            ) : (
              "Entrar"
            )}
          </ZenButton>
        </form>

        <div
          aria-hidden="true"
          className="hidden text-center font-mono text-base text-[#f5f0e6]/30 md:block"
        >
          /
        </div>

        <SocialLoginSection
          onSignIn={(provider) => void signInWithProvider(provider)}
        />
      </div>

      <div className="mt-6.5 text-center">
        <Link
          href="/recuperar-senha"
          className="font-mono text-[0.78125rem] text-[#c7a45d] underline underline-offset-3"
        >
          Esqueceu a senha?
        </Link>
      </div>
      <p className="mt-3.5 text-center font-mono text-[0.78125rem] text-[#f5f0e6]/55">
        Ainda não é Praticante?{" "}
        <Link
          href={getRegisterHref(callbackURL)}
          className="text-[#c7a45d] underline underline-offset-3"
        >
          Criar conta
        </Link>
      </p>
    </AuthPage>
  );
}
