"use client";

import { useContext } from "react";
import { SessionContext } from "@/providers/session-context";

export function useSession() {
  return useContext(SessionContext);
}
