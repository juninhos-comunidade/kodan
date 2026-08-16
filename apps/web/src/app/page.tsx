import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MoveRight } from "lucide-react";

import { KodanLogo } from "@/components/kodan-logo";
import { ProductEventBeacon } from "@/components/product-event-beacon";
import { getLoginHref, getRegisterHref } from "@/lib/auth-navigation";
import { LandingTrackedLink } from "./landing-tracked-link";

export const metadata: Metadata = {
  title: "Kodan | Treino de diagnóstico de código para entrevistas",
  description:
    "Pratique leitura, diagnóstico e explicação de código com desafios técnicos e avaliação baseada em rubricas validadas.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Kodan",
    title: "Kodan | Leia. Diagnostique. Evolua.",
    description:
      "Um dojo para treinar o raciocínio técnico exigido em entrevistas de frontend.",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Kodan, treino de diagnóstico de código",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kodan | Leia. Diagnostique. Evolua.",
    description:
      "Treine leitura, diagnóstico e explicação de código para entrevistas técnicas.",
    images: ["/opengraph-image"],
  },
};

const loginHref = getLoginHref("/inicio", "login", "landing");
const registerHref = getRegisterHref("/inicio", "landing");

export default function HomePage() {
  return (
    <div
      data-landing-page="true"
      className="min-h-svh bg-[oklch(96.5%_0.018_85)] text-[oklch(24%_0.018_70)] dark:bg-[oklch(17%_0.012_75)] dark:text-[oklch(92%_0.016_85)]"
    >
      <ProductEventBeacon
        event={{ name: "landing_viewed" }}
        dedupeKey="landing_viewed"
      />

      <header className="border-b border-[oklch(79%_0.025_80)] dark:border-[oklch(31%_0.014_75)]">
        <div className="mx-auto flex min-h-20 max-w-[90rem] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kodan, página inicial">
            <KodanLogo wordmarkClassName="text-current" />
          </Link>
          <nav
            aria-label="Navegação da apresentação"
            className="hidden items-center gap-7 font-mono text-xs md:flex"
          >
            <a href="#metodo" className="hover:underline hover:underline-offset-4">Método</a>
            <Link href="/desafios" className="hover:underline hover:underline-offset-4">Desafios</Link>
            <Link href="/privacidade" className="hover:underline hover:underline-offset-4">Privacidade</Link>
          </nav>
          <Link
            href={loginHref}
            className="border border-current px-4 py-2.5 font-mono text-xs font-semibold transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[90rem] border-x border-[oklch(79%_0.025_80)] dark:border-[oklch(31%_0.014_75)] lg:grid-cols-[minmax(0,0.88fr)_minmax(32rem,1.12fr)]">
          <div className="flex min-h-[calc(100svh-5rem)] flex-col justify-between px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[oklch(40%_0.08_155)] dark:text-[oklch(72%_0.08_150)]">
                Dojo de diagnóstico técnico
              </p>
              <h1 className="mt-7 max-w-[13ch] font-serif text-[clamp(2.75rem,6.5vw,6.7rem)] font-bold leading-[0.92] tracking-[-0.055em]">
                Treine o raciocínio que entrevistas técnicas cobram.
              </h1>
              <p className="mt-8 max-w-[60ch] text-base leading-7 text-[oklch(39%_0.018_70)] dark:text-[oklch(76%_0.014_80)] sm:text-lg sm:leading-8">
                Leia evidências, formule um diagnóstico e explique sua decisão.
                O Kodan transforma código em prática deliberada, começando por React.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <LandingTrackedLink
                  href="/inicio"
                  event={{ name: "landing_cta_clicked", contextBucket: "START_DIAGNOSIS" }}
                  className="group inline-flex min-h-12 items-center justify-center gap-3 border border-[oklch(33%_0.08_155)] bg-[oklch(33%_0.08_155)] px-5 font-mono text-sm font-semibold text-[oklch(96%_0.015_85)] transition-colors hover:bg-[oklch(27%_0.07_155)]"
                >
                  Começar diagnóstico
                  <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </LandingTrackedLink>
                <LandingTrackedLink
                  href="/desafios"
                  event={{ name: "landing_cta_clicked", contextBucket: "EXPLORE_CATALOG" }}
                  className="inline-flex min-h-12 items-center justify-center border border-current px-5 font-mono text-sm font-semibold hover:bg-[oklch(91%_0.02_85)] dark:hover:bg-[oklch(22%_0.012_75)]"
                >
                  Explorar desafios
                </LandingTrackedLink>
              </div>
            </div>

            <p className="mt-14 flex max-w-[58ch] items-start gap-3 border-t border-[oklch(79%_0.025_80)] pt-5 font-mono text-xs leading-5 text-[oklch(42%_0.018_70)] dark:border-[oklch(31%_0.014_75)] dark:text-[oklch(69%_0.014_80)]">
              <Check className="mt-0.5 size-4 shrink-0 text-[oklch(40%_0.08_155)] dark:text-[oklch(72%_0.08_150)]" />
              Avaliação disponível apenas quando existe uma rubrica validada. Sem promessa automática, sem ELO inventado.
            </p>
          </div>

          <CodePosition />
        </section>

        <section
          id="metodo"
          className="mx-auto max-w-[90rem] border-x border-t border-[oklch(79%_0.025_80)] dark:border-[oklch(31%_0.014_75)]"
        >
          <div className="grid lg:grid-cols-[0.7fr_1.3fr]">
            <div className="border-b border-[oklch(79%_0.025_80)] px-5 py-12 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-16 dark:border-[oklch(31%_0.014_75)]">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[oklch(40%_0.08_155)] dark:text-[oklch(72%_0.08_150)]">Uma repetição completa</p>
              <h2 className="mt-5 max-w-[12ch] font-serif text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">Leia antes de responder.</h2>
            </div>
            <ol className="divide-y divide-[oklch(79%_0.025_80)] dark:divide-[oklch(31%_0.014_75)]">
              <MethodStep number="01" title="Inspecione as evidências" description="Código, estado e comportamento ficam lado a lado para você separar fato de hipótese." />
              <MethodStep number="02" title="Defenda o diagnóstico" description="Explique causa, impacto e correção com suas próprias palavras, como faria em uma entrevista." />
              <MethodStep number="03" title="Compare com a rubrica" description="Quando a avaliação está disponível, o feedback aponta acertos, lacunas e uma próxima pergunta de reflexão." />
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-[90rem] border border-[oklch(79%_0.025_80)] dark:border-[oklch(31%_0.014_75)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-[oklch(31%_0.065_155)] px-5 py-14 text-[oklch(95%_0.015_85)] sm:px-8 lg:px-12 lg:py-20">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[oklch(82%_0.055_90)]">Progresso com lastro</p>
            <h2 className="mt-5 max-w-[17ch] font-serif text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">Seu resultado muda quando a avaliação é válida.</h2>
            <p className="mt-6 max-w-[62ch] leading-7 text-[oklch(86%_0.018_100)]">Uma indisponibilidade do avaliador não aprova sua resposta nem altera o ELO. O treino continua acessível e o estado da avaliação permanece explícito.</p>
          </div>
          <div className="flex flex-col justify-between px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[oklch(40%_0.08_155)] dark:text-[oklch(72%_0.08_150)]">Pronto para a primeira posição?</p>
              <p className="mt-5 max-w-[32ch] font-serif text-3xl font-bold leading-tight">Comece sem cadastro. Entre quando quiser enviar o diagnóstico e salvar o progresso.</p>
            </div>
            <LandingTrackedLink
              href={registerHref}
              event={{ name: "landing_cta_clicked", contextBucket: "CREATE_ACCOUNT" }}
              className="group mt-10 inline-flex min-h-12 items-center justify-between border-b border-current py-3 font-mono text-sm font-semibold"
            >
              Criar conta de Praticante
              <MoveRight className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </LandingTrackedLink>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[90rem] flex-col gap-5 px-5 py-8 font-mono text-xs text-[oklch(43%_0.016_70)] dark:text-[oklch(68%_0.014_80)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>© {new Date().getFullYear()} Kodan. Leia. Diagnostique. Evolua.</p>
        <div className="flex gap-6">
          <Link href="/ajuda" className="hover:underline hover:underline-offset-4">Ajuda</Link>
          <Link href="/privacidade" className="hover:underline hover:underline-offset-4">Privacidade</Link>
        </div>
      </footer>
    </div>
  );
}

function CodePosition() {
  const code = [
    ["01", "const [count, setCount] = useState(0);"],
    ["02", ""],
    ["03", "useEffect(() => {"],
    ["04", "  const timer = setInterval(() => {"],
    ["05", "    setCount(count + 1);"],
    ["06", "  }, 1000);"],
    ["07", ""],
    ["08", "  return () => clearInterval(timer);"],
    ["09", "}, []);"],
  ] as const;

  return (
    <div className="relative flex min-h-[42rem] flex-col justify-center overflow-hidden border-t border-[oklch(79%_0.025_80)] bg-[oklch(21%_0.014_75)] p-5 text-[oklch(90%_0.018_85)] sm:p-8 lg:min-h-full lg:border-l lg:border-t-0 lg:p-12 dark:border-[oklch(31%_0.014_75)]">
      <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:linear-gradient(oklch(60%_0.04_85/.24)_1px,transparent_1px),linear-gradient(90deg,oklch(60%_0.04_85/.24)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative border border-[oklch(43%_0.025_80)] bg-[oklch(17%_0.012_75)] shadow-[8px_8px_0_oklch(10%_0.01_75)]">
        <div className="flex items-center justify-between border-b border-[oklch(37%_0.02_80)] px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[oklch(68%_0.03_85)]">
          <span>posição 001 / stale closure</span>
          <span>React</span>
        </div>
        <pre className="overflow-x-auto py-5 font-mono text-[0.76rem] leading-7 sm:text-sm">
          {code.map(([number, line]) => (
            <span key={number} className="block min-w-max px-4 sm:px-6">
              <span className="mr-5 inline-block w-5 select-none text-right text-[oklch(48%_0.02_80)]">{number}</span>
              <code className={number === "05" ? "text-[oklch(79%_0.12_75)]" : undefined}>{line || " "}</code>
            </span>
          ))}
        </pre>
        <div className="border-t border-[oklch(37%_0.02_80)] p-5 sm:p-6">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[oklch(69%_0.06_150)]">sua análise</p>
          <p className="mt-3 max-w-[55ch] font-serif text-xl leading-7 text-[oklch(94%_0.016_85)]">Por que o contador para em 1, mesmo que o intervalo continue ativo?</p>
          <div className="mt-5 h-14 border border-dashed border-[oklch(42%_0.02_80)] px-4 py-3 font-mono text-xs text-[oklch(55%_0.02_80)]">Escreva sua hipótese antes de comparar…</div>
        </div>
      </div>
    </div>
  );
}

function MethodStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <li className="grid gap-4 px-5 py-9 sm:grid-cols-[4rem_1fr] sm:px-8 lg:px-12">
      <span className="font-mono text-xs text-[oklch(40%_0.08_155)] dark:text-[oklch(72%_0.08_150)]">{number}</span>
      <div>
        <h3 className="font-serif text-2xl font-bold">{title}</h3>
        <p className="mt-2 max-w-[62ch] leading-7 text-[oklch(42%_0.018_70)] dark:text-[oklch(72%_0.014_80)]">{description}</p>
      </div>
    </li>
  );
}
