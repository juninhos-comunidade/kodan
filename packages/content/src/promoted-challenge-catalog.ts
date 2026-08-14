import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  challengeEvaluationRubricSchema,
  evaluationBenchmarkCasesSchema,
  challengeIndexSchema,
  challengeLegacySchema,
  challengeSplitMetaSchema,
  challengeTerminalArtifactSchema,
  type ChallengeIndexEntry,
  type ChallengeEvaluationRubric,
  type ChallengeIntent,
  type ChallengeLegacy,
  type ChallengePresentation,
  type ChallengeSplitMeta,
  type ChallengeTerminalArtifact,
  type EvaluationBenchmarkCase,
} from "./challenge-schemas";
import { inferChallengeTopic } from "./challenge-taxonomy";

export type ChallengeContentEntry = {
  id: string;
  title: string;
  language: ChallengeIndexEntry["language"];
  difficulty: string;
  recommendedElo: number;
  code: string | null;
  codeFileName?: string;
  question: string;
  scenario?: string;
  solution: string;
  tags: string[];
  topic: string;
  presentation: ChallengePresentation;
  intent: ChallengeIntent;
  terminal?: ChallengeTerminalArtifact;
  evaluationRubric?: ChallengeEvaluationRubric;
  evaluationCases?: EvaluationBenchmarkCase[];
};

type ChallengeLoadResult = {
  challenge: ChallengeContentEntry;
  indexEntry: ChallengeIndexEntry;
};

type ChallengeSource = { kind: "split" | "legacy"; filePath: string };
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export async function readPromotedChallengeCatalog(options: { root?: string } = {}) {
  const root = options.root ?? await resolveContentRoot();
  const sources = (await collectChallengeSources(root)).sort((a, b) => a.filePath.localeCompare(b.filePath));
  const ids = new Set<string>();
  const challenges: ChallengeContentEntry[] = [];
  const index: ChallengeIndexEntry[] = [];
  const loadedChallenges = await Promise.all(
    sources.map((source) =>
      source.kind === "split"
        ? loadSplitChallenge(source.filePath)
        : loadLegacyChallenge(source.filePath)
    ),
  );

  for (const [sourceIndex, loaded] of loadedChallenges.entries()) {
    const challengeId = loaded.challenge.id;
    if (ids.has(challengeId)) {
      throw new Error(`ID duplicado encontrado em ${sources[sourceIndex]!.filePath}: "${challengeId}"`);
    }
    ids.add(challengeId);
    challenges.push(loaded.challenge);
    index.push(loaded.indexEntry);
  }

  return { root, challenges, index: challengeIndexSchema.parse(index) };
}

export async function readChallengesFromContent(options: { root?: string } = {}) {
  return (await readPromotedChallengeCatalog(options)).challenges;
}

export function findActiveChallengesWithoutEvaluationRubric(
  catalog: Pick<Awaited<ReturnType<typeof readPromotedChallengeCatalog>>, "challenges" | "index">,
) {
  const challengeById = new Map(
    catalog.challenges.map((challenge) => [challenge.id, challenge]),
  );
  return catalog.index
    .filter((entry) => entry.status === "ACTIVE")
    .filter((entry) => !challengeById.get(entry.id)?.evaluationRubric)
    .map((entry) => ({ id: entry.id, title: entry.title }));
}

export async function syncChallengesIndexFromContent(options: { root?: string } = {}) {
  const catalog = await readPromotedChallengeCatalog(options);
  const indexPath = path.join(catalog.root, "index.json");
  await writeFile(indexPath, `${JSON.stringify(catalog.index, null, 2)}\n`, "utf-8");
  return { total: catalog.index.length, indexPath };
}

async function resolveContentRoot() {
  const candidates = [
    path.resolve(process.cwd(), "content", "challenges"),
    path.resolve(process.cwd(), "..", "..", "content", "challenges"),
    path.resolve(moduleDir, "..", "..", "..", "content", "challenges"),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error("Pasta de conteúdo não encontrada em /content/challenges");
}

async function collectChallengeSources(root: string): Promise<ChallengeSource[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const splitMeta = entries.find((entry) => entry.isFile() && entry.name.toLowerCase() === "challenge.json");
  if (splitMeta) return [{ kind: "split", filePath: path.join(root, splitMeta.name) }];

  const sourcesByEntry = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return collectChallengeSources(filePath);
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json") && entry.name.toLowerCase() !== "index.json") {
      return [{ kind: "legacy" as const, filePath }];
    }
    return [];
  }));
  return sourcesByEntry.flat();
}

async function loadLegacyChallenge(filePath: string): Promise<ChallengeLoadResult> {
  const parsed = challengeLegacySchema.parse(await readJsonUnknown(filePath)) as ChallengeLegacy;
  const indexEntry = buildIndexEntryFromMeta(parsed);
  return {
    challenge: {
      id: parsed.id,
      title: parsed.title,
      language: indexEntry.language,
      difficulty: parsed.difficulty,
      recommendedElo: parsed.recommendedElo,
      code: parsed.code,
      question: parsed.question,
      solution: parsed.solution ?? parsed.expectedAnswer ?? "",
      tags: parsed.tags,
      topic: indexEntry.topic,
      presentation: indexEntry.presentation,
      intent: indexEntry.intent,
      ...(parsed.scenario ? { scenario: parsed.scenario } : {}),
      ...(parsed.evaluationRubric ? { evaluationRubric: parsed.evaluationRubric } : {}),
    },
    indexEntry,
  };
}

async function loadSplitChallenge(filePath: string): Promise<ChallengeLoadResult> {
  const parsed = challengeSplitMetaSchema.parse(await readJsonUnknown(filePath)) as ChallengeSplitMeta;
  const indexEntry = buildIndexEntryFromMeta(parsed);
  const hasCode = parsed.presentation === "code" || parsed.presentation === "code-terminal";
  const codeFileName = hasCode ? parsed.codeFile ?? "code.tsx" : undefined;
  const solutionFileName = parsed.solutionFile ?? parsed.expectedAnswerFile ?? "solution.md";
  const [code, solution, terminal] = await Promise.all([
    codeFileName
      ? readFile(path.resolve(path.dirname(filePath), codeFileName), "utf-8")
      : Promise.resolve(null),
    readFile(path.resolve(path.dirname(filePath), solutionFileName), "utf-8"),
    parsed.terminalFile
      ? readJsonUnknown(path.resolve(path.dirname(filePath), parsed.terminalFile))
          .then((artifact) => challengeTerminalArtifactSchema.parse(artifact))
      : Promise.resolve(undefined),
  ]);
  if (code !== null && code.trim().length === 0) {
    throw new Error(`Desafio inválido em ${filePath}: arquivo "${codeFileName}" vazio`);
  }
  if (solution.trim().length === 0) throw new Error(`Desafio inválido em ${filePath}: arquivo "${solutionFileName}" vazio`);
  const evaluationRubric = parsed.rubricFile
    ? challengeEvaluationRubricSchema.parse(
        await readJsonUnknown(path.resolve(path.dirname(filePath), parsed.rubricFile)),
      )
    : parsed.evaluationRubric;
  const evaluationCasesPath = path.resolve(
    path.dirname(filePath),
    parsed.evaluationCasesFile ?? "evaluation-cases.json",
  );
  const evaluationCases = await readOptionalJsonUnknown(evaluationCasesPath)
    .then((cases) => cases === undefined ? undefined : evaluationBenchmarkCasesSchema.parse(cases));

  return {
    challenge: {
      id: parsed.id,
      title: parsed.title,
      language: indexEntry.language,
      difficulty: parsed.difficulty,
      recommendedElo: parsed.recommendedElo,
      question: parsed.question,
      tags: parsed.tags,
      code,
      ...(codeFileName ? { codeFileName } : {}),
      solution,
      topic: indexEntry.topic,
      presentation: indexEntry.presentation,
      intent: indexEntry.intent,
      ...(parsed.scenario ? { scenario: parsed.scenario } : {}),
      ...(terminal ? { terminal } : {}),
      ...(evaluationRubric ? { evaluationRubric } : {}),
      ...(evaluationCases ? { evaluationCases } : {}),
    },
    indexEntry,
  };
}

function buildIndexEntryFromMeta(meta: {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  recommendedElo: number;
  tags: string[];
  language?: ChallengeIndexEntry["language"];
  topic?: string;
  presentation?: ChallengePresentation;
  intent?: ChallengeIntent;
  type?: string;
  estimatedTime?: number;
  status?: string;
}): ChallengeIndexEntry {
  const language = meta.language ?? inferLanguage(meta.tags);
  return {
    id: meta.id,
    title: meta.title,
    language,
    topic: meta.topic ?? inferChallengeTopic({ language, id: meta.id, title: meta.title, tags: meta.tags }),
    presentation: meta.presentation ?? "code",
    intent: meta.intent ?? "diagnose",
    difficulty: meta.difficulty,
    type: meta.type ?? "debugging",
    tags: meta.tags,
    estimatedTime: meta.estimatedTime ?? (meta.difficulty === "HARD" ? 18 : meta.difficulty === "MEDIUM" ? 12 : 8),
    recommendedElo: meta.recommendedElo,
    status: meta.status ?? "ACTIVE",
  };
}

function inferLanguage(tags: string[]): ChallengeIndexEntry["language"] {
  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.includes("react")) return "react";
  if (normalized.includes("typescript")) return "typescript";
  if (normalized.includes("java")) return "java";
  if (normalized.some((tag) => ["go", "golang"].includes(tag))) return "go";
  if (normalized.includes("python")) return "python";
  return "react";
}

async function readJsonUnknown(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf-8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`JSON inválido em ${filePath}`);
    throw error;
  }
}

async function readOptionalJsonUnknown(filePath: string): Promise<unknown | undefined> {
  try {
    await access(filePath);
  } catch {
    return undefined;
  }
  return readJsonUnknown(filePath);
}
