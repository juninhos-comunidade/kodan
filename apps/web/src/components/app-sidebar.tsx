"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Swords,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@kodan/ui/lib/utils";

import { getLoginHref } from "@/lib/auth-navigation";
import { formatRankLabel } from "@/lib/rating";
import { KodanLogo } from "@/components/kodan-logo";

const CHALLENGE_LINKS = [
  { href: "/desafios", label: "Todos os Desafios", dot: "bg-[var(--profile-accent-blue)]" },
  { href: "/desafios?status=in_progress", label: "Em andamento", dot: "bg-[var(--profile-text-muted)]" },
] as const satisfies ReadonlyArray<{ href: Route; label: string; dot: string }>;

export type SidebarUser = {
  name: string;
  image: string | null;
  elo: number;
};

function formatRank(elo: number) {
  const rank = formatRankLabel(elo);
  return rank.replace(/(\d+)(?:st|nd|rd|th)\s(Kyu|Dan)/, "$1º $2");
}

function KodanMark({ compact = false }: { compact?: boolean }) {
  return (
    <KodanLogo
      compact={compact}
      wordmarkClassName="text-[var(--profile-text-primary)]"
    />
  );
}

function isChallengeRoute(pathname: string) {
  return pathname.startsWith("/desafios") || pathname.startsWith("/treinar");
}

function isSubrouteActive(pathname: string, href: Route) {
  return href === "/desafios" && pathname.startsWith("/desafios");
}

export function AppSidebar({
  collapsed,
  mobileOpen,
  pathname,
  user,
  onCloseMobile,
  onToggle,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  pathname: string;
  user: SidebarUser | null;
  onCloseMobile: () => void;
  onToggle: () => void;
}) {
  const challengeSectionActive = isChallengeRoute(pathname);
  const [challengesOpen, setChallengesOpen] = useState(challengeSectionActive);
  const compact = collapsed && !mobileOpen;
  const displayName = user?.name ?? "Entrar no Kodan";
  const initials = displayName
    .split(" ")
    .flatMap((part) => (part[0] ? [part[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const rank = user ? formatRank(user.elo) : "Crie sua conta";
  const profileHref = user ? "/perfil" : getLoginHref("/perfil");

  const closeMobileAndOpenChallenges = () => {
    setChallengesOpen(true);
    onCloseMobile();
  };

  return (
    <aside className={cn("relative flex h-svh min-h-0 shrink-0 flex-col overflow-hidden border-r border-[color:var(--profile-border)] bg-[var(--profile-bg)] transition-[width] duration-200", compact ? "w-20" : "w-64")}>
      <div className={cn("relative z-10 flex h-28 shrink-0 items-center", compact ? "justify-center px-3" : "justify-between px-7")}>
        <Link href="/inicio" aria-label="Abrir o Dojo" onClick={onCloseMobile}><KodanMark compact={compact} /></Link>
        <button data-sidebar-close={mobileOpen ? "true" : undefined} type="button" onClick={mobileOpen ? onCloseMobile : onToggle} aria-label={mobileOpen ? "Fechar sidebar" : compact ? "Expandir sidebar" : "Recolher sidebar"} className="grid size-11 place-items-center rounded-lg text-[var(--profile-text-muted)] transition-colors duration-200 hover:bg-[var(--profile-accent-blue-soft)] hover:text-[var(--profile-accent-blue)]">
          {mobileOpen ? <X className="size-4" /> : compact ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="relative z-10 min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-5" aria-label="Navegação principal">
        <div>
          <p className={cn("mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--profile-text-secondary)]", compact && "sr-only")}>Dojo</p>
          <Link href="/inicio" onClick={onCloseMobile} title={compact ? "Início" : undefined} aria-current={pathname === "/inicio" ? "page" : undefined} className={cn("group flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors duration-200 hover:bg-[var(--profile-accent-blue-soft)] hover:text-[var(--profile-accent-blue)]", pathname === "/inicio" ? "bg-[var(--profile-accent-blue-soft)] text-[var(--profile-accent-blue)]" : "text-[var(--profile-text-primary)]")}><Home className="size-5 shrink-0" /><span className={cn("whitespace-nowrap", compact && "sr-only")}>Início</span></Link>

          <div className={cn("mt-2 flex items-center rounded-xl transition-colors duration-200 hover:bg-[var(--profile-accent-blue-soft)] hover:text-[var(--profile-accent-blue)]", challengeSectionActive ? "text-[var(--profile-accent-blue)]" : "text-[var(--profile-text-primary)]")}>
            <Link href="/desafios" onClick={closeMobileAndOpenChallenges} title={compact ? "Desafios" : undefined} aria-current={challengeSectionActive ? "page" : undefined} className="flex min-h-12 min-w-0 flex-1 items-center gap-4 px-4 text-sm font-medium">
              <Swords className="size-5 shrink-0" />
              <span className={cn("flex-1 whitespace-nowrap", compact && "sr-only")}>Desafios</span>
            </Link>
            {!compact ? (
              <button type="button" onClick={() => setChallengesOpen((value) => !value)} aria-expanded={challengesOpen} aria-controls="challenges-submenu" aria-label={challengesOpen ? "Recolher atalhos de desafios" : "Expandir atalhos de desafios"} className="mr-1 grid size-11 shrink-0 place-items-center rounded-lg">
                <ChevronDown className={cn("size-4 transition-transform duration-200", challengesOpen && "rotate-180")} />
              </button>
            ) : null}
          </div>

          {challengesOpen && !compact ? (
            <div id="challenges-submenu" className="ml-9 mt-1 space-y-1 border-l border-[color:var(--profile-border)] pl-3">
              {CHALLENGE_LINKS.map((item) => {
                const active = isSubrouteActive(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={onCloseMobile} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-[var(--profile-accent-blue-soft)] hover:text-[var(--profile-accent-blue)]", active ? "bg-[var(--profile-accent-blue-soft)] text-[var(--profile-accent-blue)]" : "text-[var(--profile-text-secondary)]")}>
                    <span className={cn("size-1.5 rounded-full", item.dot)} />{item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div>
          <p className={cn("mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--profile-text-secondary)]", compact && "sr-only")}>Suporte</p>
          <Link href="/ajuda" onClick={onCloseMobile} title={compact ? "Ajuda" : undefined} aria-current={pathname === "/ajuda" ? "page" : undefined} className={cn("group flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors duration-200 hover:bg-[var(--profile-accent-blue-soft)] hover:text-[var(--profile-accent-blue)]", pathname === "/ajuda" ? "bg-[var(--profile-accent-blue-soft)] text-[var(--profile-accent-blue)]" : "text-[var(--profile-text-primary)]")}><CircleHelp className="size-5 shrink-0" /><span className={cn("whitespace-nowrap", compact && "sr-only")}>Ajuda</span></Link>
          {user && (<Link href="/configuracoes" onClick={onCloseMobile} title={compact ? "Configurações" : undefined} aria-current={pathname === "/configuracoes" ? "page" : undefined} className={cn("group mt-2 flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors duration-200 hover:bg-[var(--profile-accent-blue-soft)] hover:text-[var(--profile-accent-blue)]", pathname === "/configuracoes" ? "bg-[var(--profile-accent-blue-soft)] text-[var(--profile-accent-blue)]" : "text-[var(--profile-text-primary)]")}><Settings className="size-5 shrink-0 transition-transform duration-200 motion-safe:group-hover:rotate-45" /><span className={cn("whitespace-nowrap", compact && "sr-only")}>Configurações</span></Link>)}
        </div>
      </nav>

      <div className="relative z-10 mt-auto shrink-0 px-4 pb-5 pt-2">
        {user ? (
          <Link href={profileHref} onClick={onCloseMobile} aria-current={pathname === "/perfil" ? "page" : undefined} title={`${displayName}, ${rank}`} className={cn("group flex items-center gap-3 rounded-2xl border border-[color:var(--profile-border)] bg-[var(--profile-surface)]/90 p-3 transition-colors hover:border-[color:var(--profile-border-strong)] hover:bg-[var(--profile-accent-blue-soft)]", pathname === "/perfil" && "border-[color:var(--profile-accent-blue)]")}>
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--profile-surface-elevated)] text-xs font-bold text-[var(--profile-text-primary)]">{user.image ? <Image src={user.image} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : initials}</span>
            <span className={cn("min-w-0", compact && "sr-only")}><span className="block truncate text-xs font-semibold text-[var(--profile-text-primary)]">{displayName}</span><span className="mt-0.5 block text-xs uppercase tracking-wide text-[var(--profile-accent-blue)]">{rank} · {user.elo} ELO</span></span>
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
