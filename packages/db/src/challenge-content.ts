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
  options: { root?: string; pruneDuplicateOrphans?: boolean } = {},
) {
  const challenges = await readChallengesFromContent(options);
  const existing = await prisma.challenge.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { attempts: true } },
    },
  });
  const existingIds = new Set(existing.map((item) => item.id));
  const contentIds = new Set(challenges.map((challenge) => challenge.id));
  const contentTitles = new Set(challenges.map((challenge) => challenge.title));
  const orphaned = existing
    .filter((item) => !contentIds.has(item.id))
    .map((item) => ({
      id: item.id,
      title: item.title,
      attemptCount: item._count.attempts,
    }));
  const duplicateOrphans = orphaned.filter(
    (item) => item.attemptCount === 0 && contentTitles.has(item.title),
  );
  const protectedOrphans = orphaned.filter(
    (item) => !duplicateOrphans.some((duplicate) => duplicate.id === item.id),
  );

  await Promise.all(
    challenges.map((challenge) => upsertChallenge(prisma, challenge)),
  );
  const pruned = options.pruneDuplicateOrphans && duplicateOrphans.length > 0
    ? (await prisma.challenge.deleteMany({
        where: {
          OR: duplicateOrphans.map((item) => ({
            id: item.id,
            title: item.title,
            attempts: { none: {} },
          })),
        },
      })).count
    : 0;
  const remainingOrphans = options.pruneDuplicateOrphans
    ? protectedOrphans
    : orphaned;
  const demoted = remainingOrphans.length > 0
    ? (await prisma.challenge.updateMany({
        where: { id: { in: remainingOrphans.map((item) => item.id) } },
        data: { promoted: false },
      })).count
    : 0;
  const updated = challenges.filter((challenge) => existingIds.has(challenge.id)).length;
  const inserted = challenges.length - updated;

  return {
    total: challenges.length,
    inserted,
    updated,
    pruned,
    demoted,
    protectedOrphans,
  };
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
    promoted: true,
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
