import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faGolang,
  faJava,
  faPython,
  faReact,
  faTypescript,
} from "@fortawesome/free-brands-svg-icons";

import type { ChallengeLanguage } from "./ema-challenge-card-helpers";

export type ChallengeLanguageDefinition = {
  id: ChallengeLanguage;
  name: string;
  icon: IconDefinition;
  category: "Front-end" | "Back-end";
  accent: string;
};

export const CHALLENGE_LANGUAGES: readonly ChallengeLanguageDefinition[] = [
  {
    id: "react",
    name: "React",
    icon: faReact,
    category: "Front-end",
    accent: "#49a6dc",
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: faTypescript,
    category: "Front-end",
    accent: "#4f8bc9",
  },
  {
    id: "python",
    name: "Python",
    icon: faPython,
    category: "Back-end",
    accent: "#d8aa2f",
  },
  {
    id: "java",
    name: "Java",
    icon: faJava,
    category: "Back-end",
    accent: "#d06b3c",
  },
  {
    id: "go",
    name: "Go",
    icon: faGolang,
    category: "Back-end",
    accent: "#3f9fb8",
  },
] as const;

export function getChallengeLanguageDefinition(language: ChallengeLanguage) {
  return CHALLENGE_LANGUAGES.find((item) => item.id === language)!;
}
