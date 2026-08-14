type DateLikeRecord = {
  createdAt: Date;
  updatedAt?: Date;
};

type UserRecord = DateLikeRecord & {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  bio: string | null;
  image: string | null;
  elo: number;
  updatedAt: Date;
};

type AttemptRecord = {
  id: string;
  userId: string;
  challengeId: string;
  userAnswer: string;
  feedbackJson: string;
  score: number;
  eloChange: number;
  attemptNumber: number;
  sessionStatus: "RETRY_AVAILABLE" | "SOLVED" | "ELO_EXHAUSTED" | "REVEALED";
  createdAt: Date;
  challenge?: ChallengeRecord;
};

import type { ChallengeRecord } from "./challenge-contract";

export { serializeChallengeDetail, serializeChallengeSummary } from "./challenge-contract";

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    bio: user.bio,
    image: user.image,
    elo: user.elo,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function serializeAttempt(attempt: AttemptRecord) {
  return {
    id: attempt.id,
    userId: attempt.userId,
    challengeId: attempt.challengeId,
    userAnswer: attempt.userAnswer,
    feedbackJson: attempt.feedbackJson,
    score: attempt.score,
    eloChange: attempt.eloChange,
    attemptNumber: attempt.attemptNumber,
    sessionStatus: attempt.sessionStatus,
    createdAt: attempt.createdAt.toISOString(),
    ...(attempt.challenge
      ? {
          challenge: {
            id: attempt.challenge.id,
            title: attempt.challenge.title,
            language: attempt.challenge.language,
            difficulty: attempt.challenge.difficulty,
            recommendedElo: attempt.challenge.recommendedElo,
            tags: attempt.challenge.tags,
            topic: attempt.challenge.topic ?? "state-rendering",
            presentation: attempt.challenge.presentation ?? "code",
            intent: attempt.challenge.intent ?? "diagnose",
            evaluationAvailable: Boolean(attempt.challenge.evaluationRubricJson),
            availability: attempt.challenge.evaluationRubricJson ? "READY" : "EDITORIAL_REVIEW",
            createdAt: attempt.challenge.createdAt.toISOString(),
            updatedAt: attempt.challenge.updatedAt.toISOString(),
          },
        }
      : {}),
  };
}
