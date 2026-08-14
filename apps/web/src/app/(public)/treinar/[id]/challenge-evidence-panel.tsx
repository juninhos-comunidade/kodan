"use client";

import {
  BookOpenText,
  CheckCircle2,
  CircleAlert,
  Copy,
  FileCode2,
  Info,
  SquareTerminal,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@kodan/ui/lib/utils";

type Presentation = "code" | "code-terminal" | "terminal" | "concept";
type EvidenceView = "code" | "terminal";
type Language = "react" | "typescript" | "python" | "java" | "go";
type TerminalArtifact = {
  command: string;
  blocks: Array<{
    label: string;
    content: string;
    tone: "neutral" | "success" | "warning" | "error";
  }>;
};

export type ChallengeEvidence = {
  language?: Language;
  presentation?: Presentation;
  code: string | null;
  codeFileName?: string | null;
  scenario?: string | null;
  question: string;
  terminal?: TerminalArtifact | null;
};

export function ChallengeEvidencePanel({
  challenge,
  difficulty,
  onCopyCode,
}: {
  challenge: ChallengeEvidence;
  difficulty: string;
  onCopyCode: () => void;
}) {
  const presentation = challenge.presentation ?? "code";
  const tabs = presentation === "code-terminal"
    ? (["code", "terminal"] as const)
    : presentation === "terminal"
      ? (["terminal"] as const)
      : (["code"] as const);
  const [activeView, setActiveView] = useState<EvidenceView>(tabs[0]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const fileName = challenge.codeFileName ?? getDefaultFileName(challenge.language ?? "react");

  if (presentation === "concept") {
    return (
      <ConceptEvidence
        scenario={challenge.scenario}
        question={challenge.question}
      />
    );
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    setActiveView(tabs[nextIndex]!);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section
      data-presentation={presentation}
      className="challengers-panel flex min-h-[560px] flex-col overflow-hidden rounded-[10px] border xl:min-h-0"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[color:var(--challengers-border)] bg-[var(--challengers-panel)]">
        <div role="tablist" aria-label="Evidências do desafio" className="flex h-full items-center">
          {tabs.map((tab, index) => {
            const selected = activeView === tab;
            return (
              <button
                key={tab}
                ref={(element) => { tabRefs.current[index] = element; }}
                type="button"
                role="tab"
                id={`evidence-tab-${tab}`}
                aria-controls={`evidence-panel-${tab}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={cn(
                  "relative flex h-full items-center gap-2 border-r border-[color:var(--challengers-border)] px-4 text-sm font-medium",
                  selected
                    ? "bg-[var(--challengers-surface)] text-[var(--challengers-blue)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--challengers-blue)]"
                    : "text-[var(--challengers-muted)] hover:text-[var(--challengers-ink)]",
                )}
                onClick={() => setActiveView(tab)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {tab === "code"
                  ? <FileCode2 className="size-4" aria-hidden="true" />
                  : <SquareTerminal className="size-4" aria-hidden="true" />}
                {tab === "code" ? fileName : "Terminal"}
              </button>
            );
          })}
        </div>
        {activeView === "code" ? (
          <div className="flex items-center gap-2 px-3">
            <span className="hidden rounded-[7px] border border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--challengers-blue)] sm:inline-flex">
              {getLanguageLabel(challenge.language ?? "react")}
            </span>
            <button
              type="button"
              aria-label="Copiar código"
              className="challengers-icon-button inline-flex size-8 items-center justify-center rounded-[8px] border"
              onClick={onCopyCode}
            >
              <Copy className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {activeView === "code" ? (
        <CodeEvidence
          code={challenge.code ?? ""}
          difficulty={difficulty}
        />
      ) : (
        <TerminalEvidence terminal={challenge.terminal} />
      )}
    </section>
  );
}

function CodeEvidence({ code, difficulty }: { code: string; difficulty: string }) {
  const lines = code.split("\n");
  return (
    <>
      <div
        id="evidence-panel-code"
        role="tabpanel"
        aria-labelledby="evidence-tab-code"
        className="min-h-0 flex-1 overflow-auto bg-[var(--challengers-surface)] font-mono text-[0.82rem] leading-6"
      >
        <div className="flex min-w-max">
          <div aria-hidden="true" className="select-none border-r border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-3 py-4 text-right text-[0.72rem] font-medium leading-6 text-[var(--challengers-faint)]">
            {lines.map((_, index) => <div key={index} className="h-[1.45rem] min-w-5 tabular-nums">{index + 1}</div>)}
          </div>
          <pre className="flex-1 overflow-visible px-4 py-4 text-[var(--challengers-ink)]">
            {lines.map((line, index) => <CodeLine key={`${index}:${line}`} line={line} />)}
          </pre>
        </div>
      </div>
      <div className="flex h-9 shrink-0 items-center justify-between border-t border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 text-[0.72rem] text-[var(--challengers-muted)]">
        <span>{lines.length} {lines.length === 1 ? "linha" : "linhas"}</span>
        <span>{difficulty}</span>
      </div>
    </>
  );
}

function CodeLine({ line }: { line: string }) {
  const tokens = line.split(/(\/\/.*|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|func|class|interface|type|def|return|if|else|for|while|switch|case|package|import|from|public|private|static|new|async|await|go|defer|range|struct|map|true|false|null|None|nil)\b|\b\d+\b)/g);
  return (
    <div className="min-h-[1.45rem] whitespace-pre">
      {tokens.map((token, index) => {
        let className = "";
        if (/^(\/\/|#)/.test(token)) className = "italic text-[var(--challengers-faint)]";
        else if (/^["'`]/.test(token)) className = "text-[oklch(46%_0.13_154)] dark:text-[oklch(78%_0.11_154)]";
        else if (/^\d+$/.test(token)) className = "text-[var(--challengers-warning)]";
        else if (/^[A-Za-z]+$/.test(token)) className = "font-semibold text-[var(--challengers-blue)]";
        return <span key={`${index}:${token}`} className={className}>{token}</span>;
      })}
    </div>
  );
}

function TerminalEvidence({ terminal }: { terminal?: TerminalArtifact | null }) {
  return (
    <div
      id="evidence-panel-terminal"
      role="tabpanel"
      aria-labelledby="evidence-tab-terminal"
      className="min-h-0 flex-1 overflow-auto bg-[oklch(18%_0.012_255)] p-5 font-mono text-sm text-[oklch(91%_0.01_250)]"
    >
      {terminal ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4 text-[oklch(76%_0.03_220)]">
            <span aria-hidden="true" className="select-none text-[oklch(70%_0.11_155)]">$</span>
            <code>{terminal.command}</code>
          </div>
          {terminal.blocks.map((block, index) => (
            <div key={`${block.label}:${index}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className={cn("mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]", getTerminalToneClass(block.tone))}>
                <TerminalToneIcon tone={block.tone} />
                {block.label}
              </p>
              <pre className="whitespace-pre-wrap break-words leading-6">{block.content}</pre>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[oklch(70%_0.02_250)]">Nenhuma saída de terminal foi fornecida.</p>
      )}
    </div>
  );
}

function ConceptEvidence({ scenario, question }: { scenario?: string | null; question: string }) {
  return (
    <section data-presentation="concept" className="challengers-panel flex min-h-[560px] flex-col overflow-hidden rounded-[10px] border xl:min-h-0">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 text-sm font-medium text-[var(--challengers-blue)]">
        <BookOpenText className="size-4" aria-hidden="true" />
        Comparação conceitual
      </div>
      <div className="flex flex-1 items-center bg-[var(--challengers-surface)] px-6 py-10 sm:px-10">
        <div className="max-w-3xl">
          {scenario ? (
            <div className="mb-8 border-l-2 border-[color:var(--challengers-blue)] pl-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--challengers-blue)]">Contexto</p>
              <p className="mt-3 text-base leading-7 text-[var(--challengers-muted)]">{scenario}</p>
            </div>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--challengers-muted)]">Questão</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-[var(--challengers-ink)] sm:text-4xl">{question}</h2>
        </div>
      </div>
    </section>
  );
}

function TerminalToneIcon({ tone }: { tone: TerminalArtifact["blocks"][number]["tone"] }) {
  const Icon = tone === "success"
    ? CheckCircle2
    : tone === "warning"
      ? TriangleAlert
      : tone === "error"
        ? CircleAlert
        : Info;
  return <Icon className="size-3.5" aria-hidden="true" />;
}

function getTerminalToneClass(tone: TerminalArtifact["blocks"][number]["tone"]) {
  if (tone === "success") return "text-[oklch(78%_0.13_155)]";
  if (tone === "warning") return "text-[oklch(84%_0.13_85)]";
  if (tone === "error") return "text-[oklch(76%_0.15_25)]";
  return "text-[oklch(72%_0.03_240)]";
}

function getLanguageLabel(language: Language) {
  if (language === "react") return "React + TypeScript";
  if (language === "typescript") return "TypeScript";
  if (language === "python") return "Python";
  if (language === "java") return "Java";
  return "Go";
}

function getDefaultFileName(language: Language) {
  if (language === "react") return "App.tsx";
  if (language === "typescript") return "challenge.ts";
  if (language === "python") return "main.py";
  if (language === "java") return "Main.java";
  return "main.go";
}
