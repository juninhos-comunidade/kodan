"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faNodeJs,
  faPython,
  faReact,
  faTypescript,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@kodan/ui/lib/utils";
import { KodanLogo } from "@/components/kodan-logo";
import {
  buildChallengeTopicSections,
  type ChallengeTopicFilter,
  type ChallengeTopicSection,
} from "./challenges-taxonomy";
import {
  getStatusFromAttempts,
  type Challenge,
  type ChallengeLanguage,
} from "./ema-challenge-card-helpers";

type LanguageCategory = "Todos" | "Front-end" | "Back-end";

export type ChallengeLanguageDefinition = {
  id: ChallengeLanguage;
  name: string;
  icon: IconDefinition;
  category: Exclude<LanguageCategory, "Todos">;
  accent: string;
};

export const CHALLENGE_LANGUAGES: readonly ChallengeLanguageDefinition[] = [
  {
    id: "react",
    name: "React",
    icon: faReact,
    category: "Front-end",
    accent: "#49a6dc",
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: faTypescript,
    category: "Front-end",
    accent: "#4f8bc9",
  },
  {
    id: "python",
    name: "Python",
    icon: faPython,
    category: "Back-end",
    accent: "#d8aa2f",
  },
  {
    id: "nodejs",
    name: "Node.js",
    icon: faNodeJs,
    category: "Back-end",
    accent: "#69ad51",
  },
] as const;

const CATEGORY_FILTERS: readonly LanguageCategory[] = [
  "Todos",
  "Front-end",
  "Back-end",
];

export function getChallengeLanguageDefinition(language: ChallengeLanguage) {
  return CHALLENGE_LANGUAGES.find((item) => item.id === language)!;
}

export function ChallengesLanguageExplorer({
  challenges,
  userElo,
  authenticated,
  selectedLanguage,
  selectedTopic,
  children,
  onSelectLanguage,
  onSelectTopic,
  onBackToTree,
}: {
  challenges: Challenge[];
  userElo: number;
  authenticated: boolean;
  selectedLanguage: ChallengeLanguage | null;
  selectedTopic: ChallengeTopicFilter;
  children: ReactNode;
  onSelectLanguage: (language: ChallengeLanguage) => void;
  onSelectTopic: (
    language: ChallengeLanguage,
    topic: ChallengeTopicFilter,
  ) => void;
  onBackToTree: () => void;
}) {
  const [activeCategory, setActiveCategory] =
    useState<LanguageCategory>("Todos");
  const visibleLanguages = CHALLENGE_LANGUAGES.filter(
    (language) =>
      activeCategory === "Todos" || language.category === activeCategory,
  );
  const activeLanguage = getChallengeLanguageDefinition(
    selectedLanguage ?? "react",
  );
  const activeLanguageChallenges = challenges.filter(
    (challenge) => challenge.language === activeLanguage.id,
  );
  const activeTopics = buildChallengeTopicSections(
    activeLanguageChallenges,
  ).filter((topic) => topic.count > 0);

  return (
    <section className="min-h-full min-w-0 overflow-hidden bg-[var(--challengers-page)] px-4 pb-16 pt-6 text-[var(--challengers-ink)] md:px-7 xl:px-10">
      <div className="relative mx-auto max-w-[76rem]">
        <div
          aria-hidden={selectedLanguage !== null}
          inert={selectedLanguage !== null ? true : undefined}
          className={cn(
            "motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-in-out",
            selectedLanguage
              ? "pointer-events-none absolute inset-x-0 top-0 translate-y-[calc(100%+3rem)] opacity-0"
              : "relative translate-y-0 opacity-100",
          )}
        >
          <div className="mx-auto flex max-w-2xl gap-1 overflow-x-auto rounded-xl border border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] p-1">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                className={cn(
                  "min-h-10 flex-1 whitespace-nowrap rounded-lg px-4 text-xs font-medium transition-colors",
                  activeCategory === category
                    ? "bg-[var(--challengers-blue-soft)] text-[var(--challengers-blue)]"
                    : "text-[var(--challengers-muted)] hover:bg-[var(--challengers-panel-strong)] hover:text-[var(--challengers-ink)]",
                )}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-6 hidden overflow-x-auto pb-3 lg:block">
            <div className="relative min-w-[52rem] px-5 pb-8 pt-4">
              <KodanRoot userElo={userElo} authenticated={authenticated} />
              <LanguageConnectors count={visibleLanguages.length} />
              <div
                className="relative z-10 mt-24 grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${visibleLanguages.length}, minmax(10rem, 1fr))`,
                }}
              >
                {visibleLanguages.map((language) => (
                  <LanguageBranch
                    key={language.id}
                    language={language}
                    challenges={challenges.filter(
                      (challenge) => challenge.language === language.id,
                    )}
                    onSelectLanguage={onSelectLanguage}
                    onSelectTopic={onSelectTopic}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex snap-x gap-3 overflow-x-auto pb-3 lg:hidden">
            {visibleLanguages.map((language) => (
              <div key={language.id} className="w-[17rem] shrink-0 snap-start">
                <LanguageBranch
                  language={language}
                  challenges={challenges.filter(
                    (challenge) => challenge.language === language.id,
                  )}
                  onSelectLanguage={onSelectLanguage}
                  onSelectTopic={onSelectTopic}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          aria-hidden={selectedLanguage === null}
          inert={selectedLanguage === null ? true : undefined}
          className={cn(
            "motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-in-out",
            selectedLanguage
              ? "relative translate-y-0 opacity-100"
              : "pointer-events-none absolute inset-x-0 top-0 translate-y-[calc(100%+3rem)] opacity-0",
          )}
        >
          <LanguageChallengeHeader
            language={activeLanguage}
            challengeCount={activeLanguageChallenges.length}
            topics={activeTopics}
            selectedTopic={selectedTopic}
            onSelectTopic={(topic) => onSelectTopic(activeLanguage.id, topic)}
            onBack={onBackToTree}
          />
          {children}
        </div>
      </div>
    </section>
  );
}

function KodanRoot({ userElo, authenticated }: { userElo: number; authenticated: boolean }) {
  return (
    <div className="relative z-10 mx-auto flex w-56 items-center gap-3 rounded-xl border border-[color:var(--challengers-border-strong)] bg-[var(--challengers-panel-strong)] px-4 py-3">
      <KodanLogo markOnly size="md" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">Kodan</span>
        <span className="mt-0.5 block text-xs text-[var(--challengers-muted)]">
          {authenticated ? `${userElo} ELO · seu domínio` : "Explore por linguagem"}
        </span>
      </span>
    </div>
  );
}

function LanguageConnectors({ count }: { count: number }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute left-5 right-5 top-[4.7rem] h-[6.5rem] w-[calc(100%-2.5rem)] text-[var(--challengers-border-strong)]"
      viewBox="0 0 1120 104"
      preserveAspectRatio="none"
    >
      {Array.from({ length: count }, (_, index) => {
        const targetX = ((index + 0.5) * 1120) / count;
        return (
          <path
            key={targetX}
            d={`M560 0 C 560 52, ${targetX} 38, ${targetX} 104`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

function LanguageBranch({
  language,
  challenges,
  onSelectLanguage,
  onSelectTopic,
}: {
  language: ChallengeLanguageDefinition;
  challenges: Challenge[];
  onSelectLanguage: (language: ChallengeLanguage) => void;
  onSelectTopic: (
    language: ChallengeLanguage,
    topic: ChallengeTopicFilter,
  ) => void;
}) {
  const topics = buildChallengeTopicSections(challenges).filter(
    (topic) => topic.count > 0,
  );
  const resolvedCount = challenges.filter(
    (challenge) => getStatusFromAttempts(challenge.attempts) === "resolved",
  ).length;
  const progress =
    challenges.length === 0
      ? 0
      : Math.round((resolvedCount / challenges.length) * 100);
  const visibleTopics = topics.slice(0, 3);

  return (
    <div
      style={{ "--language-accent": language.accent } as CSSProperties}
      className="min-w-0"
    >
      <button
        type="button"
        className="w-full rounded-xl border border-[color:var(--challengers-border)] bg-[var(--challengers-panel-strong)] px-3 py-4 text-left transition-transform hover:-translate-y-0.5 hover:border-[color:var(--language-accent)] focus-visible:border-[color:var(--language-accent)] focus-visible:outline-none"
        onClick={() => onSelectLanguage(language.id)}
      >
        <span className="flex items-center gap-2.5">
          <LanguageMark language={language} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {language.name}
            </span>
            <span className="mt-0.5 block text-[0.68rem] text-[var(--challengers-muted)]">
              {challenges.length}{" "}
              {challenges.length === 1 ? "desafio" : "desafios"}
            </span>
          </span>
        </span>
        <span className="mt-4 flex items-center gap-3">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--challengers-progress-track)]">
            <span
              className="block h-full rounded-full bg-[var(--language-accent)] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </span>
          <span className="w-8 text-right text-[0.68rem] font-semibold tabular-nums text-[var(--language-accent)]">
            {progress}%
          </span>
        </span>
      </button>

      <div className="relative mt-3 space-y-2 before:absolute before:-top-3 before:bottom-3 before:left-3 before:border-l before:border-dotted before:border-[color:var(--language-accent)]">
        {visibleTopics.length > 0 ? (
          visibleTopics.map((topic) => (
            <button
              key={topic.key}
              type="button"
              aria-label={`Abrir desafios de ${language.name} filtrados por ${topic.label}`}
              className="relative ml-5 flex w-[calc(100%-1.25rem)] items-center justify-between rounded-lg border border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-3 py-2 text-left text-[0.68rem] text-[var(--challengers-muted)] transition-colors hover:border-[color:var(--language-accent)] hover:text-[var(--language-accent)]"
              onClick={() => onSelectTopic(language.id, topic.key)}
            >
              <span className="truncate">{topic.label}</span>
              <span className="ml-2 flex shrink-0 items-center gap-1.5 tabular-nums">
                {topic.count}
                <ChevronRight className="size-3" aria-hidden="true" />
              </span>
            </button>
          ))
        ) : (
          <p className="relative ml-5 rounded-lg border border-dashed border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-3 py-3 text-[0.68rem] text-[var(--challengers-muted)]">
            Conteúdo em preparação
          </p>
        )}
        {topics.length > visibleTopics.length ? (
          <button
            type="button"
            className="ml-5 px-3 py-1 text-[0.68rem] font-medium text-[var(--language-accent)] hover:underline"
            onClick={() => onSelectLanguage(language.id)}
          >
            Ver mais {topics.length - visibleTopics.length}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function LanguageChallengeHeader({
  language,
  challengeCount,
  topics,
  selectedTopic,
  onSelectTopic,
  onBack,
}: {
  language: ChallengeLanguageDefinition;
  challengeCount: number;
  topics: ChallengeTopicSection[];
  selectedTopic: ChallengeTopicFilter;
  onSelectTopic: (topic: ChallengeTopicFilter) => void;
  onBack: () => void;
}) {
  return (
    <header
      style={{ "--language-accent": language.accent } as CSSProperties}
      className="border-b border-[color:var(--challengers-border)] pb-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LanguageMark language={language} />
          <div>
            <p className="text-xs text-[var(--challengers-muted)]">
              Trilha selecionada
            </p>
            <h2 className="font-serif text-2xl font-bold">
              Desafios de {language.name}
            </h2>
            <p className="mt-1 text-xs text-[var(--challengers-muted)]">
              {challengeCount}{" "}
              {challengeCount === 1
                ? "desafio disponível"
                : "desafios disponíveis"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[color:var(--challengers-border)] px-3 text-xs text-[var(--challengers-muted)] hover:text-[var(--challengers-ink)]"
          onClick={onBack}
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Voltar à árvore
        </button>
      </div>

      <fieldset className="mt-5 min-w-0">
        <legend className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--challengers-muted)]">
          Filtrar por tópico
        </legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <TopicButton
            active={selectedTopic === "ALL"}
            label="Todos"
            count={challengeCount}
            onClick={() => onSelectTopic("ALL")}
          />
          {topics.map((topic) => (
            <TopicButton
              key={topic.key}
              active={selectedTopic === topic.key}
              label={topic.label}
              count={topic.count}
              onClick={() => onSelectTopic(topic.key)}
            />
          ))}
        </div>
      </fieldset>
    </header>
  );
}

function TopicButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "min-h-9 shrink-0 rounded-full border px-3 text-[0.7rem] font-medium transition-colors",
        active
          ? "border-[color:var(--language-accent)] bg-[var(--challengers-panel-strong)] text-[var(--language-accent)]"
          : "border-[color:var(--challengers-border)] text-[var(--challengers-muted)] hover:text-[var(--challengers-ink)]",
      )}
      onClick={onClick}
    >
      {label} · {count}
    </button>
  );
}

function LanguageMark({ language }: { language: ChallengeLanguageDefinition }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-md border border-[color:var(--language-accent)] bg-[color:color-mix(in_srgb,var(--language-accent)_12%,transparent)] text-xs font-bold text-[var(--language-accent)]"
    >
      <FontAwesomeIcon className="size-4" icon={language.icon} />
    </span>
  );
}
