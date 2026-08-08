import { describe, expect, test } from "bun:test";

import { selectFeaturedChallenge } from "./featured-challenge";

const now = new Date("2026-07-24T12:00:00.000Z");

const challenges = [
  {
    id: "popular-easy",
    difficulty: "EASY",
    recommendedElo: 900,
    uniquePractitionerCount: 30,
    evaluationAvailable: true,
    attempts: [],
  },
  {
    id: "less-popular-easy",
    difficulty: "EASY",
    recommendedElo: 800,
    uniquePractitionerCount: 10,
    evaluationAvailable: true,
    attempts: [],
  },
  {
    id: "recent-in-progress",
    difficulty: "MEDIUM",
    recommendedElo: 1210,
    uniquePractitionerCount: 2,
    evaluationAvailable: true,
    attempts: [
      {
        score: 4,
        sessionStatus: "RETRY_AVAILABLE" as const,
        createdAt: new Date("2026-07-23T12:00:00.000Z"),
      },
    ],
  },
];

describe("selectFeaturedChallenge", () => {
  test("destaca o desafio fácil praticado por mais pessoas para visitantes", () => {
    const result = selectFeaturedChallenge({
      challenges,
      now,
    });

    expect(result).toMatchObject({
      challenge: { id: "popular-easy" },
      reason: "POPULAR_BEGINNER",
    });
  });

  test("nunca destaca um desafio sem avaliação disponível", () => {
    const result = selectFeaturedChallenge({
      challenges: [
        {
          id: "popular-sem-rubrica",
          difficulty: "EASY",
          recommendedElo: 800,
          uniquePractitionerCount: 500,
          evaluationAvailable: false,
          attempts: [],
        },
        ...challenges,
      ],
      now,
    });

    expect(result.challenge?.id).toBe("popular-easy");
  });

  test("prioriza uma tentativa recente para o praticante autenticado", () => {
    const result = selectFeaturedChallenge({
      challenges,
      userElo: 1200,
      now,
    });

    expect(result).toMatchObject({
      challenge: { id: "recent-in-progress" },
      reason: "CONTINUE_RECENT",
    });
  });

  test("não mantém uma tentativa parada há cinco dias no destaque", () => {
    const staleChallenges = challenges.map((challenge) =>
      challenge.id === "recent-in-progress"
        ? {
            ...challenge,
            attempts: [
              {
                score: 4,
                sessionStatus: "RETRY_AVAILABLE" as const,
                createdAt: new Date("2026-07-19T12:00:00.000Z"),
              },
            ],
          }
        : challenge
    );

    const result = selectFeaturedChallenge({
      challenges: staleChallenges,
      userElo: 1200,
      now,
    });

    expect(result).toMatchObject({
      challenge: { id: "popular-easy" },
      reason: "PERSONALIZED",
    });
  });

  test("continua recomendando por ELO quando todos os desafios já foram tentados", () => {
    const result = selectFeaturedChallenge({
      challenges: [
        {
          id: "popular-but-far",
          difficulty: "EASY",
          recommendedElo: 900,
          uniquePractitionerCount: 50,
          evaluationAvailable: true,
          attempts: [{
            score: 8,
            sessionStatus: "SOLVED" as const,
            createdAt: new Date("2026-07-20T12:00:00.000Z"),
          }],
        },
        {
          id: "closest",
          difficulty: "MEDIUM",
          recommendedElo: 1390,
          uniquePractitionerCount: 1,
          evaluationAvailable: true,
          attempts: [{
            score: 8,
            sessionStatus: "SOLVED" as const,
            createdAt: new Date("2026-07-20T12:00:00.000Z"),
          }],
        },
      ],
      userElo: 1400,
      now,
    });

    expect(result).toMatchObject({
      challenge: { id: "closest" },
      reason: "PERSONALIZED",
    });
  });

  test("exclui o desafio atual ao escolher a próxima prática", () => {
    const result = selectFeaturedChallenge({
      challenges,
      now,
      excludeChallengeIds: ["popular-easy"],
    });

    expect(result.challenge?.id).toBe("less-popular-easy");
  });
});
