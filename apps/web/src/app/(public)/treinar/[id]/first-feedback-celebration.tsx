import { Sparkles } from "lucide-react";

export function FirstFeedbackCelebration({
  hasNextChallenge,
}: {
  hasNextChallenge: boolean;
}) {
  return (
    <aside className="mb-5 rounded-[9px] border border-[color:var(--challengers-blue-border)] bg-[var(--challengers-blue-soft)] px-4 py-3">
      <p className="flex items-center gap-2 font-semibold text-[var(--challengers-blue)]">
        <Sparkles className="size-4" aria-hidden="true" />
        Primeiro feedback concluído
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--challengers-ink)]">
        {hasNextChallenge
          ? "Você fechou o primeiro ciclo de diagnóstico. Continue pelo próximo diagnóstico avaliável para transformar o feedback em prática."
          : "Você fechou seu primeiro ciclo de diagnóstico. Explore o catálogo enquanto novos desafios avaliáveis são preparados."}
      </p>
    </aside>
  );
}
