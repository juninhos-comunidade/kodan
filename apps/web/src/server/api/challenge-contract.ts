import { z } from "zod";

export type ChallengeRecord = {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  recommendedElo: number;
  code: string | null;
  codeFileName?: string | null;
  scenario?: string | null;
  topic?: string;
  presentation?: string;
  intent?: string;
  terminalJson?: string | null;
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
export const challengeLanguageSchema = z.enum([
  "react",
  "typescript",
  "python",
  "java",
  "go",
]);

export const challengePresentationSchema = z.enum(["code", "code-terminal", "terminal", "concept"]);
export const challengeIntentSchema = z.enum(["diagnose", "compare", "validate"]);
export const challengeAvailabilitySchema = z.enum(["READY", "EDITORIAL_REVIEW"]);
export const challengeTerminalSchema = z.object({
  command: z.string().min(1),
  blocks: z.array(z.object({
    label: z.string().min(1),
    content: z.string().min(1),
    tone: z.enum(["neutral", "success", "warning", "error"]),
  })).min(1),
});

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
  language: challengeLanguageSchema,
  difficulty: difficultySchema,
  recommendedElo: z.number().int(),
  tags: z.string(),
  topic: z.string(),
  presentation: challengePresentationSchema,
  intent: challengeIntentSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  evaluationAvailable: z.boolean(),
  availability: challengeAvailabilitySchema,
  attempts: z.array(challengeAttemptSummarySchema),
});

export const challengeDetailSchema = challengeSummarySchema.extend({
  code: z.string().nullable(),
  codeFileName: z.string().nullable(),
  scenario: z.string().nullable(),
  question: z.string(),
  terminal: challengeTerminalSchema.nullable(),
  evaluationAvailable: z.boolean(),
});

export function serializeChallengeSummary(challenge: ChallengeRecord) {
  const evaluationAvailable = Boolean(challenge.evaluationRubricJson);
  return {
    id: challenge.id,
    title: challenge.title,
    language: challenge.language,
    difficulty: challenge.difficulty,
    recommendedElo: challenge.recommendedElo,
    tags: challenge.tags,
    topic: challenge.topic ?? "state-rendering",
    presentation: normalizePresentation(challenge.presentation),
    intent: normalizeIntent(challenge.intent),
    createdAt: challenge.createdAt.toISOString(),
    updatedAt: challenge.updatedAt.toISOString(),
    evaluationAvailable,
    availability: evaluationAvailable ? "READY" as const : "EDITORIAL_REVIEW" as const,
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
    codeFileName: challenge.codeFileName ?? null,
    scenario: challenge.scenario ?? null,
    question: challenge.question,
    terminal: parseTerminalArtifact(challenge.terminalJson),
    evaluationAvailable: Boolean(challenge.evaluationRubricJson),
  };
}

function parseTerminalArtifact(value: string | null | undefined) {
  if (!value) return null;
  try {
    return challengeTerminalSchema.parse(JSON.parse(value) as unknown);
  } catch {
    return null;
  }
}

function normalizePresentation(value: string | undefined) {
  const parsed = challengePresentationSchema.safeParse(value ?? "code");
  return parsed.success ? parsed.data : "code" as const;
}

function normalizeIntent(value: string | undefined) {
  const parsed = challengeIntentSchema.safeParse(value ?? "diagnose");
  return parsed.success ? parsed.data : "diagnose" as const;
}
