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

import type {
  ChallengePresentation,
  ChallengeTerminalArtifact,
} from "@kodan/content/challenge-schemas";
import { cn } from "@kodan/ui/lib/utils";
import { ShikiCodeBlock } from "@/components/shiki-code-block";
import type { HighlightedCode } from "@/lib/code-highlighting";

type EvidenceView = "code" | "terminal";
type Language = "react" | "typescript" | "python" | "java" | "go";
const languageEvidence: Record<Language, { label: string; defaultFileName: string }> = {
  react: { label: "React + TypeScript", defaultFileName: "App.tsx" },
  typescript: { label: "TypeScript", defaultFileName: "challenge.ts" },
  python: { label: "Python", defaultFileName: "main.py" },
  java: { label: "Java", defaultFileName: "Main.java" },
  go: { label: "Go", defaultFileName: "main.go" },
};

export type ChallengeEvidence = {
  language?: Language;
  presentation?: ChallengePresentation;
  code: string | null;
  codeFileName?: string | null;
  scenario?: string | null;
  question: string;
  terminal?: ChallengeTerminalArtifact | null;
};

export function ChallengeEvidencePanel({
  challenge,
  difficulty,
  onCopyCode,
  highlightedCode = null,
}: {
  challenge: ChallengeEvidence;
  difficulty: string;
  onCopyCode: () => void;
  highlightedCode?: HighlightedCode | null;
}) {
  const presentation = challenge.presentation ?? "code";
  const tabs = presentation === "code-terminal"
    ? (["code", "terminal"] as const)
    : presentation === "terminal"
      ? (["terminal"] as const)
      : (["code"] as const);
  const [activeView, setActiveView] = useState<EvidenceView>(tabs[0]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const language = languageEvidence[challenge.language ?? "react"];
  const fileName = challenge.codeFileName ?? language.defaultFileName;

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
      className="challengers-panel flex min-h-[560px] flex-col overflow-hidden border xl:min-h-0"
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
            <span className="hidden border border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--challengers-blue)] sm:inline-flex">
              {language.label}
            </span>
            <button
              type="button"
              aria-label="Copiar código"
              className="challengers-icon-button inline-flex size-8 items-center justify-center border"
              onClick={onCopyCode}
            >
              <Copy className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {challenge.scenario ? <ScenarioContext scenario={challenge.scenario} /> : null}

      {activeView === "code" ? (
        <CodeEvidence
          code={challenge.code ?? ""}
          difficulty={difficulty}
          highlightedCode={highlightedCode}
        />
      ) : (
        <TerminalEvidence terminal={challenge.terminal} />
      )}
    </section>
  );
}

function CodeEvidence({
  code,
  difficulty,
  highlightedCode,
}: {
  code: string;
  difficulty: string;
  highlightedCode?: HighlightedCode | null;
}) {
  const lines = code.split("\n");
  return (
    <>
      <div
        id="evidence-panel-code"
        role="tabpanel"
        aria-labelledby="evidence-tab-code"
        className="min-h-0 flex-1 overflow-auto bg-[#282c34] font-mono text-[0.82rem] leading-6"
      >
        <pre className="m-0 min-w-0 overflow-visible p-4 text-[#abb2bf]">
          <ShikiCodeBlock code={code} highlightedCode={highlightedCode} />
        </pre>
      </div>
      <div className="flex h-9 shrink-0 items-center justify-between border-t border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 text-[0.72rem] text-[var(--challengers-muted)]">
        <span>{lines.length} {lines.length === 1 ? "linha" : "linhas"}</span>
        <span>{difficulty}</span>
      </div>
    </>
  );
}

function TerminalEvidence({ terminal }: { terminal?: ChallengeTerminalArtifact | null }) {
  const blocks = terminal?.blocks.map((block) => ({
    ...block,
    id: `${block.label}:${block.tone}:${block.content}`,
  }));

  return (
    <div
      id="evidence-panel-terminal"
      role="tabpanel"
      aria-labelledby="evidence-tab-terminal"
      className="min-h-0 flex-1 overflow-auto bg-[oklch(18%_0.012_255)] p-5 font-mono text-sm text-[oklch(91%_0.01_250)]"
    >
      {terminal ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-[oklch(42%_0.018_250)] pb-4 text-[oklch(76%_0.03_220)]">
            <span aria-hidden="true" className="select-none text-[oklch(70%_0.11_155)]">$</span>
            <code>{terminal.command}</code>
          </div>
          {blocks?.map((block) => (
            <div key={block.id} className="border border-[oklch(42%_0.018_250)] bg-[oklch(22%_0.012_255)] p-4">
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
    <section data-presentation="concept" className="challengers-panel flex min-h-[560px] flex-col overflow-hidden border xl:min-h-0">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 text-sm font-medium text-[var(--challengers-blue)]">
        <BookOpenText className="size-4" aria-hidden="true" />
        Comparação conceitual
      </div>
      <div className="flex flex-1 items-center bg-[var(--challengers-surface)] px-6 py-10 sm:px-10">
        <div className="max-w-3xl">
          {scenario ? (
            <div className="mb-8">
              <ScenarioContext scenario={scenario} />
            </div>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--challengers-muted)]">Questão</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-[var(--challengers-ink)] sm:text-4xl">{question}</h2>
        </div>
      </div>
    </section>
  );
}

function ScenarioContext({ scenario }: { scenario: string }) {
  return (
    <div className="border-b border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-5 py-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--challengers-blue)]">
        <BookOpenText className="size-3.5" aria-hidden="true" />
        Contexto
      </p>
      <p className="mt-2 max-w-[72ch] text-sm leading-6 text-[var(--challengers-muted)]">{scenario}</p>
    </div>
  );
}

function TerminalToneIcon({ tone }: { tone: ChallengeTerminalArtifact["blocks"][number]["tone"] }) {
  const Icon = tone === "success"
    ? CheckCircle2
    : tone === "warning"
      ? TriangleAlert
      : tone === "error"
        ? CircleAlert
        : Info;
  return <Icon className="size-3.5" aria-hidden="true" />;
}

function getTerminalToneClass(tone: ChallengeTerminalArtifact["blocks"][number]["tone"]) {
  if (tone === "success") return "text-[oklch(78%_0.13_155)]";
  if (tone === "warning") return "text-[oklch(84%_0.13_85)]";
  if (tone === "error") return "text-[oklch(76%_0.15_25)]";
  return "text-[oklch(72%_0.03_240)]";
}
