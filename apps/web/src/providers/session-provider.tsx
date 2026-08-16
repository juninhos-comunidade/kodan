"use client";

import type { ReactNode } from "react";
import { SessionContext, type Session } from "./session-context";

type SessionProviderProps = {
  children: ReactNode;
  session: Session;
};

export function SessionProvider({
  children,
  session,
}: SessionProviderProps) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
