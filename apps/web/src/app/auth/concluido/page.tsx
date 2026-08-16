import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSafeCallbackPath, parseAuthCompletionParams } from "@/lib/auth-navigation";
import { getRuntimeSession } from "@/lib/runtime-data";
import { recordAnonymousProductEvent } from "@/server/api/service";

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
  const safeCallbackURL = getSafeCallbackPath(parsed.callbackURL, "/inicio");

  const session = await getRuntimeSession(await headers());
  if (!session?.user) redirect("/inicio");

  await recordAnonymousProductEvent(parsed.event);
  redirect(safeCallbackURL);
}

function readParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
