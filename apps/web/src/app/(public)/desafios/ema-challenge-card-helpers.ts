export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ChallengeStatus = "resolved" | "in_progress" | "not_started";
export type ChallengeKind =
  | "CONCEITO"
  | "HOOKS"
  | "CLEANUP"
  | "LÓGICA"
  | "AVANÇADO";

export interface Attempt {
  id: string;
  score: number;
  sessionStatus?: "RETRY_AVAILABLE" | "SOLVED" | "ELO_EXHAUSTED" | "REVEALED";
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  recommendedElo: number;
  tags: string;
  attempts: Attempt[];
}

type DifficultyPresentation = {
  className: string;
  label: Difficulty;
  navigationLabel: string;
};

type ChallengeStatusPresentation = {
  badgeClassName: string;
  dotClassName: string;
  label: string;
  note: string;
  status: ChallengeStatus;
};

type ChallengeProgressPresentation = {
  barClassName: string;
  label: string;
  percent: number;
  status: ChallengeStatus;
};

const DIFFICULTY_PRESENTATION: Record<Difficulty, DifficultyPresentation> = {
  EASY: {
    label: "EASY",
    navigationLabel: "Easy",
    className: "challengers-badge challengers-difficulty-easy",
  },
  MEDIUM: {
    label: "MEDIUM",
    navigationLabel: "Medium",
    className: "challengers-badge challengers-difficulty-medium",
  },
  HARD: {
    label: "HARD",
    navigationLabel: "Hard",
    className: "challengers-badge challengers-difficulty-hard",
  },
};

const TYPE_RULES: ReadonlyArray<{
  kind: ChallengeKind;
  tokens: readonly string[];
}> = [
  {
    kind: "CLEANUP",
    tokens: ["cleanup", "clean-up", "unmount", "event-listener", "websocket"],
  },
  {
    kind: "HOOKS",
    tokens: ["hooks", "react-hooks", "useeffect", "usememo", "callback"],
  },
  {
    kind: "LÓGICA",
    tokens: ["conditional", "condition", "state", "rendering", "memoization"],
  },
  {
    kind: "AVANÇADO",
    tokens: ["advanced", "architecture", "senior", "multi-bug", "race"],
  },
  {
    kind: "CONCEITO",
    tokens: ["concept", "conceito", "dependency", "closure", "effect"],
  },
];

export function isDifficulty(input: string): input is Difficulty {
  return input === "EASY" || input === "MEDIUM" || input === "HARD";
}

export function getDifficultyPresentation(diff: string): DifficultyPresentation {
  if (isDifficulty(diff)) {
    return DIFFICULTY_PRESENTATION[diff];
  }

  return {
    label: "MEDIUM",
    navigationLabel: "Medium",
    className: "challengers-badge challengers-difficulty-medium",
  };
}

export function getDifficultyColor(diff: string) {
  return getDifficultyPresentation(diff).className;
}

export function getDifficultyLabel(diff: string) {
  return getDifficultyPresentation(diff).label;
}

export function getDifficultyNavigationLabel(diff: string) {
  return getDifficultyPresentation(diff).navigationLabel;
}

export function getStatusFromAttempts(attempts: Attempt[]): ChallengeStatus {
  if (attempts.length === 0) {
    return "not_started";
  }

  return attempts.some(
    (attempt) =>
      attempt.sessionStatus === "SOLVED" ||
      attempt.score >= PASSING_ATTEMPT_SCORE,
  )
    ? "resolved"
    : "in_progress";
}

export function getStatusPresentation(
  attempts: Attempt[],
): ChallengeStatusPresentation {
  const status = getStatusFromAttempts(attempts);

  if (status === "resolved") {
    return {
      status,
      label: "Resolvido",
      note: "Última leitura fechou o diagnóstico.",
      badgeClassName: "challengers-badge challengers-status-resolved",
      dotClassName: "challengers-status-resolved",
    };
  }

  if (status === "in_progress") {
    return {
      status,
      label: "Em progresso",
      note: "Há uma tentativa que ainda pede ajuste.",
      badgeClassName: "challengers-badge challengers-status-in-progress",
      dotClassName: "challengers-status-in-progress",
    };
  }

  return {
    status,
    label: "Não iniciado",
    note: "Sem tentativas registradas.",
    badgeClassName: "challengers-badge challengers-status-not-started",
    dotClassName: "challengers-status-not-started",
  };
}

export function getChallengeTags(tags: string) {
  return tags.split(",").flatMap((tag) => {
    const normalizedTag = tag.trim();
    return normalizedTag ? [normalizedTag] : [];
  });
}

export function getChallengeKind(challenge: Pick<Challenge, "tags" | "title">) {
  const tokens = [
    ...getChallengeTags(challenge.tags),
    ...challenge.title.split(/\s+/),
  ].map((token) => token.trim().toLocaleLowerCase());

  for (const rule of TYPE_RULES) {
    if (tokens.some((token) => rule.tokens.includes(token))) {
      return rule.kind;
    }
  }

  return "CONCEITO";
}

export function getChallengeDescription(
  challenge: Pick<Challenge, "title" | "tags">,
) {
  const kind = getChallengeKind(challenge);

  if (kind === "HOOKS") {
    return "Aprenda a controlar quando o efeito deve reexecutar.";
  }

  if (kind === "CLEANUP") {
    return "Use funções de limpeza para evitar vazamentos de memória.";
  }

  if (kind === "LÓGICA") {
    return "Execute efeitos apenas quando condições específicas forem atendidas.";
  }

  if (kind === "AVANÇADO") {
    return "Entenda a diferença entre padrões próximos e quando usar cada um.";
  }

  return "Entenda como o conceito funciona e quando ele é executado.";
}

export function getChallengeProgress(
  attempts: Attempt[],
): ChallengeProgressPresentation {
  const status = getStatusFromAttempts(attempts);

  if (status === "not_started") {
    return {
      status,
      label: "Não iniciado",
      percent: 0,
      barClassName: "challengers-progress-not-started",
    };
  }

  if (status === "resolved") {
    return {
      status,
      label: "Resolvido",
      percent: 100,
      barClassName: "challengers-progress-resolved",
    };
  }

  const lastAttempt = attempts[0];

  return {
    status,
    label: "Em progresso",
    percent: lastAttempt ? Math.max(10, Math.min(lastAttempt.score * 20, 90)) : 0,
    barClassName: "challengers-progress-in-progress",
  };
}

function getLevelCompatibility(recommendedElo: number, userElo: number) {
  const delta = recommendedElo - userElo;
  if (delta <= 150) {
    return {
      label: "Compatível",
      className: "challengers-badge challengers-status-resolved",
    };
  }

  if (delta > 200) {
    return {
      label: "Avançado",
      className: "challengers-badge challengers-status-in-progress",
    };
  }

  return null;
}
import { PASSING_ATTEMPT_SCORE } from "@/lib/attempt-session-rules";
