import { describe, expect, test } from "bun:test";

import { buildSocialProviders } from "./social-providers";

describe("buildSocialProviders", () => {
  test("omite provedores sem o par completo de credenciais", () => {
    expect(buildSocialProviders({
      githubClientId: "github-id",
      githubClientSecret: undefined,
      googleClientId: undefined,
      googleClientSecret: undefined,
    })).toEqual({});
  });

  test("habilita apenas o provedor configurado", () => {
    expect(buildSocialProviders({
      githubClientId: "github-id",
      githubClientSecret: "github-secret",
      googleClientId: undefined,
      googleClientSecret: undefined,
    })).toEqual({
      github: { clientId: "github-id", clientSecret: "github-secret" },
    });
  });
});
