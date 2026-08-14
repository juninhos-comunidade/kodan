import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "@kodan/env/server";
import { z } from "zod";

import {
  challengeLanguageSchema,
  type EvaluationBenchmarkCase,
} from "../../packages/content/src/challenge-schemas";
import {
  readPromotedChallengeCatalog,
} from "../../packages/content/src/promoted-challenge-catalog";
import { evaluateAnswer } from "../../apps/web/src/server/training/evaluation/evaluation-service";
import { resolveFreeOpenRouterModel } from "../../apps/web/src/server/training/evaluation/model-policy";
import { createOpenRouterEvaluator } from "../../apps/web/src/server/training/evaluation/openrouter-evaluator";
import { DEFAULT_EVALUATION_PROMPT_VERSION } from "../../apps/web/src/server/training/evaluation/prompt";
import { createRequestPacer } from "./request-pacer";
import {
  createBenchmarkBudgetController,
  createBenchmarkCacheKey,
  parseBenchmarkDailyBudget,
} from "./benchmark-budget";
import {
  selectLanguagePilot,
  selectRepresentativeCases,
  type BenchmarkChallenge,
} from "./benchmark-selection";

type BenchmarkRun = {
  challengeId: string;
  rubricVersion: string;
  caseId: string;
  category: EvaluationBenchmarkCase["category"];
  repetition: number;
  answer: string;
  expectedScore: EvaluationBenchmarkCase["expectedScore"];
  expectedStatus: EvaluationBenchmarkCase["expectedStatus"];
  actualScore?: number;
  actualStatus?: EvaluationBenchmarkCase["expectedStatus"];
  level?: string;
  summary?: string;
  conceptStates?: Record<string, string>;
  providerFailure?: { reason: string; retryable: boolean };
  providerDiagnostic?: unknown;
  divergences: string[];
  latencyMs?: number;
  requestId?: string;
  cacheHit?: boolean;
};

type BenchmarkTask = {
  challenge: BenchmarkChallenge;
  evaluationCase: EvaluationBenchmarkCase;
  repetition: number;
  cacheKey: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, "").split("=");
    return [key, value.join("=") || "true"];
  }),
);
const repeat = z.coerce.number().int().min(1).max(3).parse(args.get("repeat") ?? "1");
const timeoutMs = z.coerce.number().int().min(1_000).max(60_000)
  .parse(args.get("timeout") ?? "30000");
const concurrency = z.coerce.number().int().min(1).max(5)
  .parse(args.get("concurrency") ?? "1");
const maxRetries = z.coerce.number().int().min(0).max(1)
  .parse(args.get("retries") ?? "0");
const requestsPerMinute = z.coerce.number().int().min(1).max(20)
  .parse(args.get("rpm") ?? "18");
const dailyBudget = parseBenchmarkDailyBudget(args.get("daily-budget"));
const model = resolveFreeOpenRouterModel(args.get("model") ?? env.OPENROUTER_MODEL);
const waitForRequestSlot = createRequestPacer({ requestsPerMinute });
const budget = createBenchmarkBudgetController({
  stateDirectory: path.join(repoRoot, ".cache/kodan/evaluation-benchmark"),
  dailyBudget,
});

const catalog = await readPromotedChallengeCatalog({
  root: path.join(repoRoot, "content/challenges"),
});
const requestedChallengeId = args.get("challenge");
const requestedLanguage = args.get("language")
  ? challengeLanguageSchema.parse(args.get("language"))
  : requestedChallengeId
    ? catalog.challenges.find((challenge) => challenge.id === requestedChallengeId)?.language
    : "react";
if (!requestedLanguage) {
  throw new Error(`Desafio desconhecido: ${requestedChallengeId}`);
}
const selectedChallenges = selectLanguagePilot({
  challenges: catalog.challenges,
  language: requestedLanguage,
  ...(requestedChallengeId ? { requestedChallengeId } : {}),
});
const requestedCaseId = args.get("case");
if (requestedCaseId && selectedChallenges.length !== 1) {
  throw new Error("Use --case junto com --challenge para executar um caso isolado.");
}

const tasks: BenchmarkTask[] = selectedChallenges.flatMap((challenge) => {
  const representativeCases = selectRepresentativeCases(challenge.evaluationCases);
  const cases = requestedCaseId
    ? challenge.evaluationCases.filter((evaluationCase) => evaluationCase.id === requestedCaseId)
    : representativeCases;
  if (cases.length === 0) {
    throw new Error(`Caso de benchmark desconhecido em ${challenge.id}: ${requestedCaseId}`);
  }
  const evaluationChallenge = toEvaluationChallenge(challenge);
  return cases.flatMap((evaluationCase) =>
    Array.from({ length: repeat }, (_, index) => {
      const repetition = index + 1;
      return {
        challenge,
        evaluationCase,
        repetition,
        cacheKey: createBenchmarkCacheKey({
          challengeId: challenge.id,
          challengeContent: evaluationChallenge,
          caseId: evaluationCase.id,
          repetition,
          answer: evaluationCase.answer,
          model,
          promptVersion: DEFAULT_EVALUATION_PROMPT_VERSION,
          rubricVersion: challenge.evaluationRubric.version,
          rubric: challenge.evaluationRubric,
          expectation: {
            expectedScore: evaluationCase.expectedScore,
            expectedStatus: evaluationCase.expectedStatus,
            expectedMatchedConceptIds: evaluationCase.expectedMatchedConceptIds,
            forbiddenMatchedConceptIds: evaluationCase.forbiddenMatchedConceptIds,
          },
        }),
      };
    })
  );
});

const preparedTasks = await Promise.all(tasks.map(async (task) => ({
  ...task,
  cachedRun: await budget.readApprovedCache<BenchmarkRun>(task.cacheKey),
})));
const uncachedTaskCount = preparedTasks.filter((task) => !task.cachedRun).length;
const plannedRequestCeiling = uncachedTaskCount * (maxRetries + 1);
const initialBudget = await budget.assertCanSchedule(plannedRequestCeiling);
console.log(
  `Piloto ${requestedLanguage}: ${selectedChallenges.length} desafio(s), ${tasks.length} execução(ões).`,
);
console.log(
  `Orçamento local: ${initialBudget.used}/${initialBudget.dailyBudget} usado; até ${plannedRequestCeiling} chamadas planejadas; ${preparedTasks.length - uncachedTaskCount} resultados em cache.`,
);
console.log("Observação: o ledger local não contabiliza chamadas feitas fora deste repositório.");

const runs = new Array<BenchmarkRun>(tasks.length);
let nextTaskIndex = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, preparedTasks.length) }, async () => {
    while (nextTaskIndex < preparedTasks.length) {
      const taskIndex = nextTaskIndex;
      nextTaskIndex += 1;
      const task = preparedTasks[taskIndex];
      if (!task) return;
      runs[taskIndex] = task.cachedRun
        ? { ...task.cachedRun, cacheHit: true }
        : await runBenchmarkCase(task);
    }
  }),
);

const generatedAt = new Date().toISOString();
const failedRuns = runs.filter((run) => run.divergences.length > 0);
const finalBudget = await budget.getSnapshot();
const report = {
  generatedAt,
  language: requestedLanguage,
  challengeIds: selectedChallenges.map((challenge) => challenge.id),
  model,
  promptVersion: DEFAULT_EVALUATION_PROMPT_VERSION,
  rubricVersions: Object.fromEntries(
    selectedChallenges.map((challenge) => [challenge.id, challenge.evaluationRubric.version]),
  ),
  repeat,
  requestsPerMinute,
  dailyBudget,
  budget: finalBudget,
  cacheHits: runs.filter((run) => run.cacheHit).length,
  summary: {
    total: runs.length,
    passed: runs.length - failedRuns.length,
    failed: failedRuns.length,
  },
  runs,
};
const outputDir = path.join(repoRoot, "test-results/evaluation-benchmark");
await mkdir(outputDir, { recursive: true });
const stamp = generatedAt.replace(/[:.]/g, "-");
const jsonPath = path.join(outputDir, `${stamp}.json`);
const markdownPath = path.join(outputDir, `${stamp}.md`);
await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf-8");
await writeFile(markdownPath, renderMarkdown(report), "utf-8");
console.log(`Relatório JSON: ${jsonPath}`);
console.log(`Relatório Markdown: ${markdownPath}`);
console.log(`Resultado: ${report.summary.passed}/${report.summary.total} dentro do esperado`);
if (failedRuns.length > 0) process.exitCode = 1;

async function runBenchmarkCase(task: BenchmarkTask): Promise<BenchmarkRun> {
  const { challenge, evaluationCase, repetition, cacheKey } = task;
  let providerDiagnostic: unknown;
  const evaluator = createOpenRouterEvaluator({
    apiKey: env.OPENROUTER_API_KEY,
    model,
    timeoutMs,
    maxRetries,
    fetchImplementation: async (input, init) => {
      try {
        await budget.consumeRequest();
      } catch (error) {
        providerDiagnostic = {
          localBudget: "exhausted",
          message: error instanceof Error ? error.message : "Orçamento local esgotado",
        };
        return new Response(JSON.stringify({
          error: { code: 429, message: "Orçamento diário local do benchmark esgotado" },
        }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }
      await waitForRequestSlot();
      const response = await fetch(input, init);
      providerDiagnostic = await sanitizeProviderResponse(response.clone());
      return response;
    },
  });
  const result = await evaluateAnswer(evaluator, {
    challenge: toEvaluationChallenge(challenge),
    userAnswer: evaluationCase.answer,
    rubric: challenge.evaluationRubric,
  });
  if (!result.ok) {
    console.log(
      `ERROR ${challenge.id}/${evaluationCase.id} #${repetition}: ${result.reason} retryable=${result.retryable}`,
    );
    return {
      challengeId: challenge.id,
      rubricVersion: challenge.evaluationRubric.version,
      caseId: evaluationCase.id,
      category: evaluationCase.category,
      repetition,
      answer: evaluationCase.answer,
      expectedScore: evaluationCase.expectedScore,
      expectedStatus: evaluationCase.expectedStatus,
      providerFailure: { reason: result.reason, retryable: result.retryable },
      providerDiagnostic,
      divergences: [`provider:${result.reason}`],
    };
  }

  const actualStatus = result.passed ? "SOLVED" : "RETRY_AVAILABLE";
  const conceptStates = Object.fromEntries(
    result.evaluation.conceptAssessments.map((assessment) => [
      assessment.conceptId,
      assessment.state,
    ]),
  );
  const divergences = findDivergences(evaluationCase, result.score, actualStatus, conceptStates);
  console.log(
    `${divergences.length === 0 ? "PASS" : "FAIL"} ${challenge.id}/${evaluationCase.id} #${repetition}: ${result.score.toFixed(1)} ${actualStatus}`,
  );
  const run: BenchmarkRun = {
    challengeId: challenge.id,
    rubricVersion: challenge.evaluationRubric.version,
    caseId: evaluationCase.id,
    category: evaluationCase.category,
    repetition,
    answer: evaluationCase.answer,
    expectedScore: evaluationCase.expectedScore,
    expectedStatus: evaluationCase.expectedStatus,
    actualScore: result.score,
    actualStatus,
    level: result.publicFeedback.level,
    summary: result.publicFeedback.summary,
    conceptStates,
    divergences,
    latencyMs: result.metadata.latencyMs,
    ...(result.metadata.requestId ? { requestId: result.metadata.requestId } : {}),
  };
  if (run.divergences.length === 0) {
    await budget.writeApprovedCache(cacheKey, run);
  }
  return run;
}

function toEvaluationChallenge(challenge: BenchmarkChallenge) {
  return {
    id: challenge.id,
    title: challenge.title,
    question: challenge.question,
    code: challenge.code,
    scenario: challenge.scenario ?? null,
    presentation: challenge.presentation,
    terminal: challenge.terminal ?? null,
  };
}

function findDivergences(
  evaluationCase: EvaluationBenchmarkCase,
  score: number,
  status: EvaluationBenchmarkCase["expectedStatus"],
  conceptStates: Record<string, string>,
) {
  const divergences: string[] = [];
  if (score < evaluationCase.expectedScore.min || score > evaluationCase.expectedScore.max) {
    divergences.push(
      `score:${score} fora de ${evaluationCase.expectedScore.min}-${evaluationCase.expectedScore.max}`,
    );
  }
  if (status !== evaluationCase.expectedStatus) {
    divergences.push(`status:${status} esperado ${evaluationCase.expectedStatus}`);
  }
  for (const conceptId of evaluationCase.expectedMatchedConceptIds ?? []) {
    if (conceptStates[conceptId] !== "MATCHED") {
      divergences.push(`conceito:${conceptId} esperado MATCHED, recebido ${conceptStates[conceptId]}`);
    }
  }
  for (const conceptId of evaluationCase.forbiddenMatchedConceptIds ?? []) {
    if (conceptStates[conceptId] === "MATCHED") {
      divergences.push(`conceito:${conceptId} não poderia estar MATCHED`);
    }
  }
  return divergences;
}

type BenchmarkReport = typeof report;

function renderMarkdown(benchmarkReport: BenchmarkReport) {
  const rows = benchmarkReport.runs.map((run) => [
    run.divergences.length === 0 ? "PASS" : "FAIL",
    run.challengeId,
    run.caseId,
    String(run.repetition),
    run.actualScore?.toFixed(1) ?? run.providerFailure?.reason ?? "-",
    run.actualStatus ?? "-",
    run.divergences.join("; ") || "-",
  ]);
  return [
    "# Benchmark real da avaliação Kodan",
    "",
    `- Gerado em: ${benchmarkReport.generatedAt}`,
    `- Linguagem: ${benchmarkReport.language}`,
    `- Desafios: ${benchmarkReport.challengeIds.join(", ")}`,
    `- Modelo: ${benchmarkReport.model}`,
    `- Prompt: ${benchmarkReport.promptVersion}`,
    `- Rubricas: ${JSON.stringify(benchmarkReport.rubricVersions)}`,
    `- Limite do runner: ${benchmarkReport.requestsPerMinute} requisições/minuto`,
    `- Orçamento diário local: ${benchmarkReport.budget.used}/${benchmarkReport.dailyBudget} chamadas usadas`,
    `- Resultados reutilizados do cache aprovado: ${benchmarkReport.cacheHits}`,
    "- Cobertura do ledger: somente chamadas feitas por este runner neste repositório",
    `- Resultado: ${benchmarkReport.summary.passed}/${benchmarkReport.summary.total}`,
    "",
    "| Resultado | Desafio | Caso | Repetição | Nota/falha | Status | Divergências |",
    "|---|---|---|---:|---:|---|---|",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Respostas e classificações",
    "",
    ...benchmarkReport.runs.flatMap((run) => [
      `### ${run.challengeId} / ${run.caseId} #${run.repetition}`,
      "",
      `> ${run.answer}`,
      "",
      `- Nota: ${run.actualScore?.toFixed(1) ?? "indisponível"}`,
      `- Status: ${run.actualStatus ?? run.providerFailure?.reason ?? "indisponível"}`,
      `- Nível: ${run.level ?? "-"}`,
      `- Resumo público: ${run.summary ?? "-"}`,
      `- Conceitos: ${JSON.stringify(run.conceptStates ?? {})}`,
      `- Divergências: ${run.divergences.join("; ") || "nenhuma"}`,
      ...(run.providerDiagnostic
        ? [`- Diagnóstico do provider: \`${JSON.stringify(run.providerDiagnostic)}\``]
        : []),
      "",
    ]),
  ].join("\n");
}

async function sanitizeProviderResponse(response: Response) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: response.status, body: "non-json" };
  }
  if (!payload || typeof payload !== "object") return { status: response.status };
  const record = payload as Record<string, unknown>;
  const error = record.error && typeof record.error === "object"
    ? record.error as Record<string, unknown>
    : undefined;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = choices[0] && typeof choices[0] === "object"
    ? choices[0] as Record<string, unknown>
    : undefined;
  const message = firstChoice?.message && typeof firstChoice.message === "object"
    ? firstChoice.message as Record<string, unknown>
    : undefined;
  return {
    status: response.status,
    ...(error ? { error: { code: error.code, message: error.message } } : {}),
    ...(firstChoice
      ? {
          finishReason: firstChoice.finish_reason,
          messageKeys: message ? Object.keys(message) : [],
          content: sanitizeEvaluationContent(message?.content),
        }
      : {}),
  };
}

function sanitizeEvaluationContent(content: unknown) {
  if (typeof content !== "string") return { type: typeof content };
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const assessments = Array.isArray(parsed.conceptAssessments)
      ? parsed.conceptAssessments.map((assessment) => {
          const value = assessment && typeof assessment === "object"
            ? assessment as Record<string, unknown>
            : {};
          return {
            conceptId: value.conceptId,
            state: value.state,
            hasEvidence: Boolean(value.evidence),
          };
        })
      : undefined;
    return {
      type: "json",
      keys: Object.keys(parsed),
      status: parsed.status,
      centralCorrectness: parsed.centralCorrectness,
      technicalReasoning: parsed.technicalReasoning,
      technicalPrecision: parsed.technicalPrecision,
      conceptAssessments: assessments,
      misconceptionIds: parsed.misconceptionIds,
      hasDecisionRationale: Boolean(parsed.decisionRationale),
    };
  } catch {
    return { type: "text", length: content.length, preview: content.slice(0, 120) };
  }
}
