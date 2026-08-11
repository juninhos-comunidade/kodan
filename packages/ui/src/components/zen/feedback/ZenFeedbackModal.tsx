"use client";

import { HankoMarkSvg, SumiDividerSvg } from "@kodan/ui/assets/zen/sumi-strokes";
import { cn } from "@kodan/ui/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronRight, Eye, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { ZenButton } from "../zen-button";
import { ZenMotionProvider } from "../motion/runtime";
import { paperSlide } from "../motion/presets";
import { m } from "../motion/primitives";

export type ZenFeedbackPointStatus = "correct" | "wrong" | "missing";

export type ZenFeedbackPoint = {
  title: string;
  description?: string;
  status: ZenFeedbackPointStatus;
};

export type ZenFeedbackData = {
  score: number;
  maxScore?: number;
  eloVariation: number;
  points: ZenFeedbackPoint[];
  techLeadFeedback?: string;
};

export type ZenFeedbackModalProps = {
  open: boolean;
  title?: string;
  taskName: string;
  feedback: ZenFeedbackData;
  onClose: () => void;
  onTryAgain: () => void;
  onViewAnswer: () => void;
  onNextChallenge?: () => void;
};

const pointStyle: Record<ZenFeedbackPointStatus, string> = {
  correct: "[--zen-point:var(--zen-moss)]",
  wrong: "[--zen-point:var(--zen-hanko)]",
  missing: "[--zen-point:var(--zen-muted)]",
};

export function ZenFeedbackModal({
  open,
  title = "Resultado do treino",
  taskName,
  feedback,
  onClose,
  onTryAgain,
  onViewAnswer,
  onNextChallenge,
}: ZenFeedbackModalProps) {
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const maxScore = feedback.maxScore ?? 10;
  const isPerfectScore = feedback.score >= maxScore;
  const isBelowCutoff = feedback.score < 7;
  const isPartialScore = !isPerfectScore && !isBelowCutoff;
  const scorePercentage = Math.min(Math.max((feedback.score / maxScore) * 100, 0), 100);

  function retry() {
    setAnswerRevealed(false);
    onTryAgain();
  }

  function revealAnswer() {
    setAnswerRevealed(true);
    onViewAnswer();
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[color:color-mix(in_oklch,var(--zen-ink)_66%,transparent)] backdrop-blur-[2px]" />
        <ZenMotionProvider>
          <DialogPrimitive.Content asChild>
            <m.section
              variants={paperSlide}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="zen-paper zen-ink-edge fixed left-1/2 top-1/2 z-50 flex max-h-[min(92vh,48rem)] w-[min(92vw,44rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-[color:var(--zen-border)] text-[color:var(--zen-ink)] shadow-[0_24px_70px_color-mix(in_oklch,var(--zen-ink)_36%,transparent)]"
            >
              <header className="flex items-start justify-between gap-4 border-b border-[color:var(--zen-border)] px-5 py-4 sm:px-7">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center border border-[color:var(--zen-hanko)] text-[color:var(--zen-hanko)]">
                      <HankoMarkSvg className="size-6" />
                    </span>
                    <div>
                      <DialogPrimitive.Title className="text-base font-semibold tracking-tight">{title}</DialogPrimitive.Title>
                      <DialogPrimitive.Description className="mt-1 text-xs text-[color:var(--zen-muted)]">{taskName}</DialogPrimitive.Description>
                    </div>
                  </div>
                </div>
                <DialogPrimitive.Close className="zen-focus grid size-8 shrink-0 place-items-center border border-transparent text-[color:var(--zen-muted)] hover:border-[color:var(--zen-border)] hover:text-[color:var(--zen-ink)]" aria-label="Fechar resultado">
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                <div className="space-y-5">
                  <section className="grid gap-7 sm:grid-cols-[1.2fr_0.8fr]">
                    <div className="border-l-2 border-[color:var(--zen-hanko)] pl-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--zen-muted)]">Avaliação</p>
                      <p className="mt-2 font-serif text-4xl leading-none">{feedback.score.toFixed(1)}<span className="ml-1 text-base text-[color:var(--zen-muted)]">/{maxScore}</span></p>
                      <div className="mt-4 h-px bg-[color:var(--zen-border)]"><div className="h-full bg-[color:var(--zen-hanko)]" style={{ width: `${scorePercentage}%` }} /></div>
                    </div>
                    <div className="border-l-2 border-[color:var(--zen-moss)] pl-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--zen-muted)]">Evolução</p>
                      <p className="mt-3 text-xl font-semibold text-[color:var(--zen-moss)]">+{Math.max(0, feedback.eloVariation)} ELO</p>
                      <p className="mt-2 text-xs/relaxed text-[color:var(--zen-muted)]">Cada revisão deixa o diagnóstico mais preciso.</p>
                    </div>
                  </section>

                  <SumiDividerSvg className="h-4 w-full text-[color:var(--zen-border)]" />

                  {isBelowCutoff ? <ZenMessage title="O traço ainda pede revisão">Você ficou abaixo da nota de corte. Revise o diagnóstico e tente novamente com calma.</ZenMessage> : null}
                  {isPartialScore && !answerRevealed ? <ZenMessage title="Boa leitura do problema">Você encontrou parte dos sinais. Revele a referência quando quiser comparar o raciocínio.</ZenMessage> : null}

                  {(isPerfectScore || answerRevealed) ? (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">Pontos observados</h3>
                      <ul className="mt-4 space-y-3">
                        {feedback.points.map((point) => <Point key={point.title} point={point} />)}
                      </ul>
                    </section>
                  ) : null}

                  {isPartialScore && !answerRevealed ? (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">Sinais encontrados</h3>
                      <ul className="mt-4 space-y-3">
                        {feedback.points.map((point) => <Point key={point.title} point={point} concealed={point.status === "missing"} />)}
                      </ul>
                    </section>
                  ) : null}

                  {feedback.techLeadFeedback && (isPerfectScore || answerRevealed) ? <ZenMessage title="Nota do mentor">{feedback.techLeadFeedback}</ZenMessage> : null}
                </div>
              </div>

              <footer className="flex flex-col-reverse gap-2 border-t border-[color:var(--zen-border)] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                {isBelowCutoff ? <ZenButton variant="hanko" className="w-full sm:w-auto" onClick={retry}><RotateCcw className="size-4" />Tentar novamente</ZenButton> : null}
                {isPartialScore && !answerRevealed ? <><ZenButton variant="ink" onClick={retry}><RotateCcw className="size-4" />Tentar novamente</ZenButton><ZenButton variant="moss" onClick={revealAnswer}><Eye className="size-4" />Ver referência</ZenButton></> : null}
                {answerRevealed ? <ZenButton variant="ink" onClick={onClose}>Continuar<ChevronRight className="size-4" /></ZenButton> : null}
                {isPerfectScore ? <ZenButton variant="ink" onClick={onNextChallenge ?? onClose}><Check className="size-4" />Próximo desafio</ZenButton> : null}
              </footer>
            </m.section>
          </DialogPrimitive.Content>
        </ZenMotionProvider>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ZenMessage({ title, children }: { title: string; children: string }) {
  return <section className="border-l-2 border-[color:var(--zen-hanko)] bg-[color:color-mix(in_oklch,var(--zen-hanko)_5%,var(--zen-washi))] px-4 py-3"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs/relaxed text-[color:var(--zen-muted)]">{children}</p></section>;
}

function Point({ point, concealed = false }: { point: ZenFeedbackPoint; concealed?: boolean }) {
  const symbol = point.status === "correct" ? "✓" : point.status === "wrong" ? "×" : "?";
  return <li className={cn("grid grid-cols-[1.5rem_1fr] gap-3", pointStyle[point.status])}><span className="grid size-6 place-items-center border border-[color:var(--zen-point)] text-xs font-semibold text-[color:var(--zen-point)]">{symbol}</span><span><span className="block text-sm font-medium">{concealed ? "— — —" : point.title}</span>{!concealed && point.description ? <span className="mt-0.5 block text-xs/relaxed text-[color:var(--zen-muted)]">{point.description}</span> : null}</span></li>;
}
