import { z } from "zod";

export type ChallengeRecord = {
  id: string;
  title: string;
  difficulty: string;
  recommendedElo: number;
  code: string;
  question: string;
  solution: string;
  evaluationRubricJson?: string | null;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
  attempts?: Array<{
    id: string;
    score: number;
    eloChange: number;
    attemptNumber: number;
    sessionStatus: "RETRY_AVAILABLE" | "SOLVED" | "ELO_EXHAUSTED" | "REVEALED";
    createdAt: Date;
  }>;
};

export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

export const challengeAttemptSummarySchema = z.object({
  id: z.string(),
  score: z.number(),
  eloChange: z.number().int().optional(),
  attemptNumber: z.number().int().positive(),
  sessionStatus: z.enum([
    "RETRY_AVAILABLE",
    "SOLVED",
    "ELO_EXHAUSTED",
    "REVEALED",
  ]),
  createdAt: z.iso.datetime().optional(),
});

export const challengeSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: difficultySchema,
  recommendedElo: z.number().int(),
  tags: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  attempts: z.array(challengeAttemptSummarySchema),
});

export const challengeDetailSchema = challengeSummarySchema.extend({
  code: z.string(),
  question: z.string(),
  evaluationAvailable: z.boolean(),
});

export function serializeChallengeSummary(challenge: ChallengeRecord) {
  return {
    id: challenge.id,
    title: challenge.title,
    difficulty: challenge.difficulty,
    recommendedElo: challenge.recommendedElo,
    tags: challenge.tags,
    createdAt: challenge.createdAt.toISOString(),
    updatedAt: challenge.updatedAt.toISOString(),
    attempts: (challenge.attempts ?? []).map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      eloChange: attempt.eloChange,
      attemptNumber: attempt.attemptNumber,
      sessionStatus: attempt.sessionStatus,
      createdAt: attempt.createdAt.toISOString(),
    })),
  };
}

export function serializeChallengeDetail(challenge: ChallengeRecord) {
  return {
    ...serializeChallengeSummary(challenge),
    code: challenge.code,
    question: challenge.question,
    evaluationAvailable: Boolean(challenge.evaluationRubricJson),
  };
}
