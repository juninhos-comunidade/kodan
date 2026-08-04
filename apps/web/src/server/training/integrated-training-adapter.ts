import "server-only";

import { headers } from "next/headers";

import {
  MAX_EVALUATED_ATTEMPTS,
  revealAttemptSolution as buildRevealedAttempt,
  type AttemptSessionStatus,
} from "./attempt-execution";
import { loadPractitionerCountsForChallenges } from "./challenge-practitioner-counts";
import { createOpenRouterEvaluator } from "./evaluation/openrouter-evaluator";
import { logEvaluationEvent } from "./evaluation/evaluation-telemetry";
import { resolveFreeOpenRouterModel } from "./evaluation/model-policy";
import {
  parseStoredPublicFeedback,
  revealStoredFeedback,
} from "./evaluation/stored-feedback";
import {
  submitIntegratedAttempt,
  withSerializableRetry,
} from "./integrated-attempt-submission";
import type { TrainingAdapter } from "./training-adapter";

async function getPrisma() {
  const { default: prisma } = await import("@kodan/db");
  return prisma;
}

async function getConfiguredEvaluator() {
  const { env } = await import("@kodan/env/server");
  return createOpenRouterEvaluator({
    apiKey: env.EVALUATION_V2_ENABLED ? env.OPENROUTER_API_KEY : undefined,
    model: resolveFreeOpenRouterModel(env.OPENROUTER_MODEL),
    telemetry: logEvaluationEvent,
    fetchImplementation: fetch,
  });
}

export const integratedTrainingAdapter: TrainingAdapter = {
  async getOptionalUser() {
    const [{ auth }, prisma, requestHeaders] = await Promise.all([
      import("@kodan/auth"),
      getPrisma(),
      headers(),
    ]);
    const session = await auth.api.getSession({ headers: requestHeaders });
    return session?.user
      ? prisma.user.findUnique({ where: { id: session.user.id } })
      : null;
  },
  async getUserById(userId) {
    const prisma = await getPrisma();
    return prisma.user.findUnique({ where: { id: userId } });
  },
  async updateUser(userId, input) {
    const prisma = await getPrisma();
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
      },
    });
  },
  async listChallenges({ limit, offset, userId }) {
    const prisma = await getPrisma();
    const [user, total, items] = await Promise.all([
      userId ? prisma.user.findUnique({ where: { id: userId } }) : null,
      prisma.challenge.count(),
      prisma.challenge.findMany({
        include: userId
          ? {
              attempts: {
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: MAX_EVALUATED_ATTEMPTS,
              },
            }
          : undefined,
        orderBy: { recommendedElo: "asc" },
        take: limit,
        skip: offset,
      }),
    ]);
    const uniquePractitionersByChallenge =
      await loadPractitionerCountsForChallenges(
        prisma.attempt,
        items.map((challenge) => challenge.id),
      );
    return {
      items: items.map((challenge) => ({
        ...challenge,
        uniquePractitionerCount:
          uniquePractitionersByChallenge.get(challenge.id) ?? 0,
      })),
      total,
      userElo: user?.elo ?? 1200,
    };
  },
  async getChallengeById(id, userId) {
    const prisma = await getPrisma();
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: userId
        ? { attempts: { where: { userId }, orderBy: { createdAt: "desc" } } }
        : undefined,
    });
    if (!challenge) return null;
    const practitionerPairs = await prisma.attempt.findMany({
      where: { challengeId: id },
      select: { userId: true },
      distinct: ["userId"],
    });
    return {
      ...challenge,
      uniquePractitionerCount: practitionerPairs.length,
    };
  },
  async submitAttempt(userId, challengeId, input) {
    const prisma = await getPrisma();
    return submitIntegratedAttempt(
      prisma,
      await getConfiguredEvaluator(),
      userId,
      challengeId,
      input,
      { telemetry: logEvaluationEvent },
    );
  },
  async revealAttemptSolution(userId, challengeId) {
    const prisma = await getPrisma();
    return withSerializableRetry(() =>
      prisma.$transaction(async (tx) => {
        const [user, challenge, latestAttempt] = await Promise.all([
          tx.user.findUnique({ where: { id: userId }, select: { elo: true } }),
          tx.challenge.findUnique({ where: { id: challengeId }, select: { solution: true } }),
          tx.attempt.findFirst({
            where: { userId, challengeId },
            orderBy: { createdAt: "desc" },
          }),
        ]);
        if (!user) throw new Error("Usuário padrão local não encontrado");
        if (!challenge) throw new Error("Desafio não encontrado");
        if (
          !latestAttempt ||
          latestAttempt.sessionStatus === "REVEALED"
        ) {
          throw new Error("Tentativa encerrada");
        }

        const publicFeedback = parseStoredPublicFeedback(latestAttempt.feedbackJson);
        if (!publicFeedback) throw new Error("Feedback persistido inválido");
        const revealed = buildRevealedAttempt({
          currentElo: user.elo,
          attemptNumber: latestAttempt.attemptNumber,
          solution: challenge.solution,
          feedback: publicFeedback,
        });
        await tx.attempt.update({
          where: { id: latestAttempt.id },
          data: {
            feedbackJson: revealStoredFeedback(
              latestAttempt.feedbackJson,
              challenge.solution,
            ),
            sessionStatus: revealed.status,
          },
        });
        return revealed;
      }, { isolationLevel: "Serializable" })
    );
  },
  async listAttempts(userId) {
    const prisma = await getPrisma();
    const attempts = await prisma.attempt.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { createdAt: "desc" },
    });
    return attempts.map((attempt) => ({
      ...attempt,
      sessionStatus: attempt.sessionStatus as AttemptSessionStatus,
    }));
  },
  async listRecommendations(_userId, attemptedChallengeIds, limit) {
    const prisma = await getPrisma();
    return prisma.challenge.findMany({
      where: attemptedChallengeIds.length > 0 ? { id: { notIn: attemptedChallengeIds } } : undefined,
      orderBy: [{ recommendedElo: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
  },
};
