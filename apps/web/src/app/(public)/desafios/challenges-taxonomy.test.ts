import { describe, expect, it } from "bun:test";

import {
  CHALLENGE_TOPICS,
  buildChallengeTopicSections,
  getChallengeTopicKey,
  getChallengeTopicTagline,
  matchesChallengeTopic,
} from "./challenges-taxonomy";
import type { Challenge } from "./ema-challenge-card-helpers";

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: overrides.id ?? "react-hooks-stale-closure",
    title: overrides.title ?? "Stale closure no useEffect",
    language: overrides.language ?? "react",
    difficulty: overrides.difficulty ?? "MEDIUM",
    recommendedElo: overrides.recommendedElo ?? 1400,
    tags: overrides.tags ?? "useEffect,stale-closure,react-hooks",
    attempts: overrides.attempts ?? [],
  };
}

describe("challenges-taxonomy", () => {
  it("classifica os desafios em secoes de produto coerentes", () => {
    expect(getChallengeTopicKey(makeChallenge())).toBe("effects-lifecycle");
    expect(
      getChallengeTopicKey(
        makeChallenge({
          id: "react-medium-fetch-race",
          tags: "react,race-condition,data-fetching",
        }),
      ),
    ).toBe("async-races");
    expect(
      getChallengeTopicKey(
        makeChallenge({
          id: "react-easy-state-mutation",
          tags: "react,state-management,immutability",
        }),
      ),
    ).toBe("state-rendering");
    expect(
      getChallengeTopicKey(
        makeChallenge({
          id: "react-contracts-children-api",
          tags: "react,composition,children,contracts",
        }),
      ),
    ).toBe("component-patterns");
    expect(
      getChallengeTopicKey(
        makeChallenge({
          id: "typescript-generics-inference",
          title: "Inferência em tipos genéricos",
          tags: "typescript,generics,type-inference",
        }),
      ),
    ).toBe("type-system");
    expect(CHALLENGE_TOPICS.find((topic) => topic.key === "type-system")?.label).toBe(
      "Type System",
    );
  });

  it("gera uma tagline curta para a linha do explorer", () => {
    expect(
      getChallengeTopicTagline(
        makeChallenge({
          id: "react-medium-fetch-race",
          tags: "react,race-condition,data-fetching",
        }),
      ),
    ).toBe("Async UI & Races · Race Condition · Data Fetching");
  });

  it("monta a contagem da navegacao lateral", () => {
    const sections = buildChallengeTopicSections([
      makeChallenge({ id: "1", difficulty: "MEDIUM" }),
      makeChallenge({
        id: "2",
        difficulty: "HARD",
        tags: "react,race-condition,data-fetching",
      }),
      makeChallenge({
        id: "3",
        difficulty: "EASY",
        tags: "react,state-management,immutability",
      }),
      makeChallenge({
        id: "4",
        difficulty: "HARD",
        tags: "react,composition,children,contracts",
      }),
    ]);

    expect(
      sections.find((section) => section.key === "effects-lifecycle"),
    ).toEqual(
      expect.objectContaining({
        count: 1,
        difficulties: expect.objectContaining({ MEDIUM: 1 }),
      }),
    );
    expect(sections.find((section) => section.key === "async-races")).toEqual(
      expect.objectContaining({
        count: 1,
        difficulties: expect.objectContaining({ HARD: 1 }),
      }),
    );
    expect(
      sections.find((section) => section.key === "component-patterns"),
    ).toEqual(
      expect.objectContaining({
        count: 1,
        difficulties: expect.objectContaining({ HARD: 1 }),
      }),
    );
  });

  it("reconhece quando um desafio pertence ao topico filtrado", () => {
    const raceChallenge = makeChallenge({
      id: "react-medium-fetch-race",
      tags: "react,race-condition,data-fetching",
    });

    expect(matchesChallengeTopic(raceChallenge, "ALL")).toBe(true);
    expect(matchesChallengeTopic(raceChallenge, "async-races")).toBe(true);
    expect(matchesChallengeTopic(raceChallenge, "effects-lifecycle")).toBe(
      false,
    );
  });
});
