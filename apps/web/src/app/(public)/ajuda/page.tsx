import Link from "next/link";
import { BookOpen, CircleHelp, ClipboardCheck, Swords } from "lucide-react";

import { cn } from "@kodan/ui/lib/utils";
import { HELP_COPY } from "@/content/public-promises";

const helpTopics = [
  { title: "Como iniciar um treino?", description: "Abra Todos os Desafios, escolha um exercício e continue para a arena de treino.", icon: Swords, featured: true, href: "/desafios", linkLabel: "Ver todos os desafios" },
  { title: "Como funciona o ELO?", description: HELP_COPY.eloDescription, icon: BookOpen },
  { title: "Como funciona a avaliação?", description: HELP_COPY.evaluationDescription, icon: ClipboardCheck },
] as const;

export default function HelpPage() {
  return (
    <main className="min-h-full bg-[var(--dojo-page)] px-6 py-12 text-[var(--dojo-ink)] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--dojo-accent)]"><CircleHelp className="size-4" aria-hidden="true" />Central de ajuda</p>
        <h1 className="mt-3 font-serif text-4xl font-bold">Ajuda do Kodan</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--dojo-muted)]">{HELP_COPY.introduction}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {helpTopics.map((topic) => {
            const { title, description, icon: Icon } = topic;
            const featured = "featured" in topic && topic.featured;

            return (
              <article
                key={title}
                className={cn(
                  "rounded-2xl border border-[color:var(--dojo-border)] p-6",
                  featured ? "bg-[var(--dojo-accent-soft)]" : "bg-transparent",
                )}
              >
                {featured ? <span className="mb-4 inline-flex rounded-full border border-[color:var(--dojo-accent-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--dojo-accent)]">Comece aqui</span> : null}
                <Icon className="size-5 text-[var(--dojo-accent)]" aria-hidden="true" />
                <h2 className="mt-5 font-serif text-xl font-bold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--dojo-muted)]">
                  {description}{" "}
                  {"href" in topic ? <Link href={topic.href} className="font-semibold text-[var(--dojo-accent)] underline underline-offset-4">{topic.linkLabel}</Link> : null}
                </p>
              </article>
            );
          })}
        </div>
        <Link href="/inicio" className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-[var(--dojo-accent)] px-5 py-3 text-sm font-semibold text-[var(--dojo-surface)] transition-colors duration-200 hover:bg-[var(--dojo-accent-strong)]">Voltar ao Dojo</Link>
      </div>
    </main>
  );
}
