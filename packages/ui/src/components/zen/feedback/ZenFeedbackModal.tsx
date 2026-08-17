"use client";

import { HankoMarkSvg, SumiDividerSvg } from "@kodan/ui/assets/zen/sumi-strokes";
import { cn } from "@kodan/ui/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronLeft, ChevronRight, Eye, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  userAnswer?: string;
  feedback: ZenFeedbackData;
  referenceAnswer?: string;
  canViewAnswer?: boolean;
  answerAlreadyRevealed?: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onViewAnswer: () => void;
  onNextChallenge?: () => void;
};

type FeedbackStep = "answer" | "attention" | "reference";

const pointStyle: Record<ZenFeedbackPointStatus, string> = {
  correct: "[--zen-point:var(--zen-moss)]",
  wrong: "[--zen-point:var(--zen-hanko)]",
  missing: "[--zen-point:var(--zen-muted)]",
};

const steps: Array<{ id: FeedbackStep; label: string }> = [
  { id: "answer", label: "Sua resposta" },
  { id: "attention", label: "Pontos de atenção" },
  { id: "reference", label: "Resposta completa" },
];

export function ZenFeedbackModal({
  open,
  title = "Resultado do treino",
  taskName,
  userAnswer,
  feedback,
  referenceAnswer,
  canViewAnswer,
  answerAlreadyRevealed = false,
  onClose,
  onTryAgain,
  onViewAnswer,
  onNextChallenge,
}: ZenFeedbackModalProps) {
  const [answerRevealed, setAnswerRevealed] = useState(answerAlreadyRevealed);
  const [activeStep, setActiveStep] = useState<FeedbackStep>(
    answerAlreadyRevealed ? "attention" : "answer",
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const maxScore = feedback.maxScore ?? 10;
  const isPerfectScore = feedback.score >= maxScore;
  const isBelowCutoff = feedback.score < 7;
  const isPartialScore = !isPerfectScore && !isBelowCutoff;
  const scorePercentage = Math.min(Math.max((feedback.score / maxScore) * 100, 0), 100);
  const hasReferenceAnswer = Boolean(referenceAnswer);
  const canRevealAnswer = canViewAnswer ?? isPartialScore;
  const isAnswerRevealed = answerRevealed || answerAlreadyRevealed;
  const visibleStep = answerAlreadyRevealed && activeStep === "answer" ? "attention" : activeStep;

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeStep, answerAlreadyRevealed]);

  function retry() {
    setAnswerRevealed(false);
    setActiveStep("answer");
    onTryAgain();
  }

  function revealAnswer() {
    setAnswerRevealed(true);
    setActiveStep("attention");
    onViewAnswer();
  }

  function goToNextStep() {
    if (visibleStep === "answer") setActiveStep("attention");
    else if (visibleStep === "attention" && hasReferenceAnswer) setActiveStep("reference");
  }

  function goToPreviousStep() {
    if (visibleStep === "reference") setActiveStep("attention");
    else if (visibleStep === "attention") setActiveStep("answer");
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[color:color-mix(in_oklch,var(--zen-washi)_66%,transparent)] backdrop-blur-[2px]" />
        <ZenMotionProvider>
          <DialogPrimitive.Content asChild>
            <m.section
              variants={paperSlide}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="zen-paper zen-ink-edge fixed left-1/2 top-1/2 z-50 flex max-h-[min(86vh,44rem)] w-[min(92vw,44rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-[color:var(--zen-border)] text-[color:var(--zen-ink)] shadow-[0_24px_70px_color-mix(in_oklch,var(--zen-ink)_36%,transparent)]"
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
                <DialogPrimitive.Close asChild>
                  <ZenButton variant="washi" className="size-8 min-h-8 shrink-0 px-0 text-[color:var(--zen-muted)]" aria-label="Fechar resultado">
                    <X className="size-4" />
                  </ZenButton>
                </DialogPrimitive.Close>
              </header>

              <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                <div className="space-y-5">
                  <section className="grid gap-7 sm:grid-cols-[1.2fr_0.8fr]">
                    <div className="border-l-2 border-[color:var(--zen-hanko)] pl-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--zen-muted)]">Avaliação</p>
                      <p className="mt-2 font-serif text-4xl leading-none">{feedback.score.toFixed(1)}<span className="ml-1 text-base text-[color:var(--zen-muted)]">/{maxScore}</span></p>
                      <div className="mt-4 h-px bg-[color:var(--zen-border)]"><div className="h-full bg-[color:var(--zen-hanko)]" style={{ width: `${scorePercentage}%` }} /></div>
                    </div>
                    <div className="border-l-2 border-[color:var(--zen-moss)] pl-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--zen-muted)]">Evolução</p>
                      <p className="mt-3 text-xl font-semibold text-[color:var(--zen-moss)]">{feedback.eloVariation > 0 ? "+" : ""}{feedback.eloVariation} ELO</p>
                      <p className="mt-2 text-xs/relaxed text-[color:var(--zen-muted)]">Cada revisão deixa o diagnóstico mais preciso.</p>
                    </div>
                  </section>

                  <SumiDividerSvg className="h-4 w-full text-[color:var(--zen-border)]" />

                  <FeedbackStepper activeStep={visibleStep} answerRevealed={isAnswerRevealed} hasReferenceAnswer={hasReferenceAnswer} onStepChange={setActiveStep} />

                  <div className="min-h-[12rem]">
                    {visibleStep === "answer" ? <AnswerStep answer={userAnswer} /> : null}
                    {visibleStep === "attention" ? <AttentionStep feedback={feedback} isBelowCutoff={isBelowCutoff} isPartialScore={isPartialScore} answerRevealed={isAnswerRevealed} /> : null}
                    {visibleStep === "reference" ? <ReferenceStep answer={referenceAnswer} /> : null}
                  </div>
                </div>
              </div>

              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--zen-border)] px-5 py-4 sm:px-7">
                {isBelowCutoff && !isAnswerRevealed ? <ZenButton variant="hanko" onClick={retry}><RotateCcw className="size-4" />Tentar novamente</ZenButton> : null}
                {isPartialScore && !isAnswerRevealed ? <ZenButton variant="ink" onClick={retry}><RotateCcw className="size-4" />Tentar novamente</ZenButton> : null}
                {!isAnswerRevealed && canRevealAnswer ? <ZenButton variant="moss" onClick={revealAnswer}><Eye className="size-4" />Ver resposta</ZenButton> : null}
                {isAnswerRevealed && visibleStep !== "answer" ? <ZenButton variant="washi" onClick={goToPreviousStep}><ChevronLeft className="size-4" />Anterior</ZenButton> : null}
                {isAnswerRevealed && visibleStep !== "reference" && hasReferenceAnswer ? <ZenButton variant="moss" onClick={goToNextStep}>Próximo<ChevronRight className="size-4" /></ZenButton> : null}
                {isAnswerRevealed ? <ZenButton variant="ink" onClick={isPerfectScore ? (onNextChallenge ?? onClose) : onClose}>{isPerfectScore ? <><Check className="size-4" />Próximo desafio</> : "Fechar"}</ZenButton> : null}
              </footer>
            </m.section>
          </DialogPrimitive.Content>
        </ZenMotionProvider>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function FeedbackStepper({
  activeStep,
  answerRevealed,
  hasReferenceAnswer,
  onStepChange,
}: {
  activeStep: FeedbackStep;
  answerRevealed: boolean;
  hasReferenceAnswer: boolean;
  onStepChange: (step: FeedbackStep) => void;
}) {
  return (
    <nav aria-label="Etapas da resposta" className="grid grid-cols-3 border-y border-[color:var(--zen-border)]">
      {steps.map((step) => {
        const disabled = (step.id === "reference" && (!answerRevealed || !hasReferenceAnswer)) || (step.id === "attention" && !answerRevealed);
        const active = activeStep === step.id;
        return (
          <button
            key={step.id}
            type="button"
            disabled={disabled}
            aria-current={active ? "step" : undefined}
            className={cn(
              "zen-focus min-h-11 border-r border-[color:var(--zen-border)] px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.08em] last:border-r-0",
              active ? "bg-[color:color-mix(in_oklch,var(--zen-moss)_12%,var(--zen-washi))] text-[color:var(--zen-ink)]" : "text-[color:var(--zen-muted)]",
              disabled ? "cursor-not-allowed opacity-45" : "hover:text-[color:var(--zen-ink)]",
            )}
            onClick={() => !disabled && onStepChange(step.id)}
          >
            <span className="mr-1 text-[color:var(--zen-moss)]">{step.id === "answer" ? "01" : step.id === "attention" ? "02" : "03"}</span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}

function AnswerStep({ answer }: { answer?: string }) {
  return answer ? (
    <section className="border border-[color:var(--zen-border)] px-4 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">Sua resposta</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm/relaxed text-[color:var(--zen-muted)]">{answer}</p>
    </section>
  ) : (
    <ZenMessage title="Sua resposta">A resposta enviada aparecerá aqui para você revisar antes de comparar com a referência.</ZenMessage>
  );
}

function AttentionStep({
  feedback,
  isBelowCutoff,
  isPartialScore,
  answerRevealed,
}: {
  feedback: ZenFeedbackData;
  isBelowCutoff: boolean;
  isPartialScore: boolean;
  answerRevealed: boolean;
}) {
  return (
    <div className="space-y-4">
      {isBelowCutoff ? <ZenMessage title="O traço ainda pede revisão">Você ficou abaixo da nota de corte. Revise o diagnóstico e compare os pontos em aberto antes de tentar novamente.</ZenMessage> : null}
      {isPartialScore && !answerRevealed ? <ZenMessage title="Boa leitura do problema">Você encontrou parte dos sinais. Use “Ver resposta” para liberar os pontos restantes e a referência completa.</ZenMessage> : null}
      {feedback.techLeadFeedback ? <ZenMessage title="Feedback do Tech Lead">{feedback.techLeadFeedback}</ZenMessage> : null}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">Pontos de atenção</h3>
        <ul className="mt-4 space-y-3">
          {feedback.points.map((point) => <Point key={`${point.status}:${point.title}`} point={point} concealed={!answerRevealed && point.status === "missing"} />)}
        </ul>
      </section>
    </div>
  );
}

function ReferenceStep({ answer }: { answer?: string }) {
  return answer ? (
    <section className="border border-[color:var(--zen-moss)] px-4 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--zen-moss)]">Resposta completa</h3>
      <div className="mt-4"><ReferenceAnswer source={answer} /></div>
    </section>
  ) : (
    <ZenMessage title="Resposta ainda bloqueada">Tente novamente ou use o botão de ver resposta quando suas tentativas avaliáveis terminarem.</ZenMessage>
  );
}

type ReferenceSection =
  | { kind: "heading"; content: string }
  | { kind: "paragraph"; content: string }
  | { kind: "list"; content: string[] }
  | { kind: "code"; content: string; language?: string };

function ReferenceAnswer({ source }: { source: string }) {
  return (
    <div className="space-y-4 text-sm/relaxed">
      {parseReferenceAnswer(source).map((section) => {
        const key = `${section.kind}:${Array.isArray(section.content) ? section.content.join("|") : section.content}`;
        if (section.kind === "heading") return <h4 key={key} className="font-serif text-lg font-bold text-[color:var(--zen-ink)]">{renderInline(section.content)}</h4>;
        if (section.kind === "list") return <ul key={key} className="list-disc space-y-2 pl-5 text-[color:var(--zen-muted)]">{section.content.map((item, itemId) => <li key={`${item}:${itemId}`}>{renderInline(item)}</li>)}</ul>;
        if (section.kind === "code") return <pre key={key} className="overflow-x-auto border border-[color:var(--zen-border)] bg-[color:var(--zen-ink)] p-3 text-xs text-[color:var(--zen-washi)]"><code>{section.content}</code></pre>;
        return <p key={key} className="text-[color:var(--zen-muted)]">{renderInline(section.content)}</p>;
      })}
    </div>
  );
}

function parseReferenceAnswer(source: string): ReferenceSection[] {
  const sections: ReferenceSection[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] = [];
  let codeLanguage: string | undefined;
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) sections.push({ kind: "paragraph", content: paragraph.join(" ").trim() });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length > 0) sections.push({ kind: "list", content: list });
    list = [];
  };

  for (const line of lines) {
    const embeddedCode = !inCode ? line.match(/```(\w+)?\s*([\s\S]*?)```/) : null;
    if (embeddedCode) {
      flushParagraph();
      flushList();
      const beforeCode = line.slice(0, embeddedCode.index).trim();
      const afterCode = line.slice((embeddedCode.index ?? 0) + embeddedCode[0].length).trim();
      const listItem = beforeCode.match(/^\s*(?:\d+[.)]|[-*])\s+(.+)$/);
      if (listItem) {
        sections.push({ kind: "list", content: [listItem[1]!.trim()] });
      } else if (beforeCode) {
        sections.push({ kind: "paragraph", content: beforeCode });
      }
      sections.push({ kind: "code", content: embeddedCode[2]!.trim(), language: embeddedCode[1] });
      if (afterCode) paragraph.push(afterCode);
      continue;
    }
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      if (inCode) {
        sections.push({ kind: "code", content: code.join("\n"), language: codeLanguage });
        code = [];
        codeLanguage = undefined;
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        codeLanguage = fence[1]?.trim() || undefined;
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    const heading = line.match(/^#{2,6}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      sections.push({ kind: "heading", content: heading[1]!.trim() });
      continue;
    }
    const listItem = line.match(/^\s*(?:\d+[.)]|[-*])\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      list.push(listItem[1]!.trim());
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }
    paragraph.push(line.trim());
  }

  if (inCode) sections.push({ kind: "code", content: code.join("\n"), language: codeLanguage });
  flushParagraph();
  flushList();
  return sections;
}

function renderInline(value: string): ReactNode {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, partId) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={`${part}:${partId}`} className="border border-[color:var(--zen-border)] bg-[color:color-mix(in_oklch,var(--zen-ink)_8%,transparent)] px-1 text-[color:var(--zen-ink)]">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${part}:${partId}`} className="font-semibold text-[color:var(--zen-ink)]">{part.slice(2, -2)}</strong>;
    return <span key={`${part}:${partId}`}>{part}</span>;
  });
}

function ZenMessage({ title, children }: { title: string; children: string }) {
  return <section className="border-l-2 border-[color:var(--zen-hanko)] bg-[color:color-mix(in_oklch,var(--zen-hanko)_5%,var(--zen-washi))] px-4 py-3"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs/relaxed text-[color:var(--zen-muted)]">{children}</p></section>;
}

function Point({ point, concealed = false }: { point: ZenFeedbackPoint; concealed?: boolean }) {
  const symbol = point.status === "correct" ? "✓" : point.status === "wrong" ? "×" : "?";
  return <li className={cn("grid grid-cols-[1.5rem_1fr] gap-3", pointStyle[point.status])}><span className="grid size-6 place-items-center border border-[color:var(--zen-point)] text-xs font-semibold text-[color:var(--zen-point)]">{symbol}</span><span><span className="block text-sm font-medium">{concealed ? "Ponto ainda não revelado" : point.title}</span>{!concealed && point.description ? <span className="mt-0.5 block text-xs/relaxed text-[color:var(--zen-muted)]">{point.description}</span> : null}</span></li>;
}
