import { headers } from "next/headers";

import { auth } from "@kodan/auth";
import { ActiveDayBeacon } from "@/components/product-event-beacon";
import { SessionProvider } from "@/providers/session-provider";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <SessionProvider session={session}>
      <ActiveDayBeacon />
      {children}
    </SessionProvider>
  );
}
