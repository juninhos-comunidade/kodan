import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Atom } from "lucide-react";
import { fn } from "storybook/test";

import { ChallengesNavigationTree } from "@/app/(public)/desafios/challenges-navigation-tree";
import { ChallengesDifficultyNode } from "@/app/(public)/desafios/challenges-difficulty-node";
import { ChallengesExplorerPanel } from "@/app/(public)/desafios/challenges-explorer-list";
import { ChallengesDesktopShell, ChallengesLoadingState, ChallengesMobileShell, ChallengesRouteLoadingState, ChallengesStatePanel } from "@/app/(public)/desafios/challenges-shell";
import { ChallengesTreeGroup } from "@/app/(public)/desafios/challenges-tree-group";
import { ChallengesTopicNode } from "@/app/(public)/desafios/challenges-topic-node";
import { buildChallengeTopicSections } from "@/app/(public)/desafios/challenges-taxonomy";
import type { Challenge } from "@/app/(public)/desafios/ema-challenge-card-helpers";

const challenges: Challenge[] = [
  { id: "effect-1", title: "Cleanup de WebSocket", language: "react", difficulty: "MEDIUM", recommendedElo: 1200, tags: "React,useEffect,cleanup", attempts: [{ id: "a1", score: 7 }] },
  { id: "state-1", title: "Estado derivado", language: "react", difficulty: "EASY", recommendedElo: 900, tags: "React,state,rendering", attempts: [] },
  { id: "perf-1", title: "Memoização seletiva", language: "react", difficulty: "HARD", recommendedElo: 1600, tags: "React,useMemo,advanced", attempts: [{ id: "a2", score: 3 }] },
];
const sections = buildChallengeTopicSections(challenges);
const user = { name: "Gabriel Silva", image: null };
const meta = { title: "Telas/Desafios", parameters: { layout: "fullscreen" }, decorators: [(Story) => <div data-challengers-screen="true" className="min-h-screen bg-[var(--challengers-page)] text-[var(--challengers-ink)]"><Story /></div>] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const NavegacaoEmArvore: Story = { render: () => <div className="challengers-panel w-80 border p-4"><ChallengesNavigationTree languageLabel="React" sections={sections} topicFilter="ALL" filterDifficulty="ALL" density="desktop" onTopicChange={fn()} onDifficultyChange={fn()} /></div> };
export const GrupoDaArvore: Story = { render: () => <div className="challengers-panel w-80 border p-4"><ChallengesTreeGroup label="React" icon={<Atom className="size-4" />} expanded density="desktop"><p className="p-3 text-sm">Módulos e dificuldades</p></ChallengesTreeGroup></div> };
export const NoDeTopico: Story = { render: () => <div className="challengers-panel w-80 border p-4"><ChallengesTopicNode section={sections[0]!} activeTopic={sections[0]!.key} activeDifficulty="ALL" density="desktop" onTopicChange={fn()} onDifficultyChange={fn()} /></div> };
export const NoDeDificuldade: Story = { render: () => <div className="challengers-panel w-80 border p-4"><ChallengesDifficultyNode difficulty="MEDIUM" count={12} active onClick={fn()} /></div> };
export const ListaDeDesafios: Story = { render: () => <ChallengesExplorerPanel languageLabel="React" topicLabel="Todos os tópicos" topicDescription="Pratique diagnósticos de React organizados por dificuldade e domínio." topicFilter="ALL" challenges={challenges} activeChallengeId={null} visibleCount={challenges.length} page={1} pageSize={10} filterDifficulty="ALL" statusFilter="ALL" typeFilter="ALL" onlyUnsolved={false} sortBy="RECENT" hasActiveFilters={false} loadingMore={false} onFocusChallenge={fn()} onOpenChallenge={fn()} onFilterChange={fn()} onStatusChange={fn()} onTypeChange={fn()} onOnlyUnsolvedChange={fn()} onSortChange={fn()} onClearFilters={fn()} onPageChange={fn()} /> };
export const ShellDesktop: Story = { render: () => <div className="h-screen"><ChallengesDesktopShell userElo={1460} user={user} title="Desafios" description="Escolha um diagnóstico e pratique." searchQuery="" onSearchChange={fn()}><div className="p-8"><ChallengesStatePanel title="Catálogo pronto" description="Use a busca ou a árvore lateral para encontrar um desafio." /></div></ChallengesDesktopShell></div> };
export const ShellMobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } }, render: () => <ChallengesMobileShell userElo={1460} user={user} searchQuery="" filtersOpen={false} filtersDisabled={false} onSearchChange={fn()} onOpenFilters={fn()}><ChallengesStatePanel title="Desafios" description="Conteúdo do catálogo no layout móvel." /></ChallengesMobileShell> };
export const EstadoVazio: Story = { render: () => <ChallengesStatePanel title="Nenhum desafio encontrado" description="Tente remover alguns filtros." action={<button className="challengers-control rounded-lg border px-4 py-2">Limpar filtros</button>} /> };
export const CarregandoCatalogo: Story = { render: () => <ChallengesLoadingState /> };
export const CarregandoRota: Story = { render: () => <ChallengesRouteLoadingState /> };
