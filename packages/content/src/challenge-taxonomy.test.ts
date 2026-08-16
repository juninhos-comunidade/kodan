import { describe, expect, test } from "bun:test";

import {
  getChallengeTopicDefinitions,
  inferChallengeTopic,
} from "./challenge-taxonomy";

describe("taxonomia de desafios por linguagem", () => {
  test("oferece filtros próprios para cada linguagem", () => {
    expect(getChallengeTopicDefinitions("react").map((topic) => topic.key)).toContain("effects-lifecycle");
    expect(getChallengeTopicDefinitions("typescript").map((topic) => topic.key)).toContain("generics-inference");
    expect(getChallengeTopicDefinitions("python").map((topic) => topic.key)).toContain("collections-mutability");
    expect(getChallengeTopicDefinitions("java").map((topic) => topic.key)).toContain("collections-streams");
    expect(getChallengeTopicDefinitions("go").map((topic) => topic.key)).toContain("goroutines-channels");
  });

  test("mantém a classificação dos desafios React existentes", () => {
    expect(inferChallengeTopic({
      language: "react",
      id: "react-hooks-stale-closure-useeffect",
      title: "Closure desatualizada",
      tags: ["react", "hooks", "stale-closure"],
    })).toBe("effects-lifecycle");
    expect(inferChallengeTopic({
      language: "react",
      id: "react-state-race-condition-user-profile",
      title: "Perfil fora de ordem",
      tags: ["react", "race-condition", "data-fetching"],
    })).toBe("async-races");
  });

  test("usa o primeiro filtro da linguagem como fallback seguro", () => {
    expect(inferChallengeTopic({
      language: "go",
      id: "go-sem-tag-especifica",
      title: "Um desafio novo",
      tags: ["go"],
    })).toBe(getChallengeTopicDefinitions("go")[0]?.key);
  });
});
