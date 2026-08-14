import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { cn } from "@kodan/ui/lib/utils";

export function ChallengeEditorialReview({
  compact = false,
  showCatalogAction = false,
}: {
  compact?: boolean;
  showCatalogAction?: boolean;
}) {
  return (
    <section
      aria-labelledby="editorial-review-title"
      className={cn(
        "border border-[color:var(--challengers-border-strong,var(--dojo-border))] bg-[var(--challengers-panel,var(--dojo-surface))]",
        compact ? "rounded-lg p-4" : "mx-auto max-w-2xl rounded-2xl p-7 sm:p-10",
      )}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[color:var(--challengers-border-strong,var(--dojo-border))] text-[var(--challengers-muted,var(--dojo-muted))]">
          <LockKeyhole className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--challengers-muted,var(--dojo-muted))]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Em revisão
          </p>
          <h1 id="editorial-review-title" className={cn("mt-2 font-serif font-bold text-[var(--challengers-ink,var(--dojo-ink))]", compact ? "text-lg" : "text-3xl")}>
            Desafio em revisão editorial
          </h1>
          <p className="mt-3 max-w-[62ch] text-sm leading-6 text-[var(--challengers-muted,var(--dojo-muted))]">
            Estamos validando o enunciado, a solução e os critérios de avaliação antes de liberar este desafio. Assim, um possível erro de conteúdo não afeta seu resultado nem seu ELO.
          </p>
          {showCatalogAction ? (
            <Link href="/desafios" className="mt-6 inline-flex min-h-10 items-center rounded-lg border border-[color:var(--challengers-border-strong,var(--dojo-border))] px-4 text-sm font-semibold text-[var(--challengers-ink,var(--dojo-ink))]">
              Voltar aos desafios
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
