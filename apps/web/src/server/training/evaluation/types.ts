export type ModelEvaluationStatus = "VALID" | "OFF_TOPIC" | "NONSENSE";

export type ConceptImportance = "critical" | "essential" | "complementary";

export type ConceptAssessmentState =
  | "MATCHED"
  | "PARTIAL"
  | "MISSING"
  | "CONTRADICTED";

export type ScoredConceptAssessment = {
  id: string;
  importance: ConceptImportance;
  state: ConceptAssessmentState;
};

export type EvaluationScoreInput = {
  status: ModelEvaluationStatus;
  centralCorrectness: number;
  technicalReasoning: number;
  technicalPrecision: number;
  concepts: ScoredConceptAssessment[];
  hasCriticalMisconception: boolean;
  hasRelevantMisconception?: boolean;
};

export type EvaluationScore = {
  score: number;
  passed: boolean;
  essentialCoverage: number;
};

export type ChallengeQuestionKind =
  | "debugging"
  | "explain-code"
  | "explain-concept"
  | "justify-use"
  | "explain-bad-practice"
  | "output-diagnosis"
  | "compare-concepts"
  | "behavior-validation"
  | "other";

export type ChallengeEvaluationRubric = {
  version: string;
  questionKind: ChallengeQuestionKind;
  centralAnswer: string;
  evaluatorNotes?: string[];
  concepts: Array<{
    id: string;
    importance: ConceptImportance;
    internalDescription: string;
    publicLabel: string;
    reflectionPrompt?: string;
  }>;
  misconceptions?: Array<{
    id: string;
    severity: "minor" | "major" | "critical";
    internalDescription: string;
    publicCorrection?: string;
  }>;
};

export type EvaluationInput = {
  challenge: {
    id: string;
    title: string;
    question: string;
    code: string | null;
    scenario?: string | null;
    presentation?: "code" | "code-terminal" | "terminal" | "concept";
    terminal?: {
      command: string;
      blocks: Array<{
        label: string;
        content: string;
        tone: "neutral" | "success" | "warning" | "error";
      }>;
    } | null;
    type?: string;
  };
  userAnswer: string;
  attemptNumber?: number;
  rubric: ChallengeEvaluationRubric;
};

export type ModelEvaluation = {
  status: ModelEvaluationStatus;
  centralCorrectness: number;
  technicalReasoning: number;
  technicalPrecision: number;
  conceptAssessments: Array<{
    conceptId: string;
    state: ConceptAssessmentState;
    evidence: string;
  }>;
  misconceptionIds: string[];
  decisionRationale: string;
};

export type PublicAttemptFeedback = {
  schemaVersion?: 2;
  score: number;
  level?:
    | "INCORRECT"
    | "RELATED_BUT_INCORRECT"
    | "PARTIALLY_CORRECT"
    | "CORRECT"
    | "PRECISE";
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

export type DetailedAttemptReview = {
  points: Array<
    | { kind: "MATCHED"; conceptId: string; label: string }
    | { kind: "REVEALED"; conceptId: string; label: string }
    | { kind: "COMPLEMENT"; conceptId: string; label: string }
  >;
  blindspots: string[];
  corrections: string[];
};

export type StoredEvaluationV2 = {
  schemaVersion: 2;
  score: number;
  passed: boolean;
  essentialCoverage: number;
  evaluation: ModelEvaluation;
  provider: EvaluationProviderMetadata;
  publicFeedback: PublicAttemptFeedback;
  detailedReview?: DetailedAttemptReview;
};

export type EvaluationProviderMetadata = {
  mechanism: "OPENROUTER" | "DETERMINISTIC_MOCK";
  model: string;
  promptVersion: string;
  rubricVersion: string;
  requestId?: string;
  latencyMs: number;
};

export type EvaluationFailureReason =
  | "MISSING_RUBRIC"
  | "MISSING_CONFIGURATION"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "AUTHENTICATION"
  | "INSUFFICIENT_CREDITS"
  | "MODEL_UNAVAILABLE"
  | "INVALID_PROVIDER_RESPONSE"
  | "INVALID_EVALUATION"
  | "UNKNOWN_PROVIDER_ERROR";

export type EvaluatorResult =
  | {
      ok: true;
      evaluation: ModelEvaluation;
      metadata: EvaluationProviderMetadata;
    }
  | {
      ok: false;
      reason: EvaluationFailureReason;
      retryable: boolean;
      metadata?: Partial<EvaluationProviderMetadata>;
    };

export interface AnswerEvaluator {
  evaluate(input: EvaluationInput): Promise<EvaluatorResult>;
}
