"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
} from "@fortawesome/free-brands-svg-icons";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {authClient} from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation";
import { getRegisterHref, getSafeCallbackPath } from "@/lib/auth-navigation";
import { useAuthActionFeedback } from "@/components/auth-action-feedback";

const loginSchema = z
  .object({
    email: z.email("E-mail inválido"),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  })
  

type LoginFormValues = z.infer<typeof loginSchema>;


function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getSafeCallbackPath(searchParams.get("callbackURL"), "/inicio");
  const { startAuthAction, finishAuthAction, showAuthError } = useAuthActionFeedback();

  const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  });

  async function onSubmit (formData: LoginFormValues) {
    startAuthAction("Entrando na sua conta...");
    await authClient.signIn.email({
      email: formData.email,
      password: formData.password,
      callbackURL,
    }, 
    {
    onSuccess: (ctx)=> {
      finishAuthAction();
      router.replace(callbackURL)
    },
    onError:(ctx)=>{
      finishAuthAction();
      showAuthError(ctx.error.message || "Confira seu e-mail e senha e tente novamente.");
    }
  })
  };

  function onInvalid() {
    const firstError = Object.values(errors)[0]?.message;
    showAuthError(firstError || "Revise os dados informados e tente novamente.");
  }

  const signInSocial = async (provider: "google" | "github") => {
    startAuthAction(`Redirecionando para ${provider === "google" ? "o Google" : "o GitHub"}...`);
    await authClient.signIn.social(
      { provider, callbackURL },
      {
        onError: (ctx) => {
          finishAuthAction();
          showAuthError(ctx.error.message || "Não foi possível iniciar o login social.");
        },
      },
    );
  };


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
              placeholder="••••••••"
              {...register("password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
className="w-full bg-[#2783c0] hover:bg-[#1f6da0]"
        >
          {isSubmitting ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Entrando...</> : "Entrar"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>

        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-400">
            ou continue com
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => signInSocial("github")}
      >
        <FontAwesomeIcon
          icon={faGithub}
          className="mr-2 h-4 w-4 text-zinc-500"
        />

        <p className="text-black/60">Entrar com GitHub</p>
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-72" aria-label="Carregando login" />}>
      <LoginForm />
    </Suspense>
  );
}
