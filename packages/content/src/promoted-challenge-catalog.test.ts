import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  findActiveChallengesWithoutEvaluationRubric,
  readPromotedChallengeCatalog,
} from "./promoted-challenge-catalog";
import {
  challengeEvaluationRubricSchema,
  evaluationBenchmarkCasesSchema,
} from "./challenge-schemas";
import { getChallengeTopicDefinitions } from "./challenge-taxonomy";

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
    expect(catalog.challenges.find((challenge) => challenge.id === "legacy")).toMatchObject({
      presentation: "code",
      intent: "diagnose",
      topic: "type-system",
    });
  });

  test("materializa desafio conceitual sem exigir arquivo de código", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodan-concept-catalog-"));
    temporaryRoots.push(root);
    const challengeDirectory = path.join(root, "concept");
    await mkdir(challengeDirectory);
    await writeFile(path.join(challengeDirectory, "challenge.json"), JSON.stringify({
      id: "go-interface-vs-struct",
      title: "Interface ou struct?",
      language: "go",
      topic: "interfaces-methods",
      presentation: "concept",
      intent: "compare",
      difficulty: "EASY",
      recommendedElo: 1100,
      scenario: "Um colega sugeriu trocar uma struct por uma interface.",
      question: "Qual é a diferença entre as duas estruturas?",
      tags: ["go", "interfaces", "structs"],
    }));
    await writeFile(path.join(challengeDirectory, "solution.md"), "Uma interface descreve comportamento.");

    const catalog = await readPromotedChallengeCatalog({ root });

    expect(catalog.challenges[0]).toMatchObject({
      id: "go-interface-vs-struct",
      code: null,
      scenario: "Um colega sugeriu trocar uma struct por uma interface.",
      topic: "interfaces-methods",
      presentation: "concept",
      intent: "compare",
    });
    expect(catalog.challenges[0]?.terminal).toBeUndefined();
  });

  test("materializa código e terminal declarados pelo desafio", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodan-terminal-catalog-"));
    temporaryRoots.push(root);
    const challengeDirectory = path.join(root, "terminal");
    await mkdir(challengeDirectory);
    await writeFile(path.join(challengeDirectory, "challenge.json"), JSON.stringify({
      id: "python-lista-compartilhada",
      title: "A lista que cresceu duas vezes",
      language: "python",
      topic: "collections-mutability",
      presentation: "code-terminal",
      intent: "diagnose",
      difficulty: "MEDIUM",
      recommendedElo: 1300,
      question: "Explique por que a saída obtida diverge da esperada.",
      tags: ["python", "lists", "mutability"],
      codeFile: "cart.py",
      terminalFile: "terminal.json",
    }));
    await writeFile(path.join(challengeDirectory, "cart.py"), "items = []\nitems.append('livro')");
    await writeFile(path.join(challengeDirectory, "terminal.json"), JSON.stringify({
      command: "python cart.py",
      blocks: [
        { label: "Esperado", content: "['livro']", tone: "success" },
        { label: "Obtido", content: "['livro', 'livro']", tone: "error" },
      ],
    }));
    await writeFile(path.join(challengeDirectory, "solution.md"), "A lista mutável foi compartilhada.");

    const catalog = await readPromotedChallengeCatalog({ root });

    expect(catalog.challenges[0]).toMatchObject({
      id: "python-lista-compartilhada",
      codeFileName: "cart.py",
      code: "items = []\nitems.append('livro')",
      presentation: "code-terminal",
      terminal: {
        command: "python cart.py",
        blocks: [{ label: "Esperado", tone: "success" }, { label: "Obtido", tone: "error" }],
      },
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
      topic: "state-rendering",
      presentation: "code" as const,
      intent: "diagnose" as const,
    };
    const baseIndex = {
      language: "react" as const,
      topic: "state-rendering",
      presentation: "code" as const,
      intent: "diagnose" as const,
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

describe("trilha piloto de avaliação", () => {
  test("ativa cinco rubricas de React com casos de avaliação válidos", async () => {
    const pilotChallenges = [
      ["react-state-race-condition-user-profile", "react-state/race-condition-user-profile"],
      ["react-hooks-stale-closure-useeffect", "react-hooks/stale-closure-useeffect"],
      ["react-rendering-object-dependency-infinite-loop", "react-rendering/object-dependency-infinite-loop"],
      ["react-medium-busca-incremental-de-clientes-1", "react-interview/medium/react-medium-busca-incremental-de-clientes-1"],
      ["react-hard-dashboard-operacional-1", "react-interview/hard/react-hard-dashboard-operacional-1"],
    ];
    const catalog = await readPromotedChallengeCatalog();
    const activeIds = new Set(
      catalog.index
        .filter((entry) => entry.status === "ACTIVE")
        .map((entry) => entry.id),
    );
    const challengeById = new Map(
      catalog.challenges.map((challenge) => [challenge.id, challenge]),
    );
    for (const [pilotId, challengeDirectory] of pilotChallenges) {
      expect(activeIds.has(pilotId)).toBe(true);
      expect(challengeById.get(pilotId)?.evaluationRubric).toBeDefined();

      const rubric = challengeEvaluationRubricSchema.parse(JSON.parse(
        await readFile(
          path.join(catalog.root, challengeDirectory, "rubric.json"),
          "utf-8",
        ),
      ));

      const cases = evaluationBenchmarkCasesSchema.parse(JSON.parse(
        await readFile(
          path.join(catalog.root, challengeDirectory, "evaluation-cases.json"),
          "utf-8",
        ),
      ));
      expect(new Set(cases.map((evaluationCase) => evaluationCase.category))).toEqual(
        new Set(["accepted", "partial", "rejected", "adversarial"]),
      );

      const conceptIds = new Set(rubric.concepts.map((concept) => concept.id));
      for (const evaluationCase of cases) {
        const referencedConceptIds = [
          ...(evaluationCase.expectedMatchedConceptIds ?? []),
          ...(evaluationCase.forbiddenMatchedConceptIds ?? []),
        ];
        for (const conceptId of referencedConceptIds) {
          expect(conceptIds.has(conceptId)).toBe(true);
        }
      }
    }
  });
});

describe("blocos editoriais multiformato", () => {
  test("carrega cinco desafios TypeScript bloqueados com um tema por filtro", async () => {
    const catalog = await readPromotedChallengeCatalog();
    const typescriptChallenges = catalog.challenges.filter(
      (challenge) => challenge.language === "typescript",
    );

    expect(typescriptChallenges).toHaveLength(5);
    expect(new Set(typescriptChallenges.map((challenge) => challenge.topic))).toEqual(
      new Set(getChallengeTopicDefinitions("typescript").map((topic) => topic.key)),
    );
    expect(new Set(typescriptChallenges.map((challenge) => challenge.presentation))).toEqual(
      new Set(["code", "code-terminal", "terminal", "concept"]),
    );
    expect(typescriptChallenges.every((challenge) => challenge.scenario)).toBe(true);
    expect(typescriptChallenges.every((challenge) => !challenge.evaluationRubric)).toBe(true);

    const activeTypescriptIds = catalog.index
      .filter((entry) => entry.language === "typescript" && entry.status === "ACTIVE")
      .map((entry) => entry.id);
    expect(activeTypescriptIds).toHaveLength(5);
    expect(findActiveChallengesWithoutEvaluationRubric(catalog)).toEqual(
      expect.arrayContaining(
        typescriptChallenges.map(({ id, title }) => ({ id, title })),
      ),
    );

    const asyncSolution = await readFile(
      path.join(
        catalog.root,
        "typescript/async-errors/unhandled-rejection-test/solution.md",
      ),
      "utf-8",
    );
    expect(asyncSolution).toContain("processPayment();");
    expect(asyncSolution).toContain("await expect(processPayment()).rejects");
  });

  test.each(["python", "java", "go"] as const)(
    "carrega cinco desafios %s bloqueados com um tema por filtro",
    async (language) => {
      const catalog = await readPromotedChallengeCatalog();
      const languageChallenges = catalog.challenges.filter(
        (challenge) => challenge.language === language,
      );

      expect(languageChallenges).toHaveLength(5);
      expect(new Set(languageChallenges.map((challenge) => challenge.topic))).toEqual(
        new Set(getChallengeTopicDefinitions(language).map((topic) => topic.key)),
      );
      expect(new Set(languageChallenges.map((challenge) => challenge.presentation))).toEqual(
        new Set(["code", "code-terminal", "terminal", "concept"]),
      );
      expect(languageChallenges.every((challenge) => challenge.scenario)).toBe(true);
      expect(languageChallenges.every((challenge) => !challenge.evaluationRubric)).toBe(true);
      expect(
        catalog.index.filter(
          (entry) => entry.language === language && entry.status === "ACTIVE",
        ),
      ).toHaveLength(5);
      expect(findActiveChallengesWithoutEvaluationRubric(catalog)).toEqual(
        expect.arrayContaining(
          languageChallenges.map(({ id, title }) => ({ id, title })),
        ),
      );
    },
  );
});
