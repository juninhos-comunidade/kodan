import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  findActiveChallengesWithoutEvaluationRubric,
  readPromotedChallengeCatalog,
} from "./promoted-challenge-catalog";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("readPromotedChallengeCatalog", () => {
  test("materializa desafios legacy e split por uma raiz explícita", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodan-catalog-"));
    temporaryRoots.push(root);
    await writeFile(path.join(root, "legacy.json"), JSON.stringify({
      id: "legacy", title: "Legacy", difficulty: "EASY", recommendedElo: 1100,
      question: "Qual é o problema?", tags: ["typescript", "react"], code: "const a = 1", solution: "Explique a causa.",
    }));
    const split = path.join(root, "split");
    await mkdir(split);
    await writeFile(path.join(split, "challenge.json"), JSON.stringify({
      id: "split", title: "Split", difficulty: "HARD", recommendedElo: 1500,
      question: "Qual é o problema?", tags: ["typescript"], rubricFile: "rubric.json",
    }));
    await writeFile(path.join(split, "code.tsx"), "const value: string = 'x';");
    await writeFile(path.join(split, "solution.md"), "Use narrowing.");
    await writeFile(path.join(split, "rubric.json"), JSON.stringify({
      version: "1.0.0",
      questionKind: "explain-code",
      centralAnswer: "O valor já possui tipo string.",
      concepts: [{
        id: "declared-type",
        importance: "critical",
        internalDescription: "A anotação declara o valor como string.",
        publicLabel: "A declaração explícita do tipo.",
      }],
    }));

    const catalog = await readPromotedChallengeCatalog({ root });

    expect(catalog.challenges.map((challenge) => challenge.id)).toEqual(["legacy", "split"]);
    expect(catalog.index.find((entry) => entry.id === "legacy")?.language).toBe("react");
    expect(catalog.index.find((entry) => entry.id === "split")?.language).toBe("typescript");
    expect(catalog.challenges.find((challenge) => challenge.id === "legacy")?.language).toBe("react");
    expect(catalog.challenges.find((challenge) => challenge.id === "split")?.language).toBe("typescript");
    expect(catalog.challenges.find((challenge) => challenge.id === "split")?.evaluationRubric).toMatchObject({
      version: "1.0.0",
      questionKind: "explain-code",
      concepts: [{ id: "declared-type", importance: "critical" }],
    });
  });
});

describe("findActiveChallengesWithoutEvaluationRubric", () => {
  test("lista somente desafios ativos sem rubrica", () => {
    const baseChallenge = {
      difficulty: "EASY",
      recommendedElo: 1000,
      code: "const value = 1;",
      question: "Explique.",
      solution: "Resposta.",
      tags: ["react"],
    };
    const baseIndex = {
      language: "tsx",
      difficulty: "EASY" as const,
      type: "debugging",
      tags: ["react"],
      estimatedTime: 10,
      recommendedElo: 1000,
    };
    const missing = findActiveChallengesWithoutEvaluationRubric({
      challenges: [
        { ...baseChallenge, id: "active-without", title: "Ativo sem rubrica" },
        { ...baseChallenge, id: "draft-without", title: "Draft sem rubrica" },
      ],
      index: [
        { ...baseIndex, id: "active-without", title: "Ativo sem rubrica", status: "ACTIVE" },
        { ...baseIndex, id: "draft-without", title: "Draft sem rubrica", status: "DRAFT" },
      ],
    });

    expect(missing).toEqual([
      { id: "active-without", title: "Ativo sem rubrica" },
    ]);
  });
});
