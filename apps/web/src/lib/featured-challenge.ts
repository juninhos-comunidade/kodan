export const RECENT_ATTEMPT_WINDOW_MS = 72 * 60 * 60 * 1000;

type FeaturedAttempt = {
  score: number;
  sessionStatus: "RETRY_AVAILABLE" | "SOLVED" | "ELO_EXHAUSTED" | "REVEALED";
  createdAt: Date | string;
};

export type FeaturedChallengeCandidate = {
  id: string;
  difficulty: string;
  recommendedElo: number;
  uniquePractitionerCount: number;
  evaluationAvailable: boolean;
  attempts: FeaturedAttempt[];
};

type FeaturedChallengeReason =
  | "CONTINUE_RECENT"
  | "PERSONALIZED"
  | "POPULAR_BEGINNER"
  | "FALLBACK";

type SelectFeaturedChallengeInput<T extends FeaturedChallengeCandidate> = {
  challenges: T[];
  userElo?: number;
  now: Date;
  excludeChallengeIds?: readonly string[];
};

export function selectFeaturedChallenge<T extends FeaturedChallengeCandidate>({
  challenges,
  userElo,
  now,
  excludeChallengeIds = [],
}: SelectFeaturedChallengeInput<T>): {
  challenge: T | null;
  reason: FeaturedChallengeReason;
} {
  const excludedIds = new Set(excludeChallengeIds);
  const evaluableChallenges = challenges.filter(
    (challenge) =>
      challenge.evaluationAvailable && !excludedIds.has(challenge.id),
  );

  if (userElo !== undefined) {
    let recentInProgress: T | undefined;
    let latestAttemptTime = Number.NEGATIVE_INFINITY;

    for (const challenge of evaluableChallenges) {
      const attempt = challenge.attempts[0];
      if (attempt?.sessionStatus !== "RETRY_AVAILABLE") {
        continue;
      }

      const attemptTime = new Date(attempt.createdAt).getTime();
      const isRecent =
        now.getTime() - attemptTime <= RECENT_ATTEMPT_WINDOW_MS;
      if (isRecent && attemptTime > latestAttemptTime) {
        recentInProgress = challenge;
        latestAttemptTime = attemptTime;
      }
    }

    if (recentInProgress) {
      return { challenge: recentInProgress, reason: "CONTINUE_RECENT" };
    }

    const unattemptedChallenges = evaluableChallenges.filter(
      (challenge) => challenge.attempts.length === 0,
    );
    const personalizedPool = unattemptedChallenges.length > 0
      ? unattemptedChallenges
      : evaluableChallenges;
    const personalized = personalizedPool
      .toSorted((left, right) =>
        Math.abs(left.recommendedElo - userElo) -
        Math.abs(right.recommendedElo - userElo)
      )[0];

    if (personalized) {
      return { challenge: personalized, reason: "PERSONALIZED" };
    }
  }

  const popularBeginner = evaluableChallenges
    .filter((challenge) => challenge.difficulty === "EASY")
    .sort((left, right) =>
      right.uniquePractitionerCount - left.uniquePractitionerCount ||
      left.recommendedElo - right.recommendedElo
    )[0];

  if (popularBeginner) {
    return { challenge: popularBeginner, reason: "POPULAR_BEGINNER" };
  }

  return {
    challenge: evaluableChallenges[0] ?? null,
    reason: "FALLBACK",
  };
}
