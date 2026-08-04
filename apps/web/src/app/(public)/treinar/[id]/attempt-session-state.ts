import {
  MAX_EVALUATED_ATTEMPTS,
  getNextEloPotentialPercent,
  type AttemptSessionStatus,
} from "@/lib/attempt-session-rules";

export type ArenaFeedback = {
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

export type ArenaAttemptResult = {
  score: number;
  eloChange: number;
  newElo?: number;
  isFirstAttempt: boolean;
  attemptNumber: number;
  status: AttemptSessionStatus;
  canRetry: boolean;
  canRevealSolution: boolean;
  remainingEvaluatedAttempts: number;
  nextEloPotentialPercent: number;
  eloFinalized: boolean;
  feedback: ArenaFeedback;
};

export type AttemptSessionState = {
  phase: "answering" | "submitting" | "revealing" | "feedback";
  result: ArenaAttemptResult | null;
  showComparison: boolean;
};

type AttemptSessionAction =
  | { type: "submit_started" }
  | { type: "submit_succeeded"; result: ArenaAttemptResult }
  | { type: "submit_failed" }
  | { type: "reveal_started" }
  | { type: "reveal_succeeded"; result: ArenaAttemptResult }
  | { type: "reveal_failed" }
  | { type: "retry_requested" }
  | { type: "comparison_toggled" };

export const initialAttemptSessionState: AttemptSessionState = {
  phase: "answering",
  result: null,
  showComparison: false,
};

type PersistedAttemptSession = {
  score: number;
  eloChange: number;
  attemptNumber: number;
  sessionStatus: AttemptSessionStatus;
  userAnswer?: string;
  feedbackJson?: string;
};

export function restoreAttemptSession(
  attempt: PersistedAttemptSession | undefined,
): { state: AttemptSessionState; userAnswer: string } {
  if (!attempt?.feedbackJson) {
    return { state: initialAttemptSessionState, userAnswer: "" };
  }

  const feedback = parsePersistedFeedback(attempt.feedbackJson);
  if (!feedback) {
    return {
      state: initialAttemptSessionState,
      userAnswer: attempt.userAnswer ?? "",
    };
  }

  const canRetry =
    attempt.attemptNumber < MAX_EVALUATED_ATTEMPTS &&
    (attempt.sessionStatus === "RETRY_AVAILABLE" ||
      (attempt.sessionStatus === "SOLVED" &&
        feedback.score < 10 &&
        feedback.seniorSolution.length === 0));
  const canRevealSolution =
    attempt.sessionStatus !== "REVEALED" &&
    feedback.seniorSolution.length === 0;
  const result: ArenaAttemptResult = {
    score: attempt.score,
    eloChange: attempt.eloChange,
    isFirstAttempt: attempt.attemptNumber === 1,
    attemptNumber: attempt.attemptNumber,
    status: attempt.sessionStatus,
    canRetry,
    canRevealSolution,
    remainingEvaluatedAttempts: Math.max(
      0,
      MAX_EVALUATED_ATTEMPTS - attempt.attemptNumber,
    ),
    nextEloPotentialPercent: canRetry
      ? attempt.sessionStatus === "SOLVED"
        ? 100
        : getNextEloPotentialPercent(attempt.attemptNumber)
      : 0,
    eloFinalized: !canRetry,
    feedback,
  };

  return {
    state: {
      phase: "feedback",
      result,
      showComparison: attempt.sessionStatus === "REVEALED",
    },
    userAnswer: attempt.userAnswer ?? "",
  };
}

function parsePersistedFeedback(serialized: string): ArenaFeedback | null {
  try {
    const stored = JSON.parse(serialized) as Partial<ArenaFeedback> & {
      schemaVersion?: unknown;
      publicFeedback?: unknown;
    };
    const value = stored.schemaVersion === 2
      ? stored.publicFeedback as Partial<ArenaFeedback>
      : stored;
    if (!value || typeof value !== "object") return null;
    return typeof value.score === "number" &&
      typeof value.summary === "string" &&
      Array.isArray(value.strengths) &&
      value.strengths.every((item) => typeof item === "string") &&
      Array.isArray(value.blindspots) &&
      value.blindspots.every((item) => typeof item === "string") &&
      typeof value.seniorSolution === "string"
      ? value as ArenaFeedback
      : null;
  } catch {
    return null;
  }
}

export function attemptSessionReducer(
  state: AttemptSessionState,
  action: AttemptSessionAction,
): AttemptSessionState {
  switch (action.type) {
    case "submit_started":
      return state.phase === "answering"
        ? { ...state, phase: "submitting" }
        : state;
    case "submit_succeeded":
    case "reveal_succeeded":
      return {
        phase: "feedback",
        result: action.result,
        showComparison: action.result.status === "REVEALED",
      };
    case "submit_failed":
      return state.phase === "submitting"
        ? { ...state, phase: "answering" }
        : state;
    case "reveal_started":
      return state.phase === "feedback" && state.result?.canRevealSolution
        ? { ...state, phase: "revealing" }
        : state;
    case "reveal_failed":
      return state.phase === "revealing"
        ? { ...state, phase: "feedback" }
        : state;
    case "retry_requested":
      return state.phase === "feedback" && state.result?.canRetry
        ? initialAttemptSessionState
        : state;
    case "comparison_toggled":
      return state.phase === "feedback" && state.result?.feedback.seniorSolution
        ? { ...state, showComparison: !state.showComparison }
        : state;
  }
}
