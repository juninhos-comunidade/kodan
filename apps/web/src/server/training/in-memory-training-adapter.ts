import { mockTrainingStore } from "@/server/api/mock-store";
import type { TrainingAdapter } from "./training-adapter";

export function createInMemoryTrainingAdapter(
  store: typeof mockTrainingStore = mockTrainingStore,
): TrainingAdapter {
  return {
  async getOptionalUser() {
    return store.getCurrentUser();
  },
  async getUserById() {
    return store.getCurrentUser();
  },
  async updateUser(_userId, input) {
    return store.updateUser(input);
  },
  async listChallenges({ limit, offset }) {
    const result = store.listChallenges({ limit, offset });
    return {
      items: result.items.map((challenge) => ({
        ...challenge,
        uniquePractitionerCount: challenge.attempts?.length ? 1 : 0,
      })),
      total: result.total,
      userElo: store.getCurrentUser().elo,
    };
  },
  async getChallengeById(id) {
    const challenge = store.getChallengeById(id);
    return challenge
      ? {
          ...challenge,
          uniquePractitionerCount: challenge.attempts?.length ? 1 : 0,
        }
      : null;
  },
  async submitAttempt(_userId, challengeId, input) {
    return store.submitAttempt(challengeId, input);
  },
  async revealAttemptSolution(_userId, challengeId) {
    return store.revealSolution(challengeId);
  },
  async recordFeedbackViewed() { return false; },
  async recordProductEvent() { return false; },
  async listAttempts() {
    return store.listAttempts();
  },
  async listRecommendations(_userId, attemptedChallengeIds, limit) {
    const attempted = new Set(attemptedChallengeIds);
    return store
      .listChallenges({ limit: 50, offset: 0 })
      .items.filter((challenge) => !attempted.has(challenge.id))
      .slice(0, limit);
  },
  };
}

export const inMemoryTrainingAdapter = createInMemoryTrainingAdapter();
