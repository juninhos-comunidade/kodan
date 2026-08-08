import type {
  AttemptSessionStatus,
  FeedbackPayload,
} from "./attempt-execution";

export type TrainingUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  bio: string | null;
  image: string | null;
  elo: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TrainingAttemptSummary = {
  id: string;
  score: number;
  eloChange: number;
  attemptNumber: number;
  sessionStatus: AttemptSessionStatus;
  createdAt: Date;
  userAnswer?: string;
  feedbackJson?: string;
};

export type TrainingChallenge = {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  recommendedElo: number;
  tags: string;
  code: string;
  question: string;
  solution: string;
  evaluationRubricJson?: string | null;
  uniquePractitionerCount?: number;
  createdAt: Date;
  updatedAt: Date;
  attempts?: TrainingAttemptSummary[];
};

export type TrainingAttempt = TrainingAttemptSummary & {
  userId: string;
  challengeId: string;
  userAnswer: string;
  feedbackJson: string;
  challenge: TrainingChallenge;
};

export type AttemptSubmission = {
  score: number;
  eloChange: number;
  newElo: number;
  isFirstAttempt: boolean;
  attemptNumber: number;
  status: AttemptSessionStatus;
  canRetry: boolean;
  canRevealSolution: boolean;
  remainingEvaluatedAttempts: number;
  nextEloPotentialPercent: number;
  eloFinalized: boolean;
  feedback: FeedbackPayload;
};

export interface PractitionerAdapter {
  getOptionalUser(): Promise<TrainingUser | null>;
  getUserById(userId: string): Promise<TrainingUser | null>;
  updateUser(userId: string, input: { name: string; bio?: string; image?: string | null }): Promise<TrainingUser>;
  listAttempts(userId: string): Promise<TrainingAttempt[]>;
}

export interface ChallengeCatalogAdapter {
  listChallenges(input: { limit: number; offset: number; userId?: string }): Promise<{
    items: TrainingChallenge[];
    total: number;
    userElo: number;
  }>;
  getChallengeById(id: string, userId?: string): Promise<TrainingChallenge | null>;
  listRecommendations(userId: string, attemptedChallengeIds: string[], limit: number): Promise<TrainingChallenge[]>;
}

export interface AttemptAdapter {
  submitAttempt(userId: string, challengeId: string, input: { userAnswer: string; usedHint?: boolean }): Promise<AttemptSubmission>;
  revealAttemptSolution(userId: string, challengeId: string): Promise<AttemptSubmission>;
}

export interface ProductTelemetryAdapter {
  recordFeedbackViewed(
    userId: string,
    challengeId: string,
    attemptNumber: number,
    sessionAgeBucket: SessionAgeBucket,
  ): Promise<void>;
}

export type SessionAgeBucket =
  | "UNDER_10_MIN"
  | "MIN_10_TO_30"
  | "OVER_30_MIN";

export type TrainingAdapter =
  & PractitionerAdapter
  & ChallengeCatalogAdapter
  & AttemptAdapter
  & ProductTelemetryAdapter;

export function selectTrainingAdapter<T>(
  mockMode: boolean,
  adapters: { inMemory: T; integrated: T },
) {
  return mockMode ? adapters.inMemory : adapters.integrated;
}
