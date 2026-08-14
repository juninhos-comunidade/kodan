"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";

import { ZenToast } from "@kodan/ui/components/zen";
import { useZenToast } from "@/hooks/use-zen-toast";
import { ChallengesNavigationDrawer } from "./challenges-navigation-drawer";
import {
  ChallengesLanguageExplorer,
  getChallengeLanguageDefinition,
} from "./challenges-language-explorer";
import { ChallengesExplorerPanel } from "./challenges-explorer-list";
import {
  CHALLENGES_INITIAL_LOAD_SIZE,
  CHALLENGES_PAGE_SIZE,
} from "./constants";
import {
  challengesReducer,
  createInitialChallengesState,
  getPaginatedChallenges,
  getVisibleChallenges,
  resolveActiveChallengeId,
  type ChallengesInitialData,
} from "./challenges-list-state";
import {
  getChallengeTopicDescription,
  getChallengeTopicLabel,
} from "./challenges-taxonomy";
import {
  ChallengesDesktopShell,
  ChallengesLoadingState,
  ChallengesMobileShell,
  ChallengesStatePanel,
} from "./challenges-shell";
import {
  type Challenge,
  type ChallengeLanguage,
} from "./ema-challenge-card-helpers";

type ChallengesApiResponse =
  | {
      success: true;
      data: {
        items: Challenge[];
        hasMore: boolean;
        total: number;
        userElo: number;
      };
    }
  | { success: false; error: string };

async function fetchChallenges(params: { limit: number; offset: number }) {
  const searchParams = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  const response = await fetch(`/api/challenges?${searchParams.toString()}`);

  if (!response.ok) {
    return {
      success: false,
      error: `Não foi possível carregar os desafios (${response.status}).`,
    } satisfies ChallengesApiResponse;
  }

  return (await response.json()) as ChallengesApiResponse;
}

export default function ChallengesPageClient({
  initialData,
  user,
  authenticated,
}: {
  initialData: ChallengesInitialData;
  user: { name: string; image: string | null };
  authenticated: boolean;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    challengesReducer,
    initialData,
    createInitialChallengesState,
  );
  const [focusedChallengeId, setFocusedChallengeId] = useState<string | null>(
    null,
  );
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ChallengeLanguage | null>(null);
  const { toast, showToast } = useZenToast();

  const showZenErrorToast = (message: string) => {
    showToast("error", "Falha de carregamento", message);
  };

  const loadInitialChallenges = async () => {
    if (state.loadingInitial) {
      return;
    }

    dispatch({ type: "reloadStarted" });

    try {
      const response = await fetchChallenges({
        limit: CHALLENGES_INITIAL_LOAD_SIZE,
        offset: 0,
      });
      if (response.success) {
        dispatch({
          type: "reloadSucceeded",
          payload: {
            challenges: response.data.items as Challenge[],
            hasMore: response.data.hasMore,
            totalCount: response.data.total,
            userElo: response.data.userElo,
          },
        });
        return;
      }

      const errorMessage =
        response.error || "Não foi possível carregar os desafios agora.";
      dispatch({ type: "reloadFailed", payload: errorMessage });
      showZenErrorToast(errorMessage);
    } catch {
      const errorMessage = "Erro ao conectar ao servidor";
      dispatch({ type: "reloadFailed", payload: errorMessage });
      showZenErrorToast(errorMessage);
    }
  };

  const loadMoreChallenges = async () => {
    if (state.loadingInitial || state.loadingMore || !state.hasMore) {
      return;
    }

    dispatch({ type: "loadingMore", payload: true });

    try {
      const response = await fetchChallenges({
        limit: CHALLENGES_PAGE_SIZE,
        offset: state.challenges.length,
      });

      if (response.success) {
        dispatch({
          type: "appendLoaded",
          payload: {
            challenges: response.data.items as Challenge[],
            hasMore: response.data.hasMore,
            totalCount: response.data.total,
          },
        });
        dispatch({ type: "loadingMore", payload: false });
      } else {
        showZenErrorToast(response.error || "Erro ao carregar mais desafios");
        dispatch({ type: "loadingMore", payload: false });
      }
    } catch {
      showZenErrorToast("Erro ao conectar ao servidor");
      dispatch({ type: "loadingMore", payload: false });
    }
  };

  const visibleChallenges = getVisibleChallenges(
    state.challenges,
    state.searchQuery,
    state.filterDifficulty,
    state.topicFilter,
    state.statusFilter,
    state.typeFilter,
    state.onlyUnsolved,
    state.sortBy,
    selectedLanguage ?? "ALL",
  );
  const paginatedChallenges = getPaginatedChallenges(
    visibleChallenges,
    state.page,
    CHALLENGES_PAGE_SIZE,
  );
  const activeChallengeId = resolveActiveChallengeId(
    paginatedChallenges,
    focusedChallengeId,
  );
  const topicLabel =
    state.topicFilter === "ALL"
      ? selectedLanguage
        ? `Todos os desafios de ${getChallengeLanguageDefinition(selectedLanguage).name}`
        : "Todos os desafios"
      : getChallengeTopicLabel(state.topicFilter, selectedLanguage ?? undefined);
  const topicDescription =
    state.topicFilter === "ALL"
      ? "Escolha um exercício e continue sua evolução no Dojo."
      : getChallengeTopicDescription(state.topicFilter, selectedLanguage ?? undefined);
  const hasActiveFilters =
    state.searchQuery.trim().length > 0 ||
    state.filterDifficulty !== "ALL" ||
    state.statusFilter !== "ALL" ||
    state.typeFilter !== "ALL" ||
    state.onlyUnsolved ||
    state.topicFilter !== "ALL" ||
    state.sortBy !== "RECENT";
  const selectedLanguageDefinition = selectedLanguage
    ? getChallengeLanguageDefinition(selectedLanguage)
    : null;
  const selectedLanguageChallenges = selectedLanguage
    ? state.challenges.filter(
        (challenge) => challenge.language === selectedLanguage,
      )
    : [];

  const handlePageChange = async (page: number) => {
    if (page < 1) {
      return;
    }

    const requestedEnd = page * CHALLENGES_PAGE_SIZE;
    if (requestedEnd > state.challenges.length && state.hasMore) {
      await loadMoreChallenges();
    }

    dispatch({ type: "setPage", payload: page });
  };

  const openChallenge = (challengeId: string) => {
    router.push(`/treinar/${challengeId}`);
  };

  const listContent = state.loadingInitial ? (
    <ChallengesLoadingState />
  ) : state.initialError ? (
    <ChallengesStatePanel
      title="Catálogo indisponível"
      description={state.initialError}
      action={
        <button
          type="button"
          className="challengers-control h-10 rounded-[8px] border px-4 text-sm"
          disabled={state.loadingInitial}
          onClick={loadInitialChallenges}
        >
          {state.loadingInitial ? "Carregando..." : "Tentar novamente"}
        </button>
      }
    />
  ) : (
    <ChallengesExplorerPanel
      languageLabel={selectedLanguageDefinition?.name ?? "React"}
      topicLabel={topicLabel}
      topicDescription={topicDescription}
      topicFilter={state.topicFilter}
      challenges={paginatedChallenges}
      activeChallengeId={activeChallengeId}
      visibleCount={visibleChallenges.length}
      page={state.page}
      pageSize={CHALLENGES_PAGE_SIZE}
      filterDifficulty={state.filterDifficulty}
      statusFilter={state.statusFilter}
      typeFilter={state.typeFilter}
      onlyUnsolved={state.onlyUnsolved}
      sortBy={state.sortBy}
      hasActiveFilters={hasActiveFilters}
      loadingMore={state.loadingMore}
      onFocusChallenge={setFocusedChallengeId}
      onOpenChallenge={openChallenge}
      onFilterChange={(difficulty) =>
        dispatch({ type: "setFilter", payload: difficulty })
      }
      onStatusChange={(status) =>
        dispatch({ type: "setStatus", payload: status })
      }
      onTypeChange={(type) => dispatch({ type: "setType", payload: type })}
      onOnlyUnsolvedChange={(checked) =>
        dispatch({ type: "setOnlyUnsolved", payload: checked })
      }
      onSortChange={(sortBy) => dispatch({ type: "setSort", payload: sortBy })}
      onClearFilters={() => dispatch({ type: "clearFilters" })}
      onPageChange={(page) => void handlePageChange(page)}
    />
  );

  const content =
    state.loadingInitial || state.initialError ? (
      listContent
    ) : (
      <ChallengesLanguageExplorer
        challenges={state.challenges}
        userElo={state.userElo}
        authenticated={authenticated}
        selectedLanguage={selectedLanguage}
        selectedTopic={state.topicFilter}
        onSelectLanguage={(language) => {
          setSelectedLanguage(language);
          dispatch({ type: "setTopic", payload: "ALL" });
          dispatch({ type: "setFilter", payload: "ALL" });
        }}
        onSelectTopic={(language, topic) => {
          setSelectedLanguage(language);
          dispatch({ type: "setTopic", payload: topic });
          dispatch({ type: "setFilter", payload: "ALL" });
        }}
        onBackToTree={() => {
          setSelectedLanguage(null);
          setNavigationOpen(false);
          dispatch({ type: "setTopic", payload: "ALL" });
        }}
      >
        {listContent}
      </ChallengesLanguageExplorer>
    );

  return (
    <main
      data-challengers-screen="true"
      className="h-full min-h-0 bg-[var(--challengers-page)] text-[var(--challengers-ink)]"
    >
      <div className="hidden h-full min-h-0 w-full lg:block">
        <ChallengesDesktopShell
          userElo={state.userElo}
          user={user}
          title={
            selectedLanguageDefinition
              ? `Desafios de ${selectedLanguageDefinition.name}`
              : "Árvore de tecnologias"
          }
          description={
            selectedLanguageDefinition
              ? topicDescription
              : "Escolha uma linguagem para explorar o catálogo."
          }
          searchQuery={state.searchQuery}
          onSearchChange={(query) =>
            dispatch({ type: "setSearch", payload: query })
          }
        >
          {content}
        </ChallengesDesktopShell>
      </div>

      <ChallengesMobileShell
        userElo={state.userElo}
        user={user}
        authenticated={authenticated}
        searchQuery={state.searchQuery}
        filtersOpen={navigationOpen}
        filtersDisabled={!selectedLanguage}
        onSearchChange={(query) =>
          dispatch({ type: "setSearch", payload: query })
        }
        onOpenFilters={() => setNavigationOpen(true)}
      >
        {content}
      </ChallengesMobileShell>

      {selectedLanguageDefinition ? (
        <ChallengesNavigationDrawer
          open={navigationOpen}
          languageLabel={selectedLanguageDefinition.name}
          challenges={selectedLanguageChallenges}
          topicFilter={state.topicFilter}
          filterDifficulty={state.filterDifficulty}
          onClose={() => setNavigationOpen(false)}
          onTopicChange={(topic) =>
            dispatch({ type: "setTopic", payload: topic })
          }
          onDifficultyChange={(difficulty) =>
            dispatch({ type: "setFilter", payload: difficulty })
          }
        />
      ) : null}

      <div className="fixed bottom-4 right-4 z-50">
        <ZenToast open={toast.open} tone={toast.tone} title={toast.title}>
          {toast.message}
        </ZenToast>
      </div>
    </main>
  );
}
