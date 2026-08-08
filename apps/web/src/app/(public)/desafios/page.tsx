import { serializeChallengeSummary } from "@/server/api/serializers";
import { getCurrentUser, listChallenges } from "@/server/api/service";
import ChallengesPageClient from "./challenges-page-client";
import { CHALLENGES_INITIAL_LOAD_SIZE, DEFAULT_USER_ELO } from "./constants";
import { type Challenge } from "./ema-challenge-card-helpers";
import type { StatusFilter } from "./challenges-list-state";

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initialStatus: StatusFilter =
    status === "in_progress" ||
    status === "resolved" ||
    status === "not_started"
      ? status
      : "ALL";
  const [response, userResponse] = await Promise.all([
    listChallenges({
      limit: CHALLENGES_INITIAL_LOAD_SIZE,
      offset: 0,
    }),
    getCurrentUser(),
  ]);
  const user =
    userResponse.success && userResponse.data
      ? { name: userResponse.data.name, image: userResponse.data.image }
      : { name: "Kodan", image: null };

  return (
    <ChallengesPageClient
      user={user}
      initialData={
        response.success && response.data
          ? {
              challenges: response.data.items.map(
                serializeChallengeSummary,
              ) as Challenge[],
              hasMore: response.data.hasMore,
              totalCount: response.data.total,
              userElo: response.data.userElo,
              initialError: null,
              initialStatus,
            }
          : {
              challenges: [],
              hasMore: false,
              totalCount: 0,
              userElo: DEFAULT_USER_ELO,
              initialError:
                response.error ||
                "Não foi possível carregar os desafios agora.",
              initialStatus,
            }
      }
    />
  );
}
