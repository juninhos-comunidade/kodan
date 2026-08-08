import type {
  AchievementItem,
  EloPoint,
  ProfileDifficulty,
  ProfileSessionStatus,
  ProfileViewModel,
  RecommendedChallengeItem,
  TopicMasteryItem,
} from "./profile-types";
import { eloToDanRank, formatRankLabel } from "@/lib/rating";
import {
  CHALLENGE_TOPICS,
  getChallengeTopic,
  getChallengeTopicKey,
} from "@/lib/challenge-topics";
import { buildPractitionerProgress } from "@/lib/practitioner-progress";
import { PASSING_ATTEMPT_SCORE } from "@/lib/attempt-session-rules";

const INITIAL_ELO = 1200;
const PT_BR_INTEGER = new Intl.NumberFormat("pt-BR");
const PT_BR_PERCENT = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});
const PT_BR_SHORT_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});
const PT_BR_MONTH_YEAR = new Intl.DateTimeFormat("pt-BR", {
  month: "2-digit",
  year: "numeric",
});
const PT_BR_MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;
const PROFILE_TOPIC_UNLOCKS = CHALLENGE_TOPICS.map((topic) => ({
  topicId: topic.key,
  label: topic.label,
  unlockHint: `Faça 1 desafio de ${topic.label} para liberar`,
}));

type ProfileUserRecord = {
  id: string;
  name: string;
  bio: string | null;
  image: string | null;
  elo: number;
  createdAt: Date;
};

type ProfileChallengeRecord = {
  id: string;
  title: string;
  difficulty: string;
  recommendedElo: number;
  tags: string;
};

type ProfileAttemptRecord = {
  id: string;
  score: number;
  eloChange: number;
  createdAt: Date;
  challenge: ProfileChallengeRecord;
};

export type ProfileViewModelInput = {
  user: ProfileUserRecord;
  attempts: ProfileAttemptRecord[];
  recommendations: ProfileChallengeRecord[];
  now?: Date;
};

export function clampProficiency(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getProfileRankLabel(elo: number) {
  return formatRankLabel(elo);
}

export function buildProfileViewModel({
  user,
  attempts,
  recommendations,
  now = new Date(),
}: ProfileViewModelInput): ProfileViewModel {
  const progress = buildPractitionerProgress(attempts, now);

  return {
    user: {
      id: user.id,
      name: user.name,
      bio: user.bio ?? "Código com clareza. Diagnose com precisão. Ascenda.",
      image: user.image,
      tagline: user.bio ?? "Código com clareza. Diagnose com precisão. Ascenda.",
      memberSinceLabel: `Membro desde ${formatMonthYear(user.createdAt)}`,
      rank: getProfileRankLabel(user.elo),
      rankKanji: eloToDanRank(user.elo).kanji,
      elo: user.elo,
    },
    stats: [
      {
        id: "resolved",
        label: "Desafios resolvidos",
        value: PT_BR_INTEGER.format(progress.resolvedCount),
      },
      {
        id: "streak",
        label: "Sequência atual",
        value: `${progress.streak} dias`,
        accent: "warning",
      },
      {
        id: "accuracy",
        label: "Taxa de acerto",
        value: `${PT_BR_PERCENT.format(progress.accuracy)}%`,
      },
      {
        id: "attempts",
        label: "Tentativas de desafios",
        value: PT_BR_INTEGER.format(progress.attemptsCount),
      },
    ],
    eloSeries: buildEloSeries(attempts, user.elo),
    topicMastery: buildTopicMastery(attempts),
    recentSessions: attempts.slice(0, 5).map((attempt) => ({
      id: attempt.id,
      dateLabel: formatSessionDate(attempt.createdAt),
      challenge: attempt.challenge.title,
      difficulty: normalizeDifficulty(attempt.challenge.difficulty),
      result: getSessionStatus(attempt),
      eloChange: attempt.eloChange,
    })),
    recommendations: recommendations.slice(0, 5).map((challenge) => ({
      id: challenge.id,
      challenge: challenge.title,
      topic: getPrimaryTopicLabel(challenge),
      difficulty: normalizeDifficulty(challenge.difficulty),
      possibleElo: getPossibleElo(challenge.difficulty),
    })),
    achievements: buildAchievements({
      attempts,
      resolvedCount: progress.resolvedCount,
      streak: progress.streak,
    }),
  };
}

function buildEloSeries(attempts: ProfileAttemptRecord[], currentElo: number): EloPoint[] {
  if (attempts.length === 0) {
    return [{ dateLabel: "Hoje", elo: currentElo }];
  }

  const chronologicalAttempts = attempts.toSorted(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );
  const totalDelta = chronologicalAttempts.reduce(
    (sum, attempt) => sum + attempt.eloChange,
    0,
  );
  let runningElo = Math.max(100, currentElo - totalDelta);

  return chronologicalAttempts.slice(-13).map((attempt) => {
    runningElo = Math.max(100, runningElo + attempt.eloChange);
    return {
      dateLabel: formatShortDate(attempt.createdAt),
      elo: runningElo,
    };
  });
}

function buildTopicMastery(attempts: ProfileAttemptRecord[]): TopicMasteryItem[] {
  const topicStats = new Map<string, { label: string; attempts: number; score: number }>();

  for (const attempt of attempts) {
    const topic = getPrimaryTopic(attempt.challenge);
    const current = topicStats.get(topic.id) ?? {
      label: topic.label,
      attempts: 0,
      score: 0,
    };
    topicStats.set(topic.id, {
      label: current.label,
      attempts: current.attempts + 1,
      score: current.score + attempt.score,
    });
  }

  const unlocked = getUnlockedTopicMastery(topicStats);
  const unlockedTopicIds = new Set(unlocked.map((topic) => topic.topicId));
  const locked = getLockedTopicMastery(unlockedTopicIds);

  return [...unlocked, ...locked].slice(0, 5);
}

function getLockedTopicMastery(unlockedTopicIds: Set<string>) {
  const locked: TopicMasteryItem[] = [];

  for (const topic of PROFILE_TOPIC_UNLOCKS) {
    if (!unlockedTopicIds.has(topic.topicId)) {
      locked.push({
        topicId: topic.topicId,
        label: topic.label,
        proficiency: 0,
        locked: true,
        unlockHint: topic.unlockHint,
      });
    }
  }

  return locked;
}

function getUnlockedTopicMastery(
  topicStats: Map<string, { label: string; attempts: number; score: number }>,
) {
  const topics: TopicMasteryItem[] = [];

  for (const [topicId, stats] of topicStats) {
    topics.push({
      topicId,
      label: stats.label,
      proficiency: clampProficiency((stats.score / (stats.attempts * 10)) * 100),
    });
  }

  return topics
    .sort((left, right) => right.proficiency - left.proficiency)
    .slice(0, 5);
}

function buildAchievements({
  attempts,
  resolvedCount,
  streak,
}: {
  attempts: ProfileAttemptRecord[];
  resolvedCount: number;
  streak: number;
}): AchievementItem[] {
  const resolvedAttempts = attempts.filter(
    (attempt) => attempt.score >= PASSING_ATTEMPT_SCORE,
  );
  const firstResolvedAttempt = getOldestAttempt(resolvedAttempts);
  const firstHardResolvedAttempt = getOldestAttempt(
    resolvedAttempts.filter((attempt) => attempt.challenge.difficulty === "HARD"),
  );
  const firstEffectsResolvedAttempt = getOldestAttempt(
    resolvedAttempts.filter(
      (attempt) => getPrimaryTopic(attempt.challenge).id === "effects-lifecycle",
    ),
  );
  const latestAttempt = attempts[0] ?? null;
  const achievements: AchievementItem[] = [];

  if (firstResolvedAttempt) {
    achievements.push({
      id: "first-diagnosis",
      title: "Primeiro Diagnóstico",
      description: "Resolveu o primeiro desafio",
      unlockedAtLabel: getAchievementDateLabel(firstResolvedAttempt.createdAt),
      tone: "green",
    });
  }

  if (streak >= 3 && latestAttempt) {
    achievements.push({
      id: "focus",
      title: "Foco Sustentado",
      description: `Sequência atual de ${streak} dias`,
      unlockedAtLabel: getAchievementDateLabel(latestAttempt.createdAt),
      tone: "blue",
    });
  }

  if (firstHardResolvedAttempt) {
    achievements.push({
      id: "advanced",
      title: "React Avançado",
      description: "Resolveu um desafio difícil",
      unlockedAtLabel: getAchievementDateLabel(firstHardResolvedAttempt.createdAt),
      tone: "orange",
    });
  }

  if (firstEffectsResolvedAttempt) {
    achievements.push({
      id: "effects",
      title: "Mestre em Effects",
      description: "Resolveu um desafio de Effects",
      unlockedAtLabel: getAchievementDateLabel(firstEffectsResolvedAttempt.createdAt),
      tone: "indigo",
    });
  }

  if (resolvedCount >= 10 && latestAttempt) {
    achievements.push({
      id: "diagnostic",
      title: "Diagnóstico Afiado",
      description: `${resolvedCount} desafios resolvidos`,
      unlockedAtLabel: getAchievementDateLabel(latestAttempt.createdAt),
      tone: "green",
    });
  }

  return achievements.slice(0, 4);
}

function getOldestAttempt(attempts: ProfileAttemptRecord[]) {
  return attempts.toSorted(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  )[0];
}

function getSessionStatus(attempt: ProfileAttemptRecord): ProfileSessionStatus {
  if (attempt.score >= PASSING_ATTEMPT_SCORE) {
    return "resolved";
  }

  return "in_progress";
}

function getPossibleElo(difficulty: string) {
  if (difficulty === "HARD") {
    return 22;
  }

  if (difficulty === "EASY") {
    return 12;
  }

  return 18;
}

function normalizeDifficulty(difficulty: string): ProfileDifficulty {
  if (difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD") {
    return difficulty;
  }

  return "MEDIUM";
}

function getPrimaryTopicLabel(challenge: ProfileChallengeRecord) {
  return getPrimaryTopic(challenge).label;
}

function getPrimaryTopic(challenge: ProfileChallengeRecord) {
  const topic = getChallengeTopic(getChallengeTopicKey(challenge));
  return { id: topic.key, label: topic.label };
}

function getAchievementDateLabel(date: Date) {
  return `Atualizado em ${formatShortDate(date)}`;
}

function formatMonthYear(date: Date) {
  return PT_BR_MONTH_YEAR.format(date);
}

function formatShortDate(date: Date) {
  return PT_BR_SHORT_DATE.format(date).replace(".", "");
}

function formatSessionDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${PT_BR_MONTHS[date.getMonth()]}`;
}
