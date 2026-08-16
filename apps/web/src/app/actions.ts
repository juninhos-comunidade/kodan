"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { isMockMode } from "@/lib/mock-mode";
import { getRuntimeSession } from "@/lib/runtime-data";
import type { SessionAgeBucket } from "@/server/training/training-adapter";
import {
  getCurrentUser,
  listCurrentUserAttempts,
  recordAnonymousProductEvent,
  recordChallengeFeedbackViewed,
  revealChallengeSolution,
  submitChallengeAttempt,
  updateCurrentUserProfile,
} from "@/server/api/service";

const authCompletedSchema = z.strictObject({
  provider: z.enum(["EMAIL", "GITHUB", "GOOGLE"]),
  journey: z.enum(["LOGIN", "SIGNUP"]),
  source: z.enum(["LANDING", "CHALLENGE", "DIRECT"]),
});

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

export async function recordAuthCompleted(
  provider: "EMAIL" | "GITHUB" | "GOOGLE",
  journey: "LOGIN" | "SIGNUP",
  source: "LANDING" | "CHALLENGE" | "DIRECT",
) {
  await requireAuth();
  const event = authCompletedSchema.parse({ provider, journey, source });
  return recordAnonymousProductEvent({ name: "auth_completed", ...event });
}

export async function getAttemptsHistory() {
  await requireAuth();
  return listCurrentUserAttempts();
}
