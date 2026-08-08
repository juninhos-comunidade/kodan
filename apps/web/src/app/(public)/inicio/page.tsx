import type { Metadata } from "next";

import { selectFeaturedChallenge } from "@/lib/featured-challenge";
import {
  getCurrentUser,
  listChallenges,
} from "@/server/api/service";
import DashboardHome from "./dashboard-home";

export const metadata: Metadata = {
  title: "Dojo | Kodan",
  description: "Visão geral da sua evolução e do próximo desafio no Kodan.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [challengesResult, userResult] = await Promise.all([
    listChallenges({ limit: 50, offset: 0 }),
    getCurrentUser(),
  ]);
  const challenges = challengesResult.success && challengesResult.data
    ? challengesResult.data.items
    : [];
  const selection = selectFeaturedChallenge({
    challenges: challenges.map((challenge) => ({
      ...challenge,
      uniquePractitionerCount: challenge.uniquePractitionerCount ?? 0,
      attempts: challenge.attempts ?? [],
    })),
    ...(userResult.success && userResult.data
      ? { userElo: userResult.data.elo }
      : {}),
    now: new Date(),
  });
  const featuredChallenge = selection.challenge;

  console.log("Challenges:", challenges);
console.log("Quantidade:", challenges.length);
console.log("challengesResult", challengesResult);

  if (!featuredChallenge) {
    throw new Error("Nenhum desafio jogável disponível.");
  }

  const user = userResult.success && userResult.data
    ? userResult.data
    : { name: "Kodan", image: null, elo: 1200 };
  return (
    <DashboardHome
      challenge={{
        id: featuredChallenge.id,
        title: featuredChallenge.title,
        difficulty: featuredChallenge.difficulty,
        tags: featuredChallenge.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        code: featuredChallenge.code,
        question: featuredChallenge.question,
      }}
      challengeCount={challengesResult.success && challengesResult.data
        ? challengesResult.data.total
        : challenges.length}
      recommendationReason={selection.reason}
      userName={user.name}
      userImage={user.image}
    />
  );
}
