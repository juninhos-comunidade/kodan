"use client";

import { DashboardHomeHeader } from "./dashboard-home/dashboard-home-header";
import { DashboardNavigation } from "./dashboard-home/dashboard-navigation";
import { DojoInitiationCard } from "./dashboard-home/dojo-initiation-card";
import { RecommendedChallengeCard } from "./dashboard-home/recommended-challenge-card";
import { useDashboardThemeAssets } from "./dashboard-home/use-dashboard-theme-assets";

type DashboardHomeProps = {
  challenge: DashboardChallenge;
  challengeCount: number;
  recommendationReason: "CONTINUE_RECENT" | "PERSONALIZED" | "POPULAR_BEGINNER" | "FALLBACK";
  userName: string;
  userImage: string | null;
};

export type DashboardChallenge = {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  code: string;
  question: string;
};

export default function DashboardHome({ challenge, challengeCount, recommendationReason, userName, userImage }: DashboardHomeProps) {
  const themeAssets = useDashboardThemeAssets();

  return (
    <div data-dashboard-home="true" className="min-h-full bg-[var(--dojo-page)] font-mono text-[var(--dojo-ink)]">
      <DashboardHomeHeader
        userName={userName}
        userImage={userImage}
      />
      <div className="grid gap-5 p-5 sm:p-8 2xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.75fr)]">
        <section className="space-y-5">
          <RecommendedChallengeCard
            challenge={challenge}
            recommendationReason={recommendationReason}
          />
          <DojoInitiationCard icon={themeAssets.initiation} />
        </section>
        <DashboardNavigation challengeCount={challengeCount} icons={themeAssets} />
      </div>
    </div>
  );
}
