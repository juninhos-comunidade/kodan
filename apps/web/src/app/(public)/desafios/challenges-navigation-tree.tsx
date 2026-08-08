"use client";

import { Atom } from "lucide-react";

import type { DifficultyFilter } from "./challenges-list-state";
import { ChallengesTreeGroup } from "./challenges-tree-group";
import type { NavigationTreeDensity } from "./challenges-navigation-types";
import { ChallengesTopicNode } from "./challenges-topic-node";
import type {
  ChallengeTopicFilter,
  ChallengeTopicSection,
} from "./challenges-taxonomy";

export function ChallengesNavigationTree({
  languageLabel,
  sections,
  topicFilter,
  filterDifficulty,
  density,
  onTopicChange,
  onDifficultyChange,
}: {
  languageLabel: string;
  sections: ChallengeTopicSection[];
  topicFilter: ChallengeTopicFilter;
  filterDifficulty: DifficultyFilter;
  density: NavigationTreeDensity;
  onTopicChange: (topic: ChallengeTopicFilter) => void;
  onDifficultyChange: (difficulty: DifficultyFilter) => void;
}) {
  return (
    <nav className="mt-4 space-y-4" aria-label="Árvore de desafios">
      <ChallengesTreeGroup
        label={languageLabel}
        icon={<Atom className="size-4" />}
        expanded
        density={density}
      >
        {sections.map((section) => (
          <ChallengesTopicNode
            key={section.key}
            section={section}
            activeTopic={topicFilter}
            activeDifficulty={filterDifficulty}
            density={density}
            onTopicChange={onTopicChange}
            onDifficultyChange={onDifficultyChange}
          />
        ))}
      </ChallengesTreeGroup>

    </nav>
  );
}
