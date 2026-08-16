import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, Trophy } from "lucide-react";

import type { HighlightedCode } from "@/lib/code-highlighting";
import { ChallengeCodePreview } from "./challenge-code-preview";
import type { DashboardChallenge } from "../dashboard-home";

function getDifficultyLabel(difficulty: string) {
  if (difficulty === "EASY") return "Fácil";
  if (difficulty === "HARD") return "Difícil";
  return "Média";
}

type RecommendationReason =
  | "CONTINUE_RECENT"
  | "PERSONALIZED"
  | "POPULAR_BEGINNER"
  | "FALLBACK";

function getRecommendationLabel(reason: RecommendationReason) {
  if (reason === "CONTINUE_RECENT") return "Continue de onde parou";
  if (reason === "POPULAR_BEGINNER") return "Mais praticado para começar";
  return "Recomendado para você";
}

export function RecommendedChallengeCard({
  challenge,
  recommendationReason,
  authenticated = true,
  highlightedCode = null,
}: {
  challenge: DashboardChallenge;
  recommendationReason: RecommendationReason;
  authenticated?: boolean;
  highlightedCode?: HighlightedCode | null;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[color:var(--dojo-border)] bg-transparent">
      <div className="grid xl:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col p-6 sm:p-9">
          <div className="mb-9 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[var(--dojo-accent)]">
            <Trophy className="size-4" aria-hidden="true" />
            {getRecommendationLabel(recommendationReason)}
          </div>
          <h2 className="max-w-md font-serif text-3xl font-bold leading-tight text-[var(--dojo-ink)] sm:text-4xl">{challenge.title}</h2>
          <div className="mt-7 flex flex-wrap gap-8 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--dojo-ink-soft)]">Dificuldade</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--dojo-accent)]">
                <BarChart3 className="size-4" aria-hidden="true" />
                {getDifficultyLabel(challenge.difficulty)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--dojo-ink-soft)]">Tempo estimado</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="size-4" aria-hidden="true" />12 min
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-[70ch] text-sm leading-6 text-[var(--dojo-muted)]">{challenge.question}</p>
          <div className="mt-auto pt-7">
            <div className="mb-6 flex flex-wrap gap-2">
              {challenge.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-lg border border-[color:var(--dojo-border-strong)] bg-[var(--dojo-surface)] px-3 py-2 text-xs text-[var(--dojo-ink-soft)]">{tag}</span>
              ))}
            </div>
            <Link href={`/treinar/${challenge.id}`} className="inline-flex min-h-11 items-center gap-4 rounded-xl bg-[var(--dojo-accent)] px-5 py-3 text-sm font-semibold text-[var(--dojo-surface)] transition-colors duration-200 hover:bg-[var(--dojo-accent-strong)]">
              {authenticated ? "Continuar treino" : "Começar diagnóstico"} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="p-4 sm:p-6 xl:pl-8">
          {challenge.code
            ? <ChallengeCodePreview code={challenge.code} highlightedCode={highlightedCode} />
            : (
                <div className="flex min-h-80 items-center rounded-xl border border-[color:var(--dojo-border)] bg-[var(--dojo-surface)] p-8">
                  <p className="font-serif text-2xl leading-relaxed text-[var(--dojo-ink)]">{challenge.question}</p>
                </div>
              )}
        </div>
      </div>
    </article>
  );
}
