import type { Route } from "next";

export type AuthMode = "login" | "register";
export type AuthEventSource = "LANDING" | "CHALLENGE" | "DIRECT";

export function getSafeCallbackPath(
  callbackURL: string | null | undefined,
  fallback: Route,
): Route {
  if (!callbackURL?.startsWith("/") || callbackURL.startsWith("//")) {
    return fallback;
  }

  return callbackURL as Route;
}

export function getLoginHref(
  callbackURL: string,
  mode: AuthMode = "login",
  source?: "landing",
): Route {
  const searchParams = new URLSearchParams({ mode, callbackURL });
  if (source) searchParams.set("source", source);
  return `/login?${searchParams.toString()}` as Route;
}

export function getRegisterHref(
  callbackURL: string,
  source?: "landing",
): Route {
  const searchParams = new URLSearchParams({ callbackURL });
  if (source) searchParams.set("source", source);
  return `/cadastro?${searchParams.toString()}` as Route;
}

export function getAuthEventSource(
  source: string | null | undefined,
  callbackURL: string,
): AuthEventSource {
  if (source === "landing") return "LANDING";
  if (callbackURL === "/treinar" || callbackURL.startsWith("/treinar/")) {
    return "CHALLENGE";
  }
  return "DIRECT";
}

export function getAuthCompletionHref({
  callbackURL,
  provider,
  journey,
  source,
}: {
  callbackURL: string;
  provider: "github" | "google";
  journey: "login" | "signup";
  source: "landing" | "challenge" | "direct";
}): Route {
  const safeCallbackURL = getSafeCallbackPath(callbackURL, "/inicio");
  const searchParams = new URLSearchParams({
    callbackURL: safeCallbackURL,
    provider: provider.toUpperCase(),
    journey: journey.toUpperCase(),
    source: source.toUpperCase(),
  });
  return `/auth/concluido?${searchParams.toString()}` as Route;
}

export function parseAuthCompletionParams(input: {
  callbackURL?: string;
  provider?: string;
  journey?: string;
  source?: string;
}): {
  callbackURL: Route;
  event: {
    name: "auth_completed";
    provider: "GITHUB" | "GOOGLE";
    journey: "LOGIN" | "SIGNUP";
    source: AuthEventSource;
  };
} | null {
  if (
    input.provider !== "GITHUB" && input.provider !== "GOOGLE" ||
    input.journey !== "LOGIN" && input.journey !== "SIGNUP" ||
    input.source !== "LANDING" &&
      input.source !== "CHALLENGE" &&
      input.source !== "DIRECT"
  ) {
    return null;
  }

  return {
    callbackURL: getSafeCallbackPath(input.callbackURL, "/inicio"),
    event: {
      name: "auth_completed" as const,
      provider: input.provider,
      journey: input.journey,
      source: input.source,
    },
  };
}

export function getPostSignupPath(
  state: { emailVerified: boolean; sessionCreated: boolean },
  callbackURL: string,
): Route {
  return state.emailVerified || state.sessionCreated
    ? callbackURL as Route
    : "/verificar-email";
}

export function requiresEmailVerification(status: number) {
  return status === 403;
}
