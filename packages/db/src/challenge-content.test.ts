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
      language: "typescript",
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
        language: "typescript",
        evaluationRubricJson: JSON.stringify(rubric),
      }),
      create: expect.objectContaining({
        id: "challenge-1",
        language: "typescript",
        evaluationRubricJson: JSON.stringify(rubric),
      }),
    });
  });

  test("persiste um desafio conceitual sem código e um artefato de terminal", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodan-seed-concept-"));
    temporaryRoots.push(root);
    const challengeDirectory = path.join(root, "challenge");
    await mkdir(challengeDirectory);
    await writeFile(path.join(challengeDirectory, "challenge.json"), JSON.stringify({
      id: "go-interface-vs-struct",
      title: "Interface ou struct?",
      difficulty: "EASY",
      recommendedElo: 1100,
      language: "go",
      topic: "interfaces-methods",
      presentation: "terminal",
      intent: "compare",
      terminalFile: "terminal.json",
      scenario: "Um colega propôs duas estruturas.",
      question: "Compare as estruturas.",
      tags: ["go", "interfaces"],
    }));
    await writeFile(path.join(challengeDirectory, "terminal.json"), JSON.stringify({
      command: "go test ./...",
      blocks: [{ label: "Obtido", content: "PASS", tone: "success" }],
    }));
    await writeFile(path.join(challengeDirectory, "solution.md"), "A interface descreve comportamento.");
    const upsert = mock(async () => undefined);
    const prisma = {
      challenge: {
        findMany: mock(async () => []),
        upsert,
      },
    };

    await upsertChallengesFromContent(prisma as never, { root });

    expect(upsert).toHaveBeenCalledWith({
      where: { id: "go-interface-vs-struct" },
      update: expect.objectContaining({
        code: null,
        scenario: "Um colega propôs duas estruturas.",
        topic: "interfaces-methods",
        presentation: "terminal",
        intent: "compare",
        terminalJson: JSON.stringify({
          command: "go test ./...",
          blocks: [{ label: "Obtido", content: "PASS", tone: "success" }],
        }),
      }),
      create: expect.objectContaining({ id: "go-interface-vs-struct" }),
    });
  });

  test("remove somente duplicatas órfãs quando a reconciliação é explicitamente habilitada", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodan-seed-"));
    temporaryRoots.push(root);
    const challengeDirectory = path.join(root, "challenge");
    await mkdir(challengeDirectory);
    await writeFile(path.join(challengeDirectory, "challenge.json"), JSON.stringify({
      id: "challenge-stable-id",
      title: "Desafio canônico",
      difficulty: "EASY",
      recommendedElo: 1100,
      language: "react",
      question: "Explique o comportamento.",
      tags: ["react"],
    }));
    await writeFile(path.join(challengeDirectory, "code.tsx"), "const value = 1;");
    await writeFile(path.join(challengeDirectory, "solution.md"), "O valor é constante.");

    const deleteMany = mock(async () => ({ count: 1 }));
    const updateMany = mock(async () => ({ count: 2 }));
    const prisma = {
      challenge: {
        findMany: mock(async () => [
          {
            id: "legacy-duplicate-id",
            title: "Desafio canônico",
            _count: { attempts: 0 },
          },
          {
            id: "protected-orphan-id",
            title: "Desafio fora do catálogo",
            _count: { attempts: 2 },
          },
          {
            id: "legacy-duplicate-with-history",
            title: "Desafio canônico",
            _count: { attempts: 3 },
          },
        ]),
        upsert: mock(async () => undefined),
        deleteMany,
        updateMany,
      },
    };

    const result = await upsertChallengesFromContent(
      prisma as never,
      { root, pruneDuplicateOrphans: true } as never,
    );

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{
          id: "legacy-duplicate-id",
          title: "Desafio canônico",
          attempts: { none: {} },
        }],
      },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["protected-orphan-id", "legacy-duplicate-with-history"],
        },
      },
      data: { promoted: false },
    });
    expect(result).toMatchObject({
      pruned: 1,
      demoted: 2,
      protectedOrphans: [{
        id: "protected-orphan-id",
        title: "Desafio fora do catálogo",
        attemptCount: 2,
      }, {
        id: "legacy-duplicate-with-history",
        title: "Desafio canônico",
        attemptCount: 3,
      }],
    });
  });
});
