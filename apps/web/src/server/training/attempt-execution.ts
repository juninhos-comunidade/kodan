import {
  ELO_POTENTIAL_BY_ATTEMPT,
  MAX_EVALUATED_ATTEMPTS,
  PASSING_ATTEMPT_SCORE,
  type AttemptSessionStatus,
} from "@/lib/attempt-session-rules";

export {
  MAX_EVALUATED_ATTEMPTS,
  PASSING_ATTEMPT_SCORE,
  type AttemptSessionStatus,
} from "@/lib/attempt-session-rules";

export type FeedbackPayload = {
  schemaVersion?: 2;
  score: number;
  level?: "INCORRECT" | "RELATED_BUT_INCORRECT" | "PARTIALLY_CORRECT" | "CORRECT" | "PRECISE";
  summary: string;
  strengths: string[];
  blindspots: string[];
  points?: Array<
    | { kind: "MATCHED"; conceptId: string; label: string }
    | { kind: "HIDDEN"; slot: string; label: "???" }
    | { kind: "REVEALED"; conceptId: string; label: string }
    | { kind: "COMPLEMENT"; conceptId: string; label: string }
  >;
  corrections?: string[];
  reflectionPrompt?: string;
  detailedReviewAvailable?: boolean;
  seniorSolution: string;
};

export class InvalidAttemptEvaluationError extends Error {
  constructor() {
    super("Avaliação válida é obrigatória");
    this.name = "InvalidAttemptEvaluationError";
  }
}

type AttemptEvaluationInput = {
  currentElo: number;
  previousAttempts: Array<{
    score: number;
    eloChange: number;
    sessionStatus: AttemptSessionStatus;
  }>;
  usedHint: boolean;
  solution: string;
  feedback: unknown;
};

type RevealAttemptSolutionInput = {
  currentElo: number;
  attemptNumber: number;
  solution: string;
  feedback: unknown;
};

const DEFAULT_SUMMARY =
  "Você identificou os principais problemas do código, demonstrando boa compreensão do fluxo do React. Alguns detalhes mais sutis poderiam ser aprofundados.";
const DEFAULT_STRENGTHS = [
  "Identificou o problema principal relacionado ao fluxo de estado e efeitos.",
  "Construiu uma explicação lógica sobre o impacto no comportamento do componente.",
];
const DEFAULT_BLINDSPOTS = [
  "Faltou detalhar o cleanup de efeitos assíncronos quando aplicável.",
  "Poderia mencionar estratégias para manter dependências estáveis entre renderizações.",
];

export function evaluateAttempt(input: AttemptEvaluationInput) {
  if (input.previousAttempts.length >= MAX_EVALUATED_ATTEMPTS) {
    throw new Error("Limite de tentativas atingido");
  }

  const normalizedFeedback = normalizeFeedback(input.feedback, input.solution);
  const previousAttempts = input.previousAttempts;
  const attemptNumber = previousAttempts.length + 1;
  const isCurrentAnswerPassing = normalizedFeedback.score >= PASSING_ATTEMPT_SCORE;
  const previousPassingAttempts = previousAttempts.filter(
    (attempt) =>
      attempt.sessionStatus === "SOLVED" ||
      attempt.score >= PASSING_ATTEMPT_SCORE,
  );
  const hasPreviousPass = previousPassingAttempts.length > 0;
  const sessionIsSolved = hasPreviousPass || isCurrentAnswerPassing;
  const hasEvaluatedAttemptsLeft = attemptNumber < MAX_EVALUATED_ATTEMPTS;
  const bestScore = Math.max(
    normalizedFeedback.score,
    ...previousPassingAttempts.map((attempt) => attempt.score),
  );
  const canImprove = sessionIsSolved && bestScore < 10 && hasEvaluatedAttemptsLeft;
  const status: AttemptSessionStatus = sessionIsSolved
    ? "SOLVED"
    : hasEvaluatedAttemptsLeft
      ? "RETRY_AVAILABLE"
      : "ELO_EXHAUSTED";
  const potentialPercent = hasPreviousPass
    ? 100
    : ELO_POTENTIAL_BY_ATTEMPT[attemptNumber - 1] ?? 0;
  let targetEloAward = isCurrentAnswerPassing
    ? Math.round(
      Math.max(0, calculateEloDelta(normalizedFeedback.score)) *
      potentialPercent /
      100,
    )
    : 0;
  if (input.usedHint && targetEloAward > 7) {
    targetEloAward = 7;
  }
  const previousAwardedElo = previousAttempts.reduce(
    (total, attempt) => total + Math.max(0, attempt.eloChange),
    0,
  );
  const previousBestScore = Math.max(
    0,
    ...previousPassingAttempts.map((attempt) => attempt.score),
  );
  const eloChange = hasPreviousPass
    ? isCurrentAnswerPassing && normalizedFeedback.score > previousBestScore
      ? Math.max(0, targetEloAward - previousAwardedElo)
      : 0
    : targetEloAward;

  const canRetry = status === "RETRY_AVAILABLE" || canImprove;
  const feedback = sessionIsSolved && !canRetry
    ? normalizedFeedback
    : { ...normalizedFeedback, seniorSolution: "" };

  return {
    score: feedback.score,
    eloChange,
    newElo: Math.max(100, input.currentElo + eloChange),
    isFirstAttempt: attemptNumber === 1,
    attemptNumber,
    status,
    canRetry,
    canRevealSolution: feedback.seniorSolution.length === 0,
    remainingEvaluatedAttempts: Math.max(0, MAX_EVALUATED_ATTEMPTS - attemptNumber),
    nextEloPotentialPercent: canRetry
      ? sessionIsSolved
        ? 100
        : ELO_POTENTIAL_BY_ATTEMPT[attemptNumber] ?? 0
      : 0,
    eloFinalized: !canRetry,
    feedback,
  };
}

export function revealAttemptSolution(input: RevealAttemptSolutionInput) {
  const feedback = normalizeFeedback(input.feedback, input.solution);

  return {
    score: feedback.score,
    eloChange: 0,
    newElo: input.currentElo,
    isFirstAttempt: input.attemptNumber === 1,
    attemptNumber: input.attemptNumber,
    status: "REVEALED" as const,
    canRetry: false,
    canRevealSolution: false,
    remainingEvaluatedAttempts: Math.max(0, MAX_EVALUATED_ATTEMPTS - input.attemptNumber),
    nextEloPotentialPercent: 0,
    eloFinalized: true,
    feedback,
  };
}

function calculateEloDelta(score: number) {
  if (score >= 8) return 10 + (score - 8) * 5;
  if (score >= 5) return 2 + (score - 5) * 1.5;
  return -15 + score * 2.5;
}

function normalizeFeedback(payload: unknown, solution: string): FeedbackPayload {
  const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  if (typeof value.score !== "number" || !Number.isFinite(value.score)) {
    throw new InvalidAttemptEvaluationError();
  }
  const score = Math.max(0, Math.min(10, value.score));
  const summary = typeof value.summary === "string" && value.summary.trim()
    ? value.summary.trim()
    : DEFAULT_SUMMARY;
  const strengths = readStringArray(value.strengths);
  const blindspots = readStringArray(value.blindspots);
  const progressiveFeedback = readProgressiveFeedback(value);

  return {
    ...progressiveFeedback,
    score,
    summary,
    strengths: strengths ?? DEFAULT_STRENGTHS,
    blindspots: blindspots ?? DEFAULT_BLINDSPOTS,
    seniorSolution: solution,
  };
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return null;
  const strings = value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0);
  return value.length === 0 || strings.length > 0 ? strings : null;
}

function readProgressiveFeedback(value: Record<string, unknown>) {
  if (value.schemaVersion !== 2) return {};
  const levels = new Set([
    "INCORRECT",
    "RELATED_BUT_INCORRECT",
    "PARTIALLY_CORRECT",
    "CORRECT",
    "PRECISE",
  ]);
  const points = Array.isArray(value.points)
    ? value.points.filter(isFeedbackPoint)
    : [];
  if (
    typeof value.level !== "string" ||
    !levels.has(value.level) ||
    points.length !== (Array.isArray(value.points) ? value.points.length : -1) ||
    typeof value.detailedReviewAvailable !== "boolean"
  ) {
    return {};
  }
  return {
    schemaVersion: 2 as const,
    level: value.level as NonNullable<FeedbackPayload["level"]>,
    points,
    ...(readStringArray(value.corrections) !== null
      ? { corrections: readStringArray(value.corrections) ?? [] }
      : {}),
    ...(typeof value.reflectionPrompt === "string" && value.reflectionPrompt.trim()
      ? { reflectionPrompt: value.reflectionPrompt.trim() }
      : {}),
    detailedReviewAvailable: value.detailedReviewAvailable,
  };
}

function isFeedbackPoint(value: unknown): value is NonNullable<FeedbackPayload["points"]>[number] {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  if (point.kind === "HIDDEN") {
    return point.label === "???" && typeof point.slot === "string";
  }
  return (
    point.kind === "MATCHED" ||
    point.kind === "REVEALED" ||
    point.kind === "COMPLEMENT"
  ) &&
    typeof point.conceptId === "string" &&
    typeof point.label === "string";
}
