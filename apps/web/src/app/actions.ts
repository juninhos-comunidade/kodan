"use server";

import { headers } from "next/headers";

import { isMockMode } from "@/lib/mock-mode";
import { getRuntimeSession } from "@/lib/runtime-data";
import type { SessionAgeBucket } from "@/server/training/training-adapter";
import {
  getCurrentUser,
  listCurrentUserAttempts,
  recordChallengeFeedbackViewed,
  revealChallengeSolution,
  submitChallengeAttempt,
  updateCurrentUserProfile,
} from "@/server/api/service";

async function requireAuth() {
  if (isMockMode()) return;

  const session = await getRuntimeSession(await headers());
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}

export async function getLocalUser() {
  await requireAuth();
  return getCurrentUser();
}

export async function updateLocalUserProfile(params: {
  name: string;
  bio?: string;
  image?: string | null;
}) {
  await requireAuth();
  return updateCurrentUserProfile(params);
}

export async function submitAttempt(challengeId: string, userAnswer: string, usedHint?: boolean) {
  await requireAuth();
  return submitChallengeAttempt(challengeId, {
    userAnswer,
    usedHint: Boolean(usedHint),
  });
}

export async function revealSolution(challengeId: string) {
  await requireAuth();
  return revealChallengeSolution(challengeId);
}

export async function recordFeedbackViewed(
  challengeId: string,
  attemptNumber: number,
  sessionAgeBucket: SessionAgeBucket,
) {
  await requireAuth();
  return recordChallengeFeedbackViewed(
    challengeId,
    attemptNumber,
    sessionAgeBucket,
  );
}

export async function getAttemptsHistory() {
  await requireAuth();
  return listCurrentUserAttempts();
}
