import type { PrismaClient } from "../prisma/generated/client";
import {
  readChallengesFromContent,
  type ChallengeContentEntry,
} from "@kodan/content/promoted-challenge-catalog";

export type { ChallengeContentEntry } from "@kodan/content/promoted-challenge-catalog";
export {
  readChallengesFromContent,
  readPromotedChallengeCatalog,
  syncChallengesIndexFromContent,
} from "@kodan/content/promoted-challenge-catalog";

export async function upsertChallengesFromContent(
  prisma: PrismaClient,
  options: { root?: string } = {},
) {
  const challenges = await readChallengesFromContent(options);
  const existing = await prisma.challenge.findMany({
    where: { id: { in: challenges.map((challenge) => challenge.id) } },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((item) => item.id));
  await Promise.all(
    challenges.map((challenge) => upsertChallenge(prisma, challenge)),
  );
  const updated = challenges.filter((challenge) => existingIds.has(challenge.id)).length;
  const inserted = challenges.length - updated;

  return { total: challenges.length, inserted, updated };
}

async function upsertChallenge(prisma: PrismaClient, challenge: ChallengeContentEntry) {
  const payload = {
    title: challenge.title,
    language: challenge.language,
    difficulty: challenge.difficulty,
    recommendedElo: challenge.recommendedElo,
    code: challenge.code,
    question: challenge.question,
    solution: challenge.solution,
    tags: challenge.tags.join(","),
    evaluationRubricJson: challenge.evaluationRubric
      ? JSON.stringify(challenge.evaluationRubric)
      : null,
  };
  await prisma.challenge.upsert({
    where: { id: challenge.id },
    update: payload,
    create: { id: challenge.id, ...payload },
  });
}
