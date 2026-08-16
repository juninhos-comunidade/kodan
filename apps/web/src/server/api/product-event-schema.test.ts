import { describe, expect, test } from "bun:test";

import { productEventSchema } from "./schemas";

describe("productEventSchema", () => {
  test("aceita somente eventos públicos de baixa cardinalidade", () => {
    expect(productEventSchema.parse({
      name: "challenge_viewed",
      challengeId: "challenge-1",
    })).toEqual({ name: "challenge_viewed", challengeId: "challenge-1" });
    expect(productEventSchema.parse({
      name: "active_day",
      contextBucket: "D7_PLUS",
    })).toEqual({ name: "active_day", contextBucket: "D7_PLUS" });
    expect(productEventSchema.parse({
      name: "landing_cta_clicked",
      contextBucket: "START_DIAGNOSIS",
    })).toEqual({
      name: "landing_cta_clicked",
      contextBucket: "START_DIAGNOSIS",
    });
  });

  test("bloqueia saúde do avaliador e dimensões arbitrárias no endpoint público", () => {
    expect(productEventSchema.safeParse({
      name: "attempt_evaluation_failed",
      challengeId: "challenge-1",
      contextBucket: "TIMEOUT",
    }).success).toBe(false);
    expect(productEventSchema.safeParse({
      name: "home_viewed",
      email: "user@example.com",
    }).success).toBe(false);
    expect(productEventSchema.safeParse({
      name: "auth_completed",
      provider: "GITHUB",
      journey: "LOGIN",
      source: "LANDING",
    }).success).toBe(false);
  });
});
