import { createContext } from "react";

export type Session = {
  user: {
    id: string;
    name: string;
    email: string;
  };
} | null;

export const SessionContext = createContext<Session>(null);
