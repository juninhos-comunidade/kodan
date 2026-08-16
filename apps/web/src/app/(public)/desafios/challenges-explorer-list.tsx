"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  Aperture,
  Atom,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleDashed,
  Filter,
  Hourglass,
  LockKeyhole,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@kodan/ui/lib/utils";
import { ChallengeEditorialReview } from "@/components/challenge-editorial-review";
import type {
  DifficultyFilter,
  SortBy,
  StatusFilter,
  TypeFilter,
} from "./challenges-list-state";
import type { ChallengeTopicFilter } from "./challenges-taxonomy";
import {
  type Challenge,
  type ChallengeKind,
  getChallengeDescription,
  getChallengeKind,
  getChallengeProgress,
  getDifficultyColor,
  getDifficultyLabel,
  getStatusPresentation,
} from "./ema-challenge-card-helpers";

const TYPE_OPTIONS: readonly ChallengeKind[] = [
  "CONCEITO",
  "HOOKS",
  "CLEANUP",
  "LÓGICA",
  "AVANÇADO",
] as const;

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Status: Todos" },
  { value: "resolved", label: "Resolvido" },
  { value: "in_progress", label: "Em progresso" },
  { value: "not_started", label: "Não iniciado" },
] as const;

const SORT_OPTIONS: ReadonlyArray<{ value: SortBy; label: string }> = [
  { value: "RECENT", label: "Ordenar: Recente" },
  { value: "ELO_ASC", label: "ELO crescente" },
  { value: "ELO_DESC", label: "ELO decrescente" },
  { value: "TITLE", label: "Título" },
] as const;

function getChallengeRoute(challengeId: string): Route {
  return `/treinar/${challengeId}` as Route;
}

export function ChallengesExplorerPanel({
  languageLabel,
  topicLabel,
  topicDescription,
  topicFilter,
  challenges,
  activeChallengeId,
  visibleCount,
  page,
  pageSize,
  filterDifficulty,
  statusFilter,
  typeFilter,
  onlyUnsolved,
  sortBy,
  hasActiveFilters,
  loadingMore,
  onFocusChallenge,
  onOpenChallenge,
  onFilterChange,
  onStatusChange,
  onTypeChange,
  onOnlyUnsolvedChange,
  onSortChange,
  onClearFilters,
  onPageChange,
}: {
  languageLabel: string;
  topicLabel: string;
  topicDescription: string;
  topicFilter: ChallengeTopicFilter;
  challenges: Challenge[];
  activeChallengeId: string | null;
  visibleCount: number;
  page: number;
  pageSize: number;
  filterDifficulty: DifficultyFilter;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  onlyUnsolved: boolean;
  sortBy: SortBy;
  hasActiveFilters: boolean;
  loadingMore: boolean;
  onFocusChallenge: (id: string | null) => void;
  onOpenChallenge: (id: string) => void;
  onFilterChange: (difficulty: DifficultyFilter) => void;
  onStatusChange: (status: StatusFilter) => void;
  onTypeChange: (type: TypeFilter) => void;
  onOnlyUnsolvedChange: (checked: boolean) => void;
  onSortChange: (sortBy: SortBy) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="min-w-0 px-4 py-5 md:px-7 md:py-6">
      <div className="hidden md:block lg:hidden">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-bold text-[var(--challengers-ink)]">
            {topicLabel}
          </h1>
          <span className="challengers-badge border-[color:var(--challengers-blue-border)] bg-[var(--challengers-blue-soft)] px-2 py-1 text-[0.7rem] font-semibold text-[var(--challengers-blue)]">
            {languageLabel}
          </span>
        </div>
        <p className="mt-2 max-w-[56rem] text-[0.86rem] text-[var(--challengers-muted)]">
          {topicDescription}
        </p>
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-2 px-1 pb-3 pt-1 text-[0.74rem] font-medium text-[var(--challengers-muted)]">
          <span>{languageLabel}</span>
          <ChevronRight className="size-3" />
          <span className="text-[var(--challengers-ink)]">{topicLabel}</span>
        </div>
      </div>

      <div className="lg:-mt-5">
        <ChallengeFilters
          filterDifficulty={filterDifficulty}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onlyUnsolved={onlyUnsolved}
          sortBy={sortBy}
          hasActiveFilters={hasActiveFilters}
          onFilterChange={onFilterChange}
          onStatusChange={onStatusChange}
          onTypeChange={onTypeChange}
          onOnlyUnsolvedChange={onOnlyUnsolvedChange}
          onSortChange={onSortChange}
          onClearFilters={onClearFilters}
        />
      </div>

      <div className="mt-5">
        <ChallengeList
          challenges={challenges}
          activeChallengeId={activeChallengeId}
          page={page}
          pageSize={pageSize}
          onFocusChallenge={onFocusChallenge}
          onOpenChallenge={onOpenChallenge}
        />
      </div>

      <ChallengePagination
        page={page}
        pageSize={pageSize}
        visibleCount={visibleCount}
        currentPageCount={challenges.length}
        loading={loadingMore}
        onPageChange={onPageChange}
      />
    </section>
  );
}

function ChallengeFilters({
  filterDifficulty,
  statusFilter,
  typeFilter,
  onlyUnsolved,
  sortBy,
  hasActiveFilters,
  onFilterChange,
  onStatusChange,
  onTypeChange,
  onOnlyUnsolvedChange,
  onSortChange,
  onClearFilters,
}: {
  filterDifficulty: DifficultyFilter;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  onlyUnsolved: boolean;
  sortBy: SortBy;
  hasActiveFilters: boolean;
  onFilterChange: (difficulty: DifficultyFilter) => void;
  onStatusChange: (status: StatusFilter) => void;
  onTypeChange: (type: TypeFilter) => void;
  onOnlyUnsolvedChange: (checked: boolean) => void;
  onSortChange: (sortBy: SortBy) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 border-y border-[color:var(--challengers-border)] py-3">
      <details className="group relative">
        <summary className="challengers-control flex h-10 cursor-pointer list-none items-center gap-2 rounded-[8px] border px-3 text-[0.78rem] font-medium marker:hidden hover:border-[color:var(--challengers-blue-border)] hover:text-[var(--challengers-blue)]">
          <SlidersHorizontal className="size-3.5" />
          Filtros
          {hasActiveFilters ? <span className="rounded-full bg-[var(--challengers-blue-soft)] px-1.5 py-0.5 text-[0.65rem] text-[var(--challengers-blue)]">ativos</span> : null}
        </summary>
        <div className="challengers-panel absolute left-0 top-[calc(100%+8px)] z-30 grid w-[min(44rem,calc(100vw-2rem))] grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-[color:var(--challengers-border-strong)] bg-[var(--challengers-border)] shadow-[var(--challengers-shadow-soft)] md:grid-cols-4">
          <FilterGroup title="Dificuldade">
            <FilterSelect label="Dificuldade" value={filterDifficulty} onChange={(value) => onFilterChange(value as DifficultyFilter)} options={[{ value: "ALL", label: "Todos" }, { value: "EASY", label: "Fácil" }, { value: "MEDIUM", label: "Médio" }, { value: "HARD", label: "Difícil" }]} />
          </FilterGroup>
          <FilterGroup title="Status">
            <FilterSelect label="Status" value={statusFilter} onChange={(value) => onStatusChange(value as StatusFilter)} options={STATUS_OPTIONS} />
            <label className="mt-3 flex items-center gap-2 text-[0.72rem] text-[var(--challengers-muted)]"><input type="checkbox" checked={onlyUnsolved} className="challengers-checkbox size-4 rounded-[3px]" onChange={(event) => onOnlyUnsolvedChange(event.target.checked)} />Apenas não resolvidos</label>
          </FilterGroup>
          <FilterGroup title="Tipo">
            <FilterSelect label="Tipo" value={typeFilter} onChange={(value) => onTypeChange(value as TypeFilter)} options={[{ value: "ALL", label: "Todos" }, ...TYPE_OPTIONS.map((type) => ({ value: type, label: type }))]} />
          </FilterGroup>
          <FilterGroup title="Ordenação">
            <FilterSelect label="Ordenar" value={sortBy} onChange={(value) => onSortChange(value as SortBy)} options={SORT_OPTIONS} />
          </FilterGroup>
        </div>
      </details>
      {hasActiveFilters ? <button type="button" className="flex h-10 items-center gap-2 text-[0.78rem] text-[var(--challengers-muted)] hover:text-[var(--challengers-ink)]" onClick={onClearFilters}><Filter className="size-3.5" />Limpar filtros</button> : <span className="text-[0.75rem] text-[var(--challengers-muted)]">Use filtros para refinar o catálogo.</span>}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return <fieldset className="min-w-0 bg-[var(--challengers-surface)] p-3"><legend className="sr-only">{title}</legend><p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--challengers-muted)]">{title}</p>{children}</fieldset>;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        className="challengers-control h-9 w-full min-w-0 rounded-[6px] border px-2 text-[0.72rem] outline-none"
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChallengeList({
  challenges,
  activeChallengeId,
  page,
  pageSize,
  onFocusChallenge,
  onOpenChallenge,
}: {
  challenges: Challenge[];
  activeChallengeId: string | null;
  page: number;
  pageSize: number;
  onFocusChallenge: (id: string | null) => void;
  onOpenChallenge: (id: string) => void;
}) {
  if (challenges.length === 0) {
    return (
      <div className="challengers-panel rounded-[12px] border px-6 py-12 text-center">
        <p className="font-serif text-lg font-bold text-[var(--challengers-ink)]">
          Nenhum desafio encontrado
        </p>
        <p className="mt-2 text-sm text-[var(--challengers-muted)]">
          Ajuste os filtros ou limpe a busca para voltar ao catálogo.
        </p>
      </div>
    );
  }

  return (
    <>
      <ChallengeTable
        challenges={challenges}
        activeChallengeId={activeChallengeId}
        page={page}
        pageSize={pageSize}
        onFocusChallenge={onFocusChallenge}
        onOpenChallenge={onOpenChallenge}
      />
      <div className="space-y-3 md:hidden">
        {challenges.map((challenge, index) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            index={(page - 1) * pageSize + index + 1}
            active={challenge.id === activeChallengeId}
            onFocusChallenge={onFocusChallenge}
            onOpenChallenge={onOpenChallenge}
          />
        ))}
      </div>
    </>
  );
}

function ChallengeTable({
  challenges,
  activeChallengeId,
  page,
  pageSize,
  onFocusChallenge,
  onOpenChallenge,
}: {
  challenges: Challenge[];
  activeChallengeId: string | null;
  page: number;
  pageSize: number;
  onFocusChallenge: (id: string | null) => void;
  onOpenChallenge: (id: string) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-[12px] border border-[color:var(--challengers-border)] md:block">
      <table className="w-full table-fixed text-left">
        <thead className="bg-[var(--challengers-panel)] text-[0.67rem] uppercase tracking-[0.16em] text-[var(--challengers-muted)]">
          <tr>
            <th className="w-[5.8rem] px-4 py-4 font-semibold">#</th>
            <th className="px-4 py-4 font-semibold">Desafio</th>
            <th className="w-[7.5rem] px-4 py-4 font-semibold">
              Dificuldade
            </th>
            <th className="w-[6.4rem] px-4 py-4 font-semibold">Tipo</th>
            <th className="w-[5rem] px-4 py-4 font-semibold">Elo</th>
            <th className="w-[8.4rem] px-4 py-4 font-semibold">Status</th>
            <th className="w-[8.6rem] px-4 py-4 font-semibold">Progresso</th>
          </tr>
        </thead>
        <tbody>
          {challenges.map((challenge, index) => (
            <ChallengeTableRow
              key={challenge.id}
              challenge={challenge}
              index={(page - 1) * pageSize + index + 1}
              active={challenge.id === activeChallengeId}
              onFocusChallenge={onFocusChallenge}
              onOpenChallenge={onOpenChallenge}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChallengeTableRow({
  challenge,
  index,
  active,
  onFocusChallenge,
  onOpenChallenge,
}: {
  challenge: Challenge;
  index: number;
  active: boolean;
  onFocusChallenge: (id: string | null) => void;
  onOpenChallenge: (id: string) => void;
}) {
  const kind = getChallengeKind(challenge);
  const progress = getChallengeProgress(challenge.attempts);
  const statusPresentation = getStatusPresentation(challenge.attempts);
  const challengeHref = getChallengeRoute(challenge.id);
  const locked = !challenge.evaluationAvailable;
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <>
      <tr
        className={cn(
          "challengers-row cursor-pointer border-t text-[0.82rem] transition-colors",
          active && "challengers-row-active",
        )}
        onMouseEnter={() => onFocusChallenge(challenge.id)}
        onFocus={() => onFocusChallenge(challenge.id)}
        onClick={() => locked ? setReviewOpen((open) => !open) : onOpenChallenge(challenge.id)}
      >
      <td className="px-4 py-5">
        <div className="flex items-center gap-3">
          <ChallengeIcon kind={kind} />
          <span className="tabular-nums text-[var(--challengers-muted)]">
            {String(index).padStart(3, "0")}
          </span>
        </div>
      </td>
      <td className="px-4 py-5">
        <div className="min-w-0">
          {locked ? (
            <button
              type="button"
              aria-expanded={reviewOpen}
              aria-label={`Abrir informações sobre a revisão de ${challenge.title}`}
              className="flex w-full items-center gap-2 truncate text-left font-serif text-[0.96rem] font-bold text-[var(--challengers-ink)] outline-none transition-colors hover:text-[var(--challengers-blue)] focus-visible:text-[var(--challengers-blue)]"
              onClick={(event) => {
                event.stopPropagation();
                setReviewOpen((open) => !open);
              }}
            >
              <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
              {challenge.title}
            </button>
          ) : (
            <Link
              href={challengeHref}
              aria-label={`Abrir desafio ${challenge.title}`}
              className="block truncate font-serif text-[0.96rem] font-bold text-[var(--challengers-ink)] outline-none transition-colors hover:text-[var(--challengers-blue)] focus-visible:text-[var(--challengers-blue)]"
              onClick={(event) => event.stopPropagation()}
            >
              {challenge.title}
            </Link>
          )}
          <p className="mt-1 line-clamp-2 text-[0.76rem] leading-5 text-[var(--challengers-muted)]">
            {getChallengeDescription(challenge)}
          </p>
        </div>
      </td>
      <td className="px-4 py-5">
        <span className={cn("px-2 py-1 text-[0.68rem]", getDifficultyColor(challenge.difficulty))}>
          {getDifficultyLabel(challenge.difficulty)}
        </span>
      </td>
      <td className="px-4 py-5">
        <span className="challengers-badge px-2 py-1 text-[0.68rem]">
          {kind}
        </span>
      </td>
      <td className="px-4 py-5 font-serif text-base font-bold tabular-nums text-[var(--challengers-ink)]">
        {challenge.recommendedElo}
      </td>
      <td className="px-4 py-5">
        {locked
          ? <EditorialReviewStatus />
          : <StatusIndicator label={statusPresentation.label} status={statusPresentation.status} />}
      </td>
      <td className="px-4 py-5">
        <ProgressBar percent={progress.percent} className={progress.barClassName} />
      </td>
      </tr>
      {locked && reviewOpen ? (
        <tr className="border-t border-[color:var(--challengers-border)]">
          <td colSpan={7} className="bg-[var(--challengers-surface)] px-5 py-4">
            <ChallengeEditorialReview compact />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ChallengeCard({
  challenge,
  index,
  active,
  onFocusChallenge,
  onOpenChallenge,
}: {
  challenge: Challenge;
  index: number;
  active: boolean;
  onFocusChallenge: (id: string | null) => void;
  onOpenChallenge: (id: string) => void;
}) {
  const kind = getChallengeKind(challenge);
  const progress = getChallengeProgress(challenge.attempts);
  const statusPresentation = getStatusPresentation(challenge.attempts);
  const challengeHref = getChallengeRoute(challenge.id);
  const locked = !challenge.evaluationAvailable;
  const [reviewOpen, setReviewOpen] = useState(false);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ChallengeIcon kind={kind} />
          <div className="min-w-0">
            <p className="text-[0.68rem] tabular-nums text-[var(--challengers-muted)]">
              {String(index).padStart(3, "0")}
            </p>
            <h2 className="mt-1 line-clamp-2 font-serif text-[0.98rem] font-bold leading-tight text-[var(--challengers-ink)]">
              {challenge.title}
            </h2>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--challengers-muted)]">Elo</p>
          <p className="font-serif text-base font-bold text-[var(--challengers-ink)]">{challenge.recommendedElo}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={cn("px-2 py-1 text-[0.64rem]", getDifficultyColor(challenge.difficulty))}>{getDifficultyLabel(challenge.difficulty)}</span>
        <span className="challengers-badge px-2 py-1 text-[0.64rem]">{kind}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {locked ? <EditorialReviewStatus /> : <StatusIndicator label={statusPresentation.label} status={statusPresentation.status} />}
      </div>
      {!locked ? <div className="mt-2"><ProgressBar percent={progress.percent} className={progress.barClassName} /></div> : null}
    </>
  );

  return (
    <article
      className={cn(
        "challengers-row rounded-[12px] border px-4 py-4",
        active && "challengers-row-active",
      )}
      onMouseEnter={() => onFocusChallenge(challenge.id)}
      onFocus={() => onFocusChallenge(challenge.id)}
    >
      {locked ? (
        <button
          type="button"
          aria-expanded={reviewOpen}
          aria-label={`Abrir informações sobre a revisão de ${challenge.title}`}
          className="w-full text-left"
          onClick={() => setReviewOpen((open) => !open)}
        >
          {content}
        </button>
      ) : (
        <Link href={challengeHref} aria-label={`Abrir desafio ${challenge.title}`} className="block w-full text-left">
          {content}
        </Link>
      )}
      {locked && reviewOpen ? <div className="mt-4"><ChallengeEditorialReview compact /></div> : null}
    </article>
  );
}

function EditorialReviewStatus() {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[0.76rem] font-medium text-[var(--challengers-muted)]">
      <LockKeyhole className="size-3.5" aria-hidden="true" />
      Em revisão
    </span>
  );
}

function StatusIndicator({
  label,
  status,
}: {
  label: string;
  status: "resolved" | "in_progress" | "not_started";
}) {
  const Icon =
    status === "resolved"
      ? CircleCheck
      : status === "in_progress"
        ? Circle
        : CircleDashed;

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[0.76rem] text-[var(--challengers-ink)]">
      <Icon
        className={cn(
          "size-3.5",
          status === "resolved" && "text-[var(--challengers-success)]",
          status === "in_progress" && "text-[var(--challengers-blue)]",
          status === "not_started" && "text-[var(--challengers-muted)]",
        )}
      />
      <span>{label}</span>
    </span>
  );
}

function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="challengers-progress-track h-1.5 flex-1 overflow-hidden rounded-[999px]">
        <div
          className={cn("h-full rounded-[999px] transition-[width] duration-200", className)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-[0.68rem] tabular-nums text-[var(--challengers-ink)]">
        {percent}%
      </span>
    </div>
  );
}

function ChallengePagination({
  page,
  pageSize,
  visibleCount,
  currentPageCount,
  loading,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  visibleCount: number;
  currentPageCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(visibleCount / pageSize));
  const start = visibleCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = visibleCount === 0 ? 0 : start + currentPageCount - 1;
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <footer className="challengers-subtle-panel mt-7 flex flex-col gap-3 rounded-[10px] border px-4 py-3 text-[0.78rem] text-[var(--challengers-muted)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span>Mostrar</span>
        <span className="challengers-control rounded-[7px] border px-3 py-2 text-[var(--challengers-ink)]">
          {pageSize}
        </span>
        <span>por página</span>
      </div>

      <div className="flex items-center gap-5">
        <span aria-live="polite" className="tabular-nums text-[var(--challengers-ink)]">
          {loading ? "Carregando desafios..." : `${start}-${end} de ${visibleCount}`}
        </span>
        <div className="flex items-center gap-2">
          <PaginationButton
            label="Página anterior"
            disabled={loading || !canGoPrevious}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </PaginationButton>
          {[...Array(Math.min(2, totalPages)).keys()].map((item) => {
            const pageNumber = item + 1;

            return (
              <PaginationButton
                key={pageNumber}
                label={`Ir para página ${pageNumber}`}
                active={page === pageNumber}
                disabled={loading}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </PaginationButton>
            );
          })}
          <PaginationButton
            label="Próxima página"
            disabled={loading || !canGoNext}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </PaginationButton>
        </div>
      </div>
    </footer>
  );
}

function PaginationButton({
  label,
  active = false,
  disabled = false,
  children,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-[8px] border text-[0.78rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        active
          ? "border-[color:var(--challengers-blue)] bg-[var(--challengers-blue)] text-[var(--challengers-surface)]"
          : "challengers-icon-button",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ChallengeIcon({ kind }: { kind: ChallengeKind }) {
  const Icon =
    kind === "HOOKS"
      ? Aperture
      : kind === "CLEANUP"
        ? Hourglass
        : kind === "LÓGICA"
          ? Atom
          : kind === "AVANÇADO"
            ? Zap
            : Atom;

  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center text-[var(--challengers-blue)]">
      <Icon className="size-5" />
    </span>
  );
}
