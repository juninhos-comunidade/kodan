export type ProfileDifficulty = "EASY" | "MEDIUM" | "HARD";
export type ProfileSessionStatus = "resolved" | "in_progress" | "not_started";
export type AchievementTone = "blue" | "green" | "orange" | "indigo";

export interface ProfileUserSummary {
  id: string;
  name: string;
  bio: string;
  image: string | null;
  tagline: string;
  memberSinceLabel: string;
  rank: string;
  rankKanji: string;
  elo: number;
}

export interface ProfileStatItem {
  id: string;
  label: string;
  value: string;
  accent?: "warning";
}

export interface EloPoint {
  dateLabel: string;
  elo: number;
}

export interface TopicMasteryItem {
  topicId: string;
  label: string;
  proficiency: number;
  locked?: boolean;
  unlockHint?: string;
}

export interface RecentSessionItem {
  id: string;
  dateLabel: string;
  challenge: string;
  difficulty: ProfileDifficulty;
  result: ProfileSessionStatus;
  eloChange: number | null;
  placeholder?: boolean;
}

export interface RecommendedChallengeItem {
  id: string;
  challenge: string;
  topic: string;
  difficulty: ProfileDifficulty;
  possibleElo: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlockedAtLabel: string;
  tone: AchievementTone;
}

export interface ProfileViewModel {
  user: ProfileUserSummary;
  stats: ProfileStatItem[];
  eloSeries: EloPoint[];
  topicMastery: TopicMasteryItem[];
  recentSessions: RecentSessionItem[];
  recommendations: RecommendedChallengeItem[];
  achievements: AchievementItem[];
}
