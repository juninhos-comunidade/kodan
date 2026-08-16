import { beforeEach, describe, expect, mock, test } from "bun:test";

const serviceCalls = {
  getCurrentUser: mock(async () => ({ success: true })),
  listCurrentUserAttempts: mock(async () => ({ success: true })),
  recordAnonymousProductEvent: mock(async () => ({
    success: true,
    recorded: true,
  })),
  recordChallengeFeedbackViewed: mock(async () => ({ success: true })),
  revealChallengeSolution: mock(async () => ({ success: true })),
  submitChallengeAttempt: mock(async () => ({ success: true })),
  updateCurrentUserProfile: mock(async () => ({ success: true })),
};

mock.module("@/server/api/service", () => serviceCalls);

const getRuntimeSession = mock(async () => null);
mock.module("@/lib/runtime-data", () => ({ getRuntimeSession }));
mock.module("@/lib/mock-mode", () => ({
  isMockMode: () => false,
  isMockModeEnabled: () => false,
}));
let requestHeaders = new Headers();
mock.module("next/headers", () => ({ headers: async () => requestHeaders }));

const actionsModule = await import("./actions");
const {
  getAttemptsHistory,
  getLocalUser,
  recordAuthCompleted,
  recordFeedbackViewed,
  revealSolution,
  submitAttempt,
  updateLocalUserProfile,
} = actionsModule;

describe("dashboard server actions", () => {
  beforeEach(() => {
    requestHeaders = new Headers();
    getRuntimeSession.mockClear();
    Object.values(serviceCalls).forEach((serviceCall) => serviceCall.mockClear());
  });

  test("keeps profile data and submissions protected", async () => {
    const actions = [
      () => getLocalUser(),
      () => updateLocalUserProfile({ name: "Gabriel" }),
      () => submitAttempt("challenge-1", "Uma resposta suficientemente detalhada."),
      () => revealSolution("challenge-1"),
      () => recordFeedbackViewed("challenge-1", 1, "UNDER_10_MIN"),
      () => recordAuthCompleted("GITHUB", "LOGIN", "LANDING"),
      () => getAttemptsHistory(),
    ];

    for (const action of actions) {
      await expect(action()).rejects.toThrow("Unauthorized");
    }

    expect(getRuntimeSession).toHaveBeenCalledTimes(actions.length);
    expect(serviceCalls.getCurrentUser).not.toHaveBeenCalled();
    expect(serviceCalls.updateCurrentUserProfile).not.toHaveBeenCalled();
    expect(serviceCalls.submitChallengeAttempt).not.toHaveBeenCalled();
    expect(serviceCalls.revealChallengeSolution).not.toHaveBeenCalled();
    expect(serviceCalls.recordChallengeFeedbackViewed).not.toHaveBeenCalled();
    expect(serviceCalls.recordAnonymousProductEvent).not.toHaveBeenCalled();
    expect(serviceCalls.listCurrentUserAttempts).not.toHaveBeenCalled();
  });

  test("registra a conclusão da autenticação somente com sessão válida", async () => {
    getRuntimeSession.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);

    await expect(
      recordAuthCompleted("GOOGLE", "SIGNUP", "CHALLENGE"),
    ).resolves.toEqual({ success: true, recorded: true });

    expect(serviceCalls.recordAnonymousProductEvent).toHaveBeenCalledWith({
      name: "auth_completed",
      provider: "GOOGLE",
      journey: "SIGNUP",
      source: "CHALLENGE",
    });
  });

  test("does not treat the local Dojo gate as an authenticated session", async () => {
    requestHeaders.set("cookie", "dojo_gate_seen=1");

    await expect(
      submitAttempt("challenge-1", "Uma resposta suficientemente detalhada."),
    ).rejects.toThrow("Unauthorized");

    expect(serviceCalls.submitChallengeAttempt).not.toHaveBeenCalled();
  });

});
