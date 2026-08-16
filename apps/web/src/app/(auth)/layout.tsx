"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ZenButton } from "@kodan/ui/components/zen";

const logoLight = "/brand/kodan_icone_claro.svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      data-auth-shell="true"
      className="dark relative flex min-h-svh w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#171512_0%,#111111_55%,#0a0a0a_100%)] text-[#f5f0e6]"
    >
      <style>{`
        @keyframes authArcSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes authScreenIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .auth-arc-spin { animation: authArcSpin 140s linear infinite; transform-origin: 280px 280px; }
        .auth-screen-in { animation: authScreenIn 400ms cubic-bezier(.4, 0, .2, 1); }
        [data-auth-shell="true"] input:-webkit-autofill {
          -webkit-text-fill-color: #f5f0e6;
          box-shadow: 0 0 0 1000px #1b1a17 inset;
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-arc-spin, .auth-screen-in { animation: none; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] [background-size:3px_3px]"
      />
      <svg
        aria-hidden="true"
        width="560"
        height="560"
        viewBox="0 0 560 560"
        className="auth-arc-spin pointer-events-none absolute -right-[190px] -top-[170px]"
      >
        <circle
          cx="280"
          cy="280"
          r="120"
          fill="none"
          stroke="#c4432b"
          strokeWidth="2.4"
          strokeDasharray="640 100"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle
          cx="280"
          cy="280"
          r="175"
          fill="none"
          stroke="#c7a45d"
          strokeWidth="2"
          strokeDasharray="760 140"
          strokeLinecap="round"
          opacity="0.38"
        />
        <circle
          cx="280"
          cy="280"
          r="230"
          fill="none"
          stroke="#68745c"
          strokeWidth="1.6"
          strokeDasharray="900 180"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>

      <header className="relative z-10 flex items-center justify-between px-[clamp(1.25rem,5vw,4rem)] py-5.5">
        <Link
          href="/inicio"
          aria-label="Ir para o início do Kodan"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src={logoLight}
            alt=""
            width={330}
            height={320}
            className="size-8 object-contain"
            priority
          />
          <span className="font-serif text-[1.1875rem] text-[#f5f0e6]">
            Kodan
          </span>
        </Link>

        <ZenButton variant="hanko" onClick={() => router.push("/cadastro")}>
          Criar conta
        </ZenButton>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-[clamp(1.25rem,6vw,4rem)] pt-5 pb-15">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>

      <footer className="relative z-10 flex items-center justify-between px-[clamp(1.25rem,5vw,4rem)] py-4.5 font-mono text-[0.71875rem] tracking-[0.03em] text-[#f5f0e6]/35">
        <Link
          href="/ajuda"
          className="transition-colors hover:text-[#f5f0e6]/70"
        >
          Política de Privacidade
        </Link>
        <span>© {new Date().getFullYear()} Kodan</span>
      </footer>
    </div>
  );
}
