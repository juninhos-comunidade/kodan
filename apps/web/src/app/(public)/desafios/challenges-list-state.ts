import { DEFAULT_USER_ELO } from "./constants";
import {
  matchesChallengeTopic,
  type ChallengeTopicFilter,
} from "./challenges-taxonomy";
import {
  getChallengeKind,
  getStatusFromAttempts,
  type Challenge,
  type ChallengeKind,
  type ChallengeLanguage,
  type ChallengeStatus,
  type Difficulty,
} from "./ema-challenge-card-helpers";

export type DifficultyFilter = "ALL" | Difficulty;
export type StatusFilter = "ALL" | ChallengeStatus;
export type TypeFilter = "ALL" | ChallengeKind;
export type SortBy = "RECENT" | "ELO_ASC" | "ELO_DESC" | "TITLE";

export interface ChallengesInitialData {
  challenges: Challenge[];
  hasMore: boolean;
  totalCount: number;
  userElo: number;
  initialError: string | null;
  initialStatus?: StatusFilter;
}

export interface ChallengesState {
  challenges: Challenge[];
  loadingInitial: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  userElo: number;
  topicFilter: ChallengeTopicFilter;
  filterDifficulty: DifficultyFilter;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  onlyUnsolved: boolean;
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  initialError: string | null;
}

export type ChallengesAction =
  | { type: "reloadStarted" }
  | {
      type: "reloadSucceeded";
      payload: {
        challenges: Challenge[];
        hasMore: boolean;
        totalCount: number;
        userElo: number;
      };
    }
  | { type: "reloadFailed"; payload: string }
  | { type: "loadingMore"; payload: boolean }
  | {
      type: "appendLoaded";
      payload: { challenges: Challenge[]; hasMore: boolean; totalCount: number };
    }
  | { type: "setTopic"; payload: ChallengeTopicFilter }
  | { type: "setFilter"; payload: DifficultyFilter }
  | { type: "setStatus"; payload: StatusFilter }
  | { type: "setType"; payload: TypeFilter }
  | { type: "setOnlyUnsolved"; payload: boolean }
  | { type: "setSort"; payload: SortBy }
  | { type: "setSearch"; payload: string }
  | { type: "setPage"; payload: number }
  | { type: "clearFilters" };

export function createInitialChallengesState(
  initialData: ChallengesInitialData,
): ChallengesState {
  return {
    challenges: initialData.challenges,
    loadingInitial: false,
    loadingMore: false,
    hasMore: initialData.hasMore,
    totalCount: initialData.totalCount,
    userElo: initialData.userElo || DEFAULT_USER_ELO,
    topicFilter: "ALL",
    filterDifficulty: "ALL",
    statusFilter: initialData.initialStatus ?? "ALL",
    typeFilter: "ALL",
    onlyUnsolved: false,
    sortBy: "RECENT",
    searchQuery: "",
    page: 1,
    initialError: initialData.initialError,
  };
}

export function challengesReducer(
  state: ChallengesState,
  action: ChallengesAction,
): ChallengesState {
  switch (action.type) {
    case "reloadStarted":
      return {
        ...state,
        loadingInitial: true,
        initialError: null,
      };
    case "reloadSucceeded":
      return {
        ...state,
        challenges: action.payload.challenges,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount,
        userElo: action.payload.userElo,
        loadingInitial: false,
        page: 1,
        initialError: null,
      };
    case "reloadFailed":
      return {
        ...state,
        challenges: [],
        hasMore: false,
        loadingInitial: false,
        initialError: action.payload,
      };
    case "loadingMore":
      return {
        ...state,
        loadingMore: action.payload,
      };
    case "appendLoaded":
      return {
        ...state,
        challenges: mergeChallengesById(
          state.challenges,
          action.payload.challenges,
        ),
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount,
      };
    case "setTopic":
      return resetPage({
        ...state,
        topicFilter: action.payload,
      });
    case "setFilter":
      return resetPage({
        ...state,
        filterDifficulty: action.payload,
      });
    case "setStatus":
      return resetPage({
        ...state,
        statusFilter: action.payload,
      });
    case "setType":
      return resetPage({
        ...state,
        typeFilter: action.payload,
      });
    case "setOnlyUnsolved":
      return resetPage({
        ...state,
        onlyUnsolved: action.payload,
      });
    case "setSort":
      return resetPage({
        ...state,
        sortBy: action.payload,
      });
    case "setSearch":
      return resetPage({
        ...state,
        searchQuery: action.payload,
      });
    case "setPage":
      return {
        ...state,
        page: Math.max(1, action.payload),
      };
    case "clearFilters":
      return {
        ...state,
        topicFilter: "ALL",
        filterDifficulty: "ALL",
        statusFilter: "ALL",
        typeFilter: "ALL",
        onlyUnsolved: false,
        sortBy: "RECENT",
        searchQuery: "",
        page: 1,
      };
    default:
      return state;
  }
}

export function matchesChallenge(
  challenge: Challenge,
  searchQuery: string,
  filterDifficulty: DifficultyFilter,
  topicFilter: ChallengeTopicFilter,
  statusFilter: StatusFilter = "ALL",
  typeFilter: TypeFilter = "ALL",
  onlyUnsolved = false,
  languageFilter: ChallengeLanguage | "ALL" = "ALL",
) {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const status = getStatusFromAttempts(challenge.attempts);
  const type = getChallengeKind(challenge);
  const matchesSearch =
    normalizedQuery.length === 0 ||
    challenge.title.toLocaleLowerCase().includes(normalizedQuery) ||
    challenge.tags.toLocaleLowerCase().includes(normalizedQuery);

  const matchesDifficulty =
    filterDifficulty === "ALL" || challenge.difficulty === filterDifficulty;
  const matchesStatus = statusFilter === "ALL" || status === statusFilter;
  const matchesType = typeFilter === "ALL" || type === typeFilter;
  const matchesUnsolved = !onlyUnsolved || status !== "resolved";
  const matchesLanguage =
    languageFilter === "ALL" || challenge.language === languageFilter;

  return (
    matchesSearch &&
    matchesDifficulty &&
    matchesStatus &&
    matchesType &&
    matchesUnsolved &&
    matchesLanguage &&
    matchesChallengeTopic(challenge, topicFilter)
  );
}

export function getVisibleChallenges(
  challenges: Challenge[],
  searchQuery: string,
  filterDifficulty: DifficultyFilter,
  topicFilter: ChallengeTopicFilter,
  statusFilter: StatusFilter = "ALL",
  typeFilter: TypeFilter = "ALL",
  onlyUnsolved = false,
  sortBy: SortBy = "RECENT",
  languageFilter: ChallengeLanguage | "ALL" = "ALL",
) {
  return challenges
    .filter((challenge) =>
      matchesChallenge(
        challenge,
        searchQuery,
        filterDifficulty,
        topicFilter,
        statusFilter,
        typeFilter,
        onlyUnsolved,
        languageFilter,
      ),
    )
    .toSorted((left, right) => sortChallenges(left, right, sortBy));
}

export function getPaginatedChallenges(
  challenges: Challenge[],
  page: number,
  pageSize: number,
) {
  const start = (Math.max(1, page) - 1) * pageSize;
  return challenges.slice(start, start + pageSize);
}

export function resolveActiveChallengeId(
  visibleChallenges: Challenge[],
  currentActiveChallengeId: string | null,
) {
  if (visibleChallenges.length === 0) {
    return null;
  }

  if (currentActiveChallengeId) {
    const stillVisible = visibleChallenges.some(
      (challenge) => challenge.id === currentActiveChallengeId,
    );
    if (stillVisible) {
      return currentActiveChallengeId;
    }
  }

  return visibleChallenges[0]!.id;
}

export function getActiveChallengeNavigation(
  visibleChallenges: Challenge[],
  activeChallengeId: string | null,
) {
  if (visibleChallenges.length === 0 || !activeChallengeId) {
    return {
      activeIndex: -1,
      total: visibleChallenges.length,
      previousChallengeId: null,
      nextChallengeId: null,
    };
  }

  const activeIndex = visibleChallenges.findIndex(
    (challenge) => challenge.id === activeChallengeId,
  );
  if (activeIndex === -1) {
    return {
      activeIndex: -1,
      total: visibleChallenges.length,
      previousChallengeId: null,
      nextChallengeId: null,
    };
  }

  return {
    activeIndex,
    total: visibleChallenges.length,
    previousChallengeId: visibleChallenges[activeIndex - 1]?.id ?? null,
    nextChallengeId: visibleChallenges[activeIndex + 1]?.id ?? null,
  };
}

function sortChallenges(left: Challenge, right: Challenge, sortBy: SortBy) {
  if (sortBy === "ELO_DESC") {
    return right.recommendedElo - left.recommendedElo;
  }

  if (sortBy === "TITLE") {
    return left.title.localeCompare(right.title);
  }

  return left.recommendedElo - right.recommendedElo;
}

function resetPage(state: ChallengesState): ChallengesState {
  return {
    ...state,
    page: 1,
  };
}

function mergeChallengesById(current: Challenge[], incoming: Challenge[]) {
  const merged = new Map<string, Challenge>();

  for (const challenge of current) {
    merged.set(challenge.id, challenge);
  }

  for (const challenge of incoming) {
    merged.set(challenge.id, challenge);
  }

  return [...merged.values()];
}
