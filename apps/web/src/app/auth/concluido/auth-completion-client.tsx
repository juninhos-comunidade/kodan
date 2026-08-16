"use client";

import { useEffect } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { recordAuthCompleted } from "@/app/actions";
import type { ProductEventInput } from "@/server/training/product-event-store";

export function AuthCompletionClient({
  callbackURL,
  event,
}: {
  callbackURL: Route;
  event: Extract<ProductEventInput, { name: "auth_completed" }>;
}) {
  const router = useRouter();

  useEffect(() => {
    void recordAuthCompleted(event.provider, event.journey, event.source)
      .catch(() => {
        // A autenticação concluída não depende da telemetria agregada.
      })
      .finally(() => router.replace(callbackURL));
  }, [callbackURL, event, router]);

  return (
    <main className="grid min-h-svh place-items-center bg-[#11110f] px-6 text-[#f5f2eb]">
      <div role="status" className="text-center font-mono">
        <LoaderCircle className="mx-auto size-6 animate-spin motion-reduce:animate-none" />
        <p className="mt-4 text-sm">Autenticação concluída. Abrindo o dojo…</p>
      </div>
    </main>
  );
}
