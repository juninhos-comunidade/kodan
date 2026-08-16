import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { getLoginHref, getRegisterHref } from "@/lib/auth-navigation";

type AuthView = "login" | "signup" | "recover";

const copy: Record<
  AuthView,
  { eyebrow: string; headline: string; description: string }
> = {
  login: {
    eyebrow: "Dojo de leitura de código",
    headline: "Entre na sua conta",
    description:
      "Continue seus exercícios de leitura, diagnóstico e explicação de código.",
  },
  signup: {
    eyebrow: "Novo praticante",
    headline: "Crie sua conta",
    description:
      "Comece a treinar leitura, diagnóstico e explicação de código, no seu ritmo.",
  },
  recover: {
    eyebrow: "Recuperação de acesso",
    headline: "Recuperar acesso",
    description:
      "Informe seu e-mail. Vamos te enviar as instruções pra voltar ao treino.",
  },
};

export function AuthPage({
  view,
  callbackURL = "/inicio",
  source,
  children,
}: {
  view: AuthView;
  callbackURL?: string;
  source?: "landing";
  children: ReactNode;
}) {
  const content = copy[view];
  const tabs = [
    {
      id: "login" as const,
      label: "Entrar",
      href: getLoginHref(callbackURL, "login", source) as Route,
    },
    {
      id: "signup" as const,
      label: "Criar conta",
      href: getRegisterHref(callbackURL, source) as Route,
    },
    {
      id: "recover" as const,
      label: "Recuperar",
      href: "/recuperar-senha" as Route,
    },
  ];

  return (
    <section aria-labelledby={`${view}-title`}>
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3.5 font-mono text-[0.65625rem] font-medium tracking-[0.18em] text-[#c7a45d] uppercase">
          {content.eyebrow}
        </p>
        <h1
          id={`${view}-title`}
          className="m-0 font-serif text-[clamp(2rem,5vw,2.9rem)] font-medium leading-[1.15] text-[#f5f0e6]"
        >
          {content.headline}
        </h1>
        <p className="mx-auto mt-3.5 max-w-[48ch] font-mono text-[0.84375rem] leading-[1.7] text-[#f5f0e6]/60">
          {content.description}
        </p>
      </header>

      <nav
        aria-label="Telas de autenticação"
        className="mb-7.5 flex justify-center gap-5.5"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={view === tab.id ? "page" : undefined}
            className={`border-b-2 px-0 py-1 font-mono text-[0.6875rem] tracking-[0.08em] uppercase transition-colors duration-200 ${
              view === tab.id
                ? "border-[#c4432b] text-[#f5f0e6]"
                : "border-transparent text-[#f5f0e6]/40 hover:text-[#f5f0e6]/70"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="auth-screen-in">{children}</div>
    </section>
  );
}
