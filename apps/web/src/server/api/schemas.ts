import { z } from "zod";
import {
  challengeDetailSchema,
  challengeLanguageSchema,
  challengeSummarySchema,
  difficultySchema,
} from "./challenge-contract";
import { validateTrainingAnswer } from "@/lib/training-input-guard";

export {
  challengeAttemptSummarySchema,
  challengeDetailSchema,
  challengeLanguageSchema,
  challengeSummarySchema,
  difficultySchema,
} from "./challenge-contract";

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.literal("EVALUATION_UNAVAILABLE").optional(),
  reason: z.string().optional(),
  retryable: z.boolean().optional(),
  preserveAnswer: z.boolean().optional(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  bio: z.string().nullable(),
  image: z.string().nullable(),
  elo: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const updateCurrentUserSchema = z.object({
  name: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(180).optional(),
  image: z.string().nullable().optional(),
});

export const listChallengesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15),
  offset: z.coerce.number().int().min(0).default(0),
});

const challengeProductEventSchema = z.object({
  name: z.enum([
    "challenge_viewed",
    "diagnosis_started",
    "auth_gate_viewed",
    "next_challenge_started",
  ]),
  challengeId: z.string().trim().min(1).max(128),
}).strict();

export const productEventSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("home_viewed") }).strict(),
  challengeProductEventSchema,
  z.object({
    name: z.literal("active_day"),
    contextBucket: z.enum(["D1", "D2_TO_D6", "D7_PLUS"]),
  }).strict(),
]);

export const feedbackSchema = z.object({
  schemaVersion: z.literal(2).optional(),
  score: z.number().min(0).max(10),
  level: z.enum([
    "INCORRECT",
    "RELATED_BUT_INCORRECT",
    "PARTIALLY_CORRECT",
    "CORRECT",
    "PRECISE",
  ]).optional(),
  summary: z.string(),
  strengths: z.array(z.string()),
  blindspots: z.array(z.string()),
  points: z.array(z.union([
    z.object({ kind: z.literal("MATCHED"), conceptId: z.string(), label: z.string() }),
    z.object({ kind: z.literal("HIDDEN"), slot: z.string(), label: z.literal("???") }),
    z.object({ kind: z.literal("REVEALED"), conceptId: z.string(), label: z.string() }),
    z.object({ kind: z.literal("COMPLEMENT"), conceptId: z.string(), label: z.string() }),
  ])).optional(),
  corrections: z.array(z.string()).optional(),
  reflectionPrompt: z.string().optional(),
  detailedReviewAvailable: z.boolean().optional(),
  seniorSolution: z.string(),
});

export const submitAttemptSchema = z.object({
  userAnswer: z.string().superRefine((answer, context) => {
    const validation = validateTrainingAnswer(answer);
    if (!validation.valid) {
      context.addIssue({ code: "custom", message: validation.error });
    }
  }),
  usedHint: z.boolean().optional().default(false),
});

export const attemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  challengeId: z.string(),
  userAnswer: z.string(),
  feedbackJson: z.string(),
  score: z.number(),
  eloChange: z.number().int(),
  attemptNumber: z.number().int().positive(),
  sessionStatus: z.enum([
    "RETRY_AVAILABLE",
    "SOLVED",
    "ELO_EXHAUSTED",
    "REVEALED",
  ]),
  createdAt: z.iso.datetime(),
  challenge: challengeSummarySchema.omit({ attempts: true }).optional(),
});

export const currentUserResponseSchema = z.object({
  success: z.literal(true),
  data: userSchema,
});

export const challengesResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(challengeSummarySchema),
    total: z.number().int(),
    offset: z.number().int(),
    nextOffset: z.number().int(),
    hasMore: z.boolean(),
    userElo: z.number().int(),
  }),
});

export const challengeResponseSchema = z.object({
  success: z.literal(true),
  data: challengeDetailSchema,
});

export const submitAttemptResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    score: z.number().min(0).max(10),
    eloChange: z.number().int(),
    newElo: z.number().int(),
    isFirstAttempt: z.boolean(),
    attemptNumber: z.number().int().positive(),
    status: z.enum([
      "RETRY_AVAILABLE",
      "SOLVED",
      "ELO_EXHAUSTED",
      "REVEALED",
    ]),
    canRetry: z.boolean(),
    canRevealSolution: z.boolean(),
    remainingEvaluatedAttempts: z.number().int().min(0),
    nextEloPotentialPercent: z.number().int().min(0).max(100),
    eloFinalized: z.boolean(),
    feedback: feedbackSchema,
  }),
});

export const attemptsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(attemptSchema),
});
