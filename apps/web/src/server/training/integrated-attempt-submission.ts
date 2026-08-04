import {
  evaluateAttempt,
  MAX_EVALUATED_ATTEMPTS,
} from "./attempt-execution";
import { EvaluationUnavailableError } from "./evaluation/errors";
import type { EvaluationTelemetry } from "./evaluation/evaluation-telemetry";
import { evaluateAnswer } from "./evaluation/evaluation-service";
import { parseChallengeEvaluationRubric } from "./evaluation/schemas";
import { serializeStoredEvaluation } from "./evaluation/stored-feedback";
import type { AnswerEvaluator } from "./evaluation/types";

type IntegratedPrisma = typeof import("@kodan/db").default;

export async function submitIntegratedAttempt(
  prisma: IntegratedPrisma,
  evaluator: AnswerEvaluator,
  userId: string,
  challengeId: string,
  input: { userAnswer: string; usedHint?: boolean },
  options: { telemetry?: EvaluationTelemetry } = {},
) {
  const [challenge, preflightUser, preflightAttempts] = await Promise.all([
    prisma.challenge.findUnique({ where: { id: challengeId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.attempt.findMany({
      where: { userId, challengeId },
      orderBy: { createdAt: "desc" },
      select: { score: true, eloChange: true, sessionStatus: true },
    }),
  ]);
  if (!challenge) throw new Error("Desafio não encontrado");
  if (!preflightUser) throw new Error("Usuário padrão local não encontrado");
  assertAttemptCanBeSubmitted(preflightAttempts);
  const attemptNumber = preflightAttempts.length + 1;
  options.telemetry?.({
    name: "attempt_evaluation_started",
    challengeId,
    attemptNumber,
  });

  const rubric = parseChallengeEvaluationRubric(challenge.evaluationRubricJson);
  if (!rubric) {
    emitEvaluationFailure(options.telemetry, {
      challengeId,
      attemptNumber,
      failureReason: "MISSING_RUBRIC",
      retryable: false,
    });
    throw new EvaluationUnavailableError("MISSING_RUBRIC", false);
  }
  const evaluatedAnswer = await evaluateAnswer(evaluator, {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      question: challenge.question,
      code: challenge.code,
    },
    userAnswer: input.userAnswer,
    attemptNumber,
    rubric,
  });
  if (!evaluatedAnswer.ok) {
    emitEvaluationFailure(options.telemetry, {
      challengeId,
      attemptNumber,
      failureReason: evaluatedAnswer.reason,
      retryable: evaluatedAnswer.retryable,
    });
    throw new EvaluationUnavailableError(
      evaluatedAnswer.reason,
      evaluatedAnswer.retryable,
    );
  }

  const evaluation = await withSerializableRetry(() =>
    prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, elo: true },
      });
      if (!freshUser) throw new Error("Usuário padrão local não encontrado");

      const previousAttempts = await tx.attempt.findMany({
        where: { userId, challengeId },
        orderBy: { createdAt: "desc" },
        select: { score: true, eloChange: true, sessionStatus: true },
      });
      assertAttemptCanBeSubmitted(previousAttempts);

      const evaluation = evaluateAttempt({
        currentElo: freshUser.elo,
        previousAttempts: previousAttempts.map((attempt) => ({
          ...attempt,
          sessionStatus: attempt.sessionStatus as
            | "RETRY_AVAILABLE"
            | "SOLVED"
            | "ELO_EXHAUSTED"
            | "REVEALED",
        })),
        usedHint: Boolean(input.usedHint),
        solution: challenge.solution,
        feedback: evaluatedAnswer.publicFeedback,
      });
      const storedEvaluation = {
        ...evaluatedAnswer.storedEvaluation,
        publicFeedback: evaluation.feedback,
      };

      if (evaluation.eloChange !== 0) {
        await tx.user.update({
          where: { id: userId },
          data: { elo: evaluation.newElo },
        });
      }
      await tx.attempt.create({
        data: {
          userId,
          challengeId,
          userAnswer: input.userAnswer,
          feedbackJson: serializeStoredEvaluation(storedEvaluation),
          score: evaluation.score,
          eloChange: evaluation.eloChange,
          attemptNumber: evaluation.attemptNumber,
          sessionStatus: evaluation.status,
        },
      });
      return evaluation;
    }, { isolationLevel: "Serializable" }),
  );
  const assessmentByConceptId = new Map(
    evaluatedAnswer.evaluation.conceptAssessments.map((assessment) => [
      assessment.conceptId,
      assessment.state,
    ]),
  );
  options.telemetry?.({
    name: "attempt_evaluation_succeeded",
    challengeId,
    attemptNumber: evaluation.attemptNumber,
    model: evaluatedAnswer.metadata.model,
    promptVersion: evaluatedAnswer.metadata.promptVersion,
    rubricVersion: evaluatedAnswer.metadata.rubricVersion,
    latencyMs: evaluatedAnswer.metadata.latencyMs,
    scoreRange: formatScoreRange(evaluation.score),
    status: evaluation.status,
    matchedConceptCount: evaluatedAnswer.evaluation.conceptAssessments.filter(
      (assessment) => assessment.state === "MATCHED",
    ).length,
    missingCriticalCount: rubric.concepts.filter(
      (concept) =>
        concept.importance === "critical" &&
        assessmentByConceptId.get(concept.id) !== "MATCHED",
    ).length,
    misconceptionCount: evaluatedAnswer.evaluation.misconceptionIds.length,
  });
  options.telemetry?.({
    name: "attempt_evaluation_completed",
    challengeId,
    attemptNumber: evaluation.attemptNumber,
    status: evaluation.status,
  });
  return evaluation;
}

function emitEvaluationFailure(
  telemetry: EvaluationTelemetry | undefined,
  event: {
    challengeId: string;
    attemptNumber: number;
    failureReason: string;
    retryable: boolean;
  },
) {
  telemetry?.({ name: "attempt_evaluation_failed", ...event });
  telemetry?.({
    name: "attempt_evaluation_completed",
    challengeId: event.challengeId,
    attemptNumber: event.attemptNumber,
    failureReason: event.failureReason,
  });
}

function formatScoreRange(score: number) {
  if (score === 10) return "10";
  const lower = Math.floor(score);
  return `${lower}-${lower}.9`;
}

export async function withSerializableRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!isSerializableConflict(error)) throw error;
    return operation();
  }
}

function isSerializableConflict(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2034",
  );
}

function assertAttemptCanBeSubmitted(
  previousAttempts: Array<{ sessionStatus: string; score?: number }>,
) {
  if (previousAttempts.length >= MAX_EVALUATED_ATTEMPTS) {
    throw new Error("Limite de tentativas atingido");
  }
  if (
    previousAttempts.some(
      (attempt) =>
        attempt.sessionStatus === "SOLVED" && attempt.score === 10,
    )
  ) {
    throw new Error("Tentativa encerrada");
  }
  const latestStatus = previousAttempts[0]?.sessionStatus;
  if (
    latestStatus &&
    latestStatus !== "RETRY_AVAILABLE" &&
    latestStatus !== "SOLVED"
  ) {
    throw new Error("Tentativa encerrada");
  }
}
