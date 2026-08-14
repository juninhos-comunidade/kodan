import {
  getChallengeTopicDefinitions,
  type ChallengeTopicDefinition,
} from "@kodan/content/challenge-taxonomy";
import type { Challenge, Difficulty } from "./ema-challenge-card-helpers";
import { getChallengeTags, isDifficulty } from "./ema-challenge-card-helpers";

export const CHALLENGE_TOPICS = getChallengeTopicDefinitions("react");
export type ChallengeTopicKey = string;
export type { ChallengeTopicDefinition };

export type ChallengeTopicFilter = "ALL" | ChallengeTopicKey;

export interface ChallengeTopicSection extends ChallengeTopicDefinition {
  count: number;
  difficulties: Record<"ALL" | Difficulty, number>;
}

export function matchesChallengeTopic(
  challenge: Pick<Challenge, "topic">,
  topicFilter: ChallengeTopicFilter,
) {
  return topicFilter === "ALL" || challenge.topic === topicFilter;
}

export function buildChallengeTopicSections(challenges: Challenge[]): ChallengeTopicSection[] {
  const language = challenges[0]?.language;
  const topics = language ? getChallengeTopicDefinitions(language) : CHALLENGE_TOPICS;
  return topics.map((topic) => {
    const difficulties = {
      ALL: 0,
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    } satisfies Record<"ALL" | Difficulty, number>;

    for (const challenge of challenges) {
      if (challenge.topic !== topic.key) continue;
      difficulties.ALL += 1;
      if (isDifficulty(challenge.difficulty)) difficulties[challenge.difficulty] += 1;
    }

    return { ...topic, count: difficulties.ALL, difficulties };
  });
}

export function getChallengeTopicTagline(
  challenge: Pick<Challenge, "language" | "topic" | "tags">,
) {
  const topicLabel = getChallengeTopicLabel(challenge.topic, challenge.language);
  const topicTags: string[] = [];

  for (const rawTag of getChallengeTags(challenge.tags)) {
    const normalizedTag = normalizeChallengeTag(rawTag);
    if (
      normalizedTag.length === 0 ||
      normalizedTag === "React" ||
      normalizedTag === "Interview" ||
      normalizedTag === "Debugging"
    ) continue;

    topicTags.push(normalizedTag);
    if (topicTags.length === 3) break;
  }

  return topicTags.length === 0 ? topicLabel : `${topicLabel} · ${topicTags.join(" · ")}`;
}

export function getChallengeTopicLabel(
  topicKey: string,
  language?: Challenge["language"],
) {
  return findTopic(topicKey, language)?.label ?? topicKey;
}

export function getChallengeTopicDescription(
  topicKey: string,
  language?: Challenge["language"],
) {
  return findTopic(topicKey, language)?.description ?? "Pratique o tema em desafios revisados.";
}

function findTopic(topicKey: string, language?: Challenge["language"]) {
  const definitions = language
    ? getChallengeTopicDefinitions(language)
    : (["react", "typescript", "python", "java", "go"] as const)
        .flatMap((candidate) => getChallengeTopicDefinitions(candidate));
  return definitions.find((topic) => topic.key === topicKey);
}

function normalizeChallengeTag(tag: string) {
  if (tag === "useEffect") return tag;
  return tag
    .split("-")
    .map((part) => part.length > 0 ? `${part[0]!.toLocaleUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}
