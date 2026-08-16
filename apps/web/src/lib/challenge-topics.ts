export type ChallengeTopicKey =
  | "effects-lifecycle"
  | "state-rendering"
  | "async-races"
  | "forms-validation"
  | "component-patterns"
  | "type-system";

export type ChallengeTopicDefinition = {
  key: ChallengeTopicKey;
  label: string;
  description: string;
};

type TopicChallenge = { id: string; title: string; tags: string };

export const CHALLENGE_TOPICS: readonly ChallengeTopicDefinition[] = [
  { key: "effects-lifecycle", label: "Effects & Lifecycle", description: "useEffect, closures, dependências e ciclo de vida." },
  { key: "state-rendering", label: "State & Rendering", description: "estado, renderização, derivação e memoização." },
  { key: "async-races", label: "Async UI & Races", description: "fetch, concorrência, ordenação e sincronização de interface." },
  { key: "forms-validation", label: "Forms & Validation", description: "inputs, contratos controlados e validação previsível." },
  { key: "component-patterns", label: "Component Patterns", description: "composição, interfaces e contratos entre módulos visuais." },
  { key: "type-system", label: "Type System", description: "tipos, generics, inferência e narrowing em TypeScript." },
] as const;

const TOPIC_MATCHERS: Record<ChallengeTopicKey, readonly string[]> = {
  "effects-lifecycle": ["hooks", "react-hooks", "stale-closure", "useeffect", "effect", "effects", "dependency", "dependencies", "cleanup", "strict-mode"],
  "state-rendering": ["state-management", "state", "rendering", "immutability", "derived-state", "memoization", "usememo"],
  "async-races": ["race", "race-condition", "data-fetching", "async", "promise", "fetch", "abort", "concurrency"],
  "forms-validation": ["form", "forms", "validation", "input", "controlled", "uncontrolled"],
  "component-patterns": ["composition", "component", "components", "contracts", "children", "context", "ref", "architecture", "api"],
  "type-system": ["type-system", "typescript", "generic", "generics", "inference", "narrowing", "types"],
};

const TOPIC_PRIORITY: readonly ChallengeTopicKey[] = [
  "async-races",
  "forms-validation",
  "component-patterns",
  "effects-lifecycle",
  "type-system",
  "state-rendering",
];

export function getChallengeTopicKey(challenge: TopicChallenge): ChallengeTopicKey {
  const tagsAndId = [
    ...challenge.tags.split(",").flatMap((tag) => {
      const normalized = tag.trim().toLocaleLowerCase();
      return normalized ? [normalized] : [];
    }),
    challenge.id.toLocaleLowerCase(),
  ];
  const title = [challenge.title.toLocaleLowerCase()];

  for (const searchable of [tagsAndId, title]) {
    for (const topic of TOPIC_PRIORITY) {
      if (matchesAnyTopicToken(searchable, TOPIC_MATCHERS[topic])) return topic;
    }
  }
  return "state-rendering";
}

export function getChallengeTopic(topicKey: ChallengeTopicKey) {
  return CHALLENGE_TOPICS.find((topic) => topic.key === topicKey) ?? CHALLENGE_TOPICS[0]!;
}

function matchesAnyTopicToken(searchable: string[], tokens: readonly string[]) {
  return searchable.some((entry) => tokens.some((token) => entry.includes(token)));
}
