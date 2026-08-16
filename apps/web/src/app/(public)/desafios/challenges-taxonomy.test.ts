import { describe, expect, it } from "bun:test";

import {
  CHALLENGE_TOPICS,
  buildChallengeTopicSections,
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
    topic: overrides.topic ?? "effects-lifecycle",
    presentation: overrides.presentation ?? "code",
    intent: overrides.intent ?? "diagnose",
    evaluationAvailable: overrides.evaluationAvailable ?? true,
    availability: overrides.availability ?? "READY",
    attempts: overrides.attempts ?? [],
  };
}

describe("challenges-taxonomy", () => {
  it("expõe as seções editoriais de React", () => {
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
          topic: "async-races",
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
        topic: "async-races",
      }),
      makeChallenge({
        id: "3",
        difficulty: "EASY",
        tags: "react,state-management,immutability",
        topic: "state-rendering",
      }),
      makeChallenge({
        id: "4",
        difficulty: "HARD",
        tags: "react,composition,children,contracts",
        topic: "component-patterns",
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
      topic: "async-races",
    });

    expect(matchesChallengeTopic(raceChallenge, "ALL")).toBe(true);
    expect(matchesChallengeTopic(raceChallenge, "async-races")).toBe(true);
    expect(matchesChallengeTopic(raceChallenge, "effects-lifecycle")).toBe(
      false,
    );
  });

  it("monta filtros próprios para TypeScript, Python, Java e Go", () => {
    const languages: Array<[Challenge["language"], string]> = [
      ["typescript", "generics-inference"],
      ["python", "collections-mutability"],
      ["java", "collections-streams"],
      ["go", "goroutines-channels"],
    ];

    for (const [language, topic] of languages) {
      const sections = buildChallengeTopicSections([
        makeChallenge({ language, topic, id: `${language}-challenge` }),
      ]);
      expect(sections.find((section) => section.key === topic)?.count).toBe(1);
    }
  });
});
