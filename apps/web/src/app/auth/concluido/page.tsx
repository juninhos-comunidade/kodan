import { redirect } from "next/navigation";

import { parseAuthCompletionParams } from "@/lib/auth-navigation";
import { AuthCompletionClient } from "./auth-completion-client";

export default async function AuthCompletedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = parseAuthCompletionParams({
    callbackURL: readParam(params.callbackURL),
    provider: readParam(params.provider),
    journey: readParam(params.journey),
    source: readParam(params.source),
  });
  if (!parsed) redirect("/inicio");

  return (
    <AuthCompletionClient
      callbackURL={parsed.callbackURL}
      event={parsed.event}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
