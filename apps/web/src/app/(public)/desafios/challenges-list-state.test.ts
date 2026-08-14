import { describe, expect, it } from "bun:test";

import {
  challengesReducer,
  createInitialChallengesState,
  getActiveChallengeNavigation,
  getVisibleChallenges,
  matchesChallenge,
  resolveActiveChallengeId,
} from "./challenges-list-state";
import type { Challenge } from "./ema-challenge-card-helpers";

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: overrides.id ?? "challenge-1",
    title: overrides.title ?? "Stale Closure no useEffect",
    difficulty: overrides.difficulty ?? "MEDIUM",
    recommendedElo: overrides.recommendedElo ?? 1200,
    language: overrides.language ?? "react",
    tags: overrides.tags ?? "react,useEffect,closures",
    topic: overrides.topic ?? "effects-lifecycle",
    presentation: overrides.presentation ?? "code",
    intent: overrides.intent ?? "diagnose",
    evaluationAvailable: overrides.evaluationAvailable ?? true,
    availability: overrides.availability ?? "READY",
    attempts: overrides.attempts ?? [],
  };
}

describe("challenges-list-state", () => {
  it("cria o estado inicial com os dados do servidor", () => {
    const state = createInitialChallengesState({
      challenges: [makeChallenge()],
      hasMore: true,
      totalCount: 1,
      userElo: 1320,
      initialError: null,
    });

    expect(state.challenges).toHaveLength(1);
    expect(state.hasMore).toBe(true);
    expect(state.totalCount).toBe(1);
    expect(state.userElo).toBe(1320);
    expect(state.loadingInitial).toBe(false);
    expect(state.initialError).toBeNull();
  });

  it("aplica o filtro inicial recebido pela rota", () => {
    const state = createInitialChallengesState({
      challenges: [makeChallenge()],
      hasMore: false,
      totalCount: 1,
      userElo: 1200,
      initialError: null,
      initialStatus: "in_progress",
    });

    expect(state.statusFilter).toBe("in_progress");
  });

  it("faz match por texto e por dificuldade", () => {
    const challenge = makeChallenge();

    expect(matchesChallenge(challenge, "closure", "ALL", "ALL")).toBe(true);
    expect(
      matchesChallenge(challenge, "react", "MEDIUM", "effects-lifecycle"),
    ).toBe(true);
    expect(matchesChallenge(challenge, "zustand", "ALL", "ALL")).toBe(false);
    expect(matchesChallenge(challenge, "closure", "HARD", "ALL")).toBe(false);
    expect(matchesChallenge(challenge, "closure", "ALL", "async-races")).toBe(
      false,
    );
  });

  it("retorna apenas os desafios visíveis para o filtro atual", () => {
    const visibleChallenges = getVisibleChallenges(
      [
        makeChallenge({
          id: "1",
          title: "Stale closure no React",
          difficulty: "MEDIUM",
        }),
        makeChallenge({
          id: "2",
          title: "Promise race no fetch",
          difficulty: "HARD",
          tags: "react,race-condition,data-fetching",
        }),
      ],
      "react",
      "MEDIUM",
      "effects-lifecycle",
    );

    expect(visibleChallenges).toEqual([expect.objectContaining({ id: "1" })]);
  });

  it("filtra os desafios pela linguagem selecionada", () => {
    const visibleChallenges = getVisibleChallenges(
      [
        makeChallenge({ id: "react", language: "react" }),
        makeChallenge({ id: "typescript", language: "typescript" }),
      ],
      "",
      "ALL",
      "ALL",
      "ALL",
      "ALL",
      false,
      "RECENT",
      "typescript",
    );

    expect(visibleChallenges.map((challenge) => challenge.id)).toEqual([
      "typescript",
    ]);
  });

  it("resolve o desafio ativo mantendo o atual quando ele ainda esta visível", () => {
    const visibleChallenges = [
      makeChallenge({ id: "1", recommendedElo: 900 }),
      makeChallenge({ id: "2", recommendedElo: 1050 }),
    ];

    expect(resolveActiveChallengeId(visibleChallenges, "2")).toBe("2");
    expect(resolveActiveChallengeId(visibleChallenges, null)).toBe("1");
    expect(resolveActiveChallengeId(visibleChallenges, "fora-da-lista")).toBe(
      "1",
    );
    expect(resolveActiveChallengeId([], "2")).toBeNull();
  });

  it("calcula a navegação do desafio ativo dentro da lista visível", () => {
    const visibleChallenges = [
      makeChallenge({ id: "1", recommendedElo: 900 }),
      makeChallenge({ id: "2", recommendedElo: 1050 }),
      makeChallenge({ id: "3", recommendedElo: 1200 }),
    ];

    expect(getActiveChallengeNavigation(visibleChallenges, "2")).toEqual({
      activeIndex: 1,
      total: 3,
      previousChallengeId: "1",
      nextChallengeId: "3",
    });

    expect(getActiveChallengeNavigation(visibleChallenges, "fora")).toEqual({
      activeIndex: -1,
      total: 3,
      previousChallengeId: null,
      nextChallengeId: null,
    });
  });

  it("limpa o erro inicial quando um recarregamento funciona", () => {
    const initialState = createInitialChallengesState({
      challenges: [],
      hasMore: false,
      totalCount: 0,
      userElo: 1200,
      initialError: "Falha anterior",
    });

    const loadingState = challengesReducer(initialState, {
      type: "reloadStarted",
    });
    const reloadedState = challengesReducer(loadingState, {
      type: "reloadSucceeded",
      payload: {
        challenges: [makeChallenge()],
        hasMore: false,
        totalCount: 1,
        userElo: 1280,
      },
    });

    expect(loadingState.loadingInitial).toBe(true);
    expect(reloadedState.loadingInitial).toBe(false);
    expect(reloadedState.initialError).toBeNull();
    expect(reloadedState.challenges).toHaveLength(1);
    expect(reloadedState.userElo).toBe(1280);
  });

  it("limpa topico, dificuldade e busca quando o usuario remove os recortes", () => {
    const initialState = createInitialChallengesState({
      challenges: [],
      hasMore: false,
      totalCount: 0,
      userElo: 1200,
      initialError: null,
    });

    const filteredState = challengesReducer(
      {
        ...initialState,
        topicFilter: "async-races",
        filterDifficulty: "HARD",
        statusFilter: "in_progress",
        typeFilter: "HOOKS",
        onlyUnsolved: true,
        sortBy: "TITLE",
        searchQuery: "fetch",
      },
      { type: "clearFilters" },
    );

    expect(filteredState.topicFilter).toBe("ALL");
    expect(filteredState.filterDifficulty).toBe("ALL");
    expect(filteredState.statusFilter).toBe("ALL");
    expect(filteredState.typeFilter).toBe("ALL");
    expect(filteredState.onlyUnsolved).toBe(false);
    expect(filteredState.sortBy).toBe("RECENT");
    expect(filteredState.searchQuery).toBe("");
  });
});
