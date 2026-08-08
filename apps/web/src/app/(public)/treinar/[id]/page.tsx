import { headers } from "next/headers";

import { isMockMode } from "@/lib/mock-mode";
import { selectFeaturedChallenge } from "@/lib/featured-challenge";
import { getRuntimeSession } from "@/lib/runtime-data";
import { serializeChallengeDetail } from "@/server/api/serializers";
import { getChallengeById, listChallenges } from "@/server/api/service";
import { restoreAttemptSession } from "./attempt-session-state";
import TrainArenaClient, { type Challenge } from "./train-arena-client";

export default async function TrainArenaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [challengeRes, session, challengesRes] = await Promise.all([
    getChallengeById(id),
    isMockMode() ? Promise.resolve(null) : getRuntimeSession(await headers()),
    listChallenges({ limit: 50, offset: 0 }),
  ]);

  const initialChallenge: Challenge | null =
    challengeRes.success && challengeRes.data
      ? (serializeChallengeDetail(challengeRes.data) as Challenge)
      : null;
  const restoredSession = restoreAttemptSession(
    challengeRes.success && challengeRes.data
      ? challengeRes.data.attempts?.[0]
      : undefined,
  );
  const nextSelection = challengesRes.success && challengesRes.data
    ? selectFeaturedChallenge({
        challenges: challengesRes.data.items.map((challenge) => ({
          ...challenge,
          evaluationAvailable: Boolean(challenge.evaluationRubricJson),
          uniquePractitionerCount: challenge.uniquePractitionerCount ?? 0,
          attempts: challenge.attempts ?? [],
        })),
        userElo: challengesRes.data.userElo,
        now: new Date(),
        excludeChallengeIds: [id],
      })
    : null;

  return (
    <TrainArenaClient
      id={id}
      initialChallenge={initialChallenge}
      isAuthenticated={isMockMode() || Boolean(session?.user)}
      initialSession={restoredSession.state}
      initialUserAnswer={restoredSession.userAnswer}
      nextChallenge={nextSelection?.challenge
        ? {
            id: nextSelection.challenge.id,
            title: nextSelection.challenge.title,
          }
        : null}
    />
  );
}
