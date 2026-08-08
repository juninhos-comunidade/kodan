"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  Filter,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { KodanLogo as BrandLogo } from "@/components/kodan-logo";
import { getLoginHref } from "@/lib/auth-navigation";
import { eloToDanRank, formatRankLabel } from "@/lib/rating";

import { cn } from "@kodan/ui/lib/utils";

export function ChallengesDesktopShell({
  title,
  description,
  searchQuery,
  children,
  onSearchChange,
}: {
  userElo: number;
  user: ChallengesUserSummary;
  title: string;
  description: string;
  searchQuery: string;
  children: ReactNode;
  onSearchChange: (query: string) => void;
}) {
  return (
    <section className="challengers-shell hidden h-full min-h-0 overflow-hidden lg:flex lg:flex-col">
      <header className="border-b border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-6 py-5 xl:px-8">
        <div className="grid min-w-0 grid-cols-[minmax(16rem,0.8fr)_minmax(20rem,1fr)] items-center gap-6">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold text-[var(--challengers-ink)]">
              {title}
            </h1>
            <p className="mt-1 max-w-sm text-sm leading-5 text-[var(--challengers-muted)]">
              {description}
            </p>
          </div>
          <search className="w-full min-w-0">
            <ChallengeSearchInput
              value={searchQuery}
              className="w-full"
              onChange={onSearchChange}
            />
          </search>
        </div>
      </header>
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

export function ChallengesMobileShell({
  userElo,
  user,
  authenticated = true,
  searchQuery,
  children,
  filtersOpen,
  filtersDisabled,
  onSearchChange,
  onOpenFilters,
}: {
  userElo: number;
  user: ChallengesUserSummary;
  authenticated?: boolean;
  searchQuery: string;
  children: ReactNode;
  filtersOpen: boolean;
  filtersDisabled: boolean;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
}) {
  return (
    <section className="min-h-svh bg-[var(--challengers-surface)] pb-6 lg:hidden">
      <header className="sticky top-0 z-20 border-b border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-4 py-3">
        <div className="flex items-center justify-between gap-3 pl-12">
          <KodanLogo compact />
          <div className="flex items-center gap-2">
            {authenticated ? <CompactRankBadge userElo={userElo} /> : null}
            <ThemeToggleButton />
            {authenticated ? (
              <ProfileLink user={user} />
            ) : (
              <Link
                href={getLoginHref("/desafios")}
                className="challengers-control inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-semibold text-[var(--challengers-blue)]"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ChallengeSearchInput
            value={searchQuery}
            compact
            onChange={onSearchChange}
          />
          <button
            id="challenge-filter-trigger"
            type="button"
            aria-label="Abrir filtros de desafios"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            aria-controls="challenge-filters-panel"
            disabled={filtersDisabled}
            className="challengers-icon-button inline-flex size-11 shrink-0 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onOpenFilters}
          >
            <Filter className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}

function KodanLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/inicio"
      className={cn(
        "inline-flex items-center gap-3 text-[var(--challengers-ink)]",
        compact && "gap-2",
      )}
    >
      <BrandLogo
        size={compact ? "sm" : "md"}
        wordmarkClassName={cn(compact ? "text-sm" : "text-xl")}
      />
    </Link>
  );
}

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Alternar tema"
      className="challengers-icon-button relative inline-flex size-11 items-center justify-center rounded-lg border"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}

type ChallengesUserSummary = {
  name: string;
  image: string | null;
};

function ProfileLink({ user }: { user: ChallengesUserSummary }) {
  return (
    <Link
      href="/perfil"
      aria-label="Perfil"
      className="challengers-icon-button inline-flex size-11 items-center justify-center overflow-hidden rounded-lg border text-xs font-semibold"
    >
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="size-full object-cover"
        />
      ) : getInitials(user.name)}
    </Link>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .flatMap((part) => (part.trim()[0] ? [part.trim()[0]!] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase() || "K";
}

function ChallengeSearchInput({
  value,
  compact = false,
  className,
  onChange,
}: {
  value: string;
  compact?: boolean;
  className?: string;
  onChange: (query: string) => void;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--challengers-muted)]" />
      <input
        aria-label="Buscar desafios, tópicos ou conceitos"
        value={value}
        placeholder={
          compact
            ? "Buscar desafios, tópicos..."
            : "Buscar desafios, tópicos, conceitos..."
        }
        className={cn(
          "challengers-control h-11 w-full rounded-lg border pl-11 pr-14 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--challengers-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--challengers-surface)]",
          compact && "text-xs",
        )}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-[5px] border border-[color:var(--challengers-border)] text-[0.72rem] text-[var(--challengers-muted)]">
        /
      </span>
    </div>
  );
}

function RankBadge({ userElo }: { userElo: number }) {
  const rank = eloToDanRank(userElo);

  return (
    <div className="flex shrink-0 items-center gap-4">
      <RankSeal kanji={rank.kanji} />
      <div className="border-r border-[color:var(--challengers-border)] pr-5">
        <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--challengers-muted)]">
          Rank
        </p>
        <p className="font-serif text-lg font-bold leading-tight text-[var(--challengers-ink)]">
          {formatRankLabel(userElo)}
        </p>
      </div>
      <div>
        <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--challengers-muted)]">
          Elo
        </p>
        <p className="text-lg font-semibold leading-tight text-[var(--challengers-blue)]">
          {userElo}
        </p>
      </div>
    </div>
  );
}

function CompactRankBadge({ userElo }: { userElo: number }) {
  const rank = eloToDanRank(userElo);

  return (
    <div className="flex items-center gap-2">
      <RankSeal compact kanji={rank.kanji} />
      <span className="text-[0.76rem] font-semibold text-[var(--challengers-blue)]">
        {userElo}
      </span>
    </div>
  );
}

function RankSeal({ kanji, compact = false }: { kanji: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[8px] border border-[color:var(--challengers-blue-border)] bg-[var(--challengers-blue-soft)] font-serif font-bold text-[var(--challengers-blue)]",
        compact ? "size-7 text-sm" : "size-11 text-xl",
      )}
      aria-hidden="true"
    >
      {kanji}
    </span>
  );
}

export function ChallengesStatePanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-104 items-center justify-center px-4">
      <div className="challengers-panel max-w-md rounded-2xl border px-8 py-9 text-center">
        <h2 className="font-serif text-xl font-bold text-[var(--challengers-ink)]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--challengers-muted)]">
          {description}
        </p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function ChallengesLoadingState() {
  return (
    <div className="flex min-h-104 items-center justify-center px-4">
      <div className="challengers-subtle-panel rounded-full border px-5 py-3 text-sm text-[var(--challengers-muted)]">
        Carregando catálogo...
      </div>
    </div>
  );
}

export function ChallengesRouteLoadingState() {
  return (
    <div
      data-challengers-screen="true"
      className="h-full min-h-0 bg-[var(--challengers-page)] text-[var(--challengers-ink)]"
    >
      <div className="challengers-shell h-full motion-safe:animate-pulse" />
    </div>
  );
}
