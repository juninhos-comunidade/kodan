import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { upsertChallengesFromContent } from "./challenge-content";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("upsertChallengesFromContent", () => {
  test("persiste a rubrica versionada carregada do conteúdo", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodan-seed-"));
    temporaryRoots.push(root);
    const challengeDirectory = path.join(root, "challenge");
    await mkdir(challengeDirectory);
    await writeFile(path.join(challengeDirectory, "challenge.json"), JSON.stringify({
      id: "challenge-1",
      title: "Desafio",
      difficulty: "EASY",
      recommendedElo: 1100,
      question: "Explique o comportamento.",
      tags: ["typescript"],
      rubricFile: "rubric.json",
    }));
    await writeFile(path.join(challengeDirectory, "code.tsx"), "const value = 1;");
    await writeFile(path.join(challengeDirectory, "solution.md"), "O valor é constante.");
    const rubric = {
      version: "1.0.0",
      questionKind: "explain-code",
      centralAnswer: "O valor permanece constante.",
      concepts: [{
        id: "constant-value",
        importance: "critical",
        internalDescription: "O valor não é alterado.",
        publicLabel: "A estabilidade do valor.",
      }],
    };
    await writeFile(
      path.join(challengeDirectory, "rubric.json"),
      JSON.stringify(rubric),
    );
    const upsert = mock(async () => undefined);
    const prisma = {
      challenge: {
        findMany: mock(async () => []),
        upsert,
      },
    };

    await upsertChallengesFromContent(prisma as never, { root });

    expect(upsert).toHaveBeenCalledWith({
      where: { id: "challenge-1" },
      update: expect.objectContaining({
        evaluationRubricJson: JSON.stringify(rubric),
      }),
      create: expect.objectContaining({
        id: "challenge-1",
        evaluationRubricJson: JSON.stringify(rubric),
      }),
    });
  });
});
