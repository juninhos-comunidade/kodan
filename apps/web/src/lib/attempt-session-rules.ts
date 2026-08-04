export const MAX_EVALUATED_ATTEMPTS = 3;
export const PASSING_ATTEMPT_SCORE = 7;
export const ELO_POTENTIAL_BY_ATTEMPT = [100, 80, 30] as const;

export type AttemptSessionStatus =
  | "RETRY_AVAILABLE"
  | "SOLVED"
  | "ELO_EXHAUSTED"
  | "REVEALED";

export function getNextEloPotentialPercent(attemptNumber: number) {
  return ELO_POTENTIAL_BY_ATTEMPT[attemptNumber] ?? 0;
}
