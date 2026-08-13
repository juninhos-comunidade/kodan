"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  Eye,
  EyeOff,
  Github,
  LoaderCircle,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ZenButton } from "@kodan/ui/components/zen";
import { useAuthActionFeedback } from "@/components/auth-action-feedback";
import { AuthInput } from "@/components/auth-input";
import { AuthPage } from "@/components/auth-page";
import { authClient } from "@/lib/auth-client";
import {
  getLoginHref,
  getPostSignupPath,
  getSafeCallbackPath,
} from "@/lib/auth-navigation";
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

type RegisterFormValues = z.infer<typeof registerSchema>;

function CadastroForm() {
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
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(formData: RegisterFormValues) {
    startAuthAction("Criando sua conta...");
    await authClient.signUp.email(
      {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        callbackURL,
      },
      {
        onSuccess: (context) => {
          finishAuthAction();
          const emailVerified = Boolean(context.data.user.emailVerified);
          const sessionCreated = Boolean(context.data.token);
          if (!emailVerified && !sessionCreated) {
            rememberPendingVerificationEmail(formData.email);
          }
          router.replace(
            getPostSignupPath({ emailVerified, sessionCreated }, callbackURL),
          );
        },
        onError: (ctx) => {
          finishAuthAction();
          showAuthError(
            ctx.error.message ||
              "Não foi possível criar sua conta. Tente novamente.",
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
    startAuthAction(`Redirecionando para o ${providerName}...`);
    await authClient.signIn.social(
      { provider, callbackURL },
      {
        onError: (ctx) => {
          finishAuthAction();
          showAuthError(
            ctx.error.message ||
              `Não foi possível iniciar o cadastro com ${providerName}.`,
          );
        },
      },
    );
  }

  return (
    <AuthPage view="signup" callbackURL={callbackURL}>
      <div className="mx-auto grid max-w-[45rem] items-center gap-5 md:grid-cols-[1fr_2rem_1fr]">
        <form
          className="space-y-3"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          <label htmlFor="name" className="sr-only">
            Nome
          </label>
          <AuthInput
            id="name"
            icon={User}
            autoComplete="name"
            placeholder="Nome"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <label htmlFor="email" className="sr-only">
            E-mail
          </label>
          <AuthInput
            id="email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="E-mail"
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
            autoComplete="new-password"
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
          <label htmlFor="confirmPassword" className="sr-only">
            Confirmar senha
          </label>
          <AuthInput
            id="confirmPassword"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirmar senha"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
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
                Criando conta...
              </span>
            ) : (
              "Criar conta"
            )}
          </ZenButton>
        </form>

        <div
          aria-hidden="true"
          className="hidden text-center font-mono text-base text-[#f5f0e6]/30 md:block"
        >
          /
        </div>

        <div className="space-y-3">
          <ZenButton
            type="button"
            variant="washi"
            className="w-full justify-start py-3"
            onClick={() => signInWithProvider("github")}
          >
            <span className="inline-flex items-center gap-3">
              <Github className="size-4" />
              Continuar com GitHub
            </span>
          </ZenButton>
          <ZenButton
            type="button"
            variant="washi"
            aria-label="Continuar com Google"
            className="w-full justify-start py-3"
            onClick={() => signInWithProvider("google")}
          >
            <span className="inline-flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-4 place-items-center rounded-full border border-current font-mono text-[0.6rem] font-bold"
              >
                G
              </span>
              Continuar com Google
            </span>
          </ZenButton>
          <p className="mt-1.5 font-mono text-[0.6875rem] tracking-[0.03em] text-[#c7a45d]">
            Todo Praticante começa como Novice.
          </p>
        </div>
      </div>

      <p className="mt-6.5 text-center font-mono text-[0.78125rem] text-[#f5f0e6]/55">
        Já treina por aqui?{" "}
        <Link
          href={getLoginHref(callbackURL)}
          className="text-[#c7a45d] underline underline-offset-3"
        >
          Entrar
        </Link>
      </p>
    </AuthPage>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={<div className="min-h-72" aria-label="Carregando cadastro" />}
    >
      <CadastroForm />
    </Suspense>
  );
}
