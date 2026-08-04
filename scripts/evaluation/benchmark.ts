import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "@kodan/env/server";
import { z } from "zod";

import { evaluateAnswer } from "../../apps/web/src/server/training/evaluation/evaluation-service";
import { resolveFreeOpenRouterModel } from "../../apps/web/src/server/training/evaluation/model-policy";
import { createOpenRouterEvaluator } from "../../apps/web/src/server/training/evaluation/openrouter-evaluator";
import { DEFAULT_EVALUATION_PROMPT_VERSION } from "../../apps/web/src/server/training/evaluation/prompt";
import { parseChallengeEvaluationRubric } from "../../apps/web/src/server/training/evaluation/schemas";
import { createRequestPacer } from "./request-pacer";

const evaluationCaseSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["accepted", "partial", "rejected", "adversarial"]),
  answer: z.string().min(1),
  expectedScore: z.object({ min: z.number().min(0), max: z.number().max(10) }),
  expectedStatus: z.enum(["SOLVED", "RETRY_AVAILABLE"]),
  expectedMatchedConceptIds: z.array(z.string()).optional(),
  forbiddenMatchedConceptIds: z.array(z.string()).optional(),
}).strict();

const evaluationCasesSchema = z.array(evaluationCaseSchema).min(1);
type EvaluationCase = z.infer<typeof evaluationCaseSchema>;

type BenchmarkRun = {
  caseId: string;
  category: EvaluationCase["category"];
  repetition: number;
  answer: string;
  expectedScore: EvaluationCase["expectedScore"];
  expectedStatus: EvaluationCase["expectedStatus"];
  actualScore?: number;
  actualStatus?: EvaluationCase["expectedStatus"];
  level?: string;
  summary?: string;
  conceptStates?: Record<string, string>;
  providerFailure?: { reason: string; retryable: boolean };
  providerDiagnostic?: unknown;
  divergences: string[];
  latencyMs?: number;
  requestId?: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const challengeDir = path.join(
  repoRoot,
  "content/challenges/react-state/race-condition-user-profile",
);
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
  .parse(args.get("retries") ?? "1");
const requestsPerMinute = z.coerce.number().int().min(1).max(20)
  .parse(args.get("rpm") ?? "18");
const model = resolveFreeOpenRouterModel(args.get("model") ?? env.OPENROUTER_MODEL);
const waitForRequestSlot = createRequestPacer({ requestsPerMinute });

const [challengeJson, code, rubricJson, casesJson] = await Promise.all([
  readFile(path.join(challengeDir, "challenge.json"), "utf8"),
  readFile(path.join(challengeDir, "code.tsx"), "utf8"),
  readFile(path.join(challengeDir, "rubric.json"), "utf8"),
  readFile(path.join(challengeDir, "evaluation-cases.json"), "utf8"),
]);
const challenge = z.object({ id: z.string(), title: z.string(), question: z.string() })
  .passthrough()
  .parse(JSON.parse(challengeJson));
const rubric = parseChallengeEvaluationRubric(rubricJson);
if (!rubric) throw new Error("Rubrica de benchmark inválida");
const allCases = evaluationCasesSchema.parse(JSON.parse(casesJson));
const requestedCaseId = args.get("case");
const cases = requestedCaseId
  ? allCases.filter((evaluationCase) => evaluationCase.id === requestedCaseId)
  : allCases;
if (cases.length === 0) throw new Error(`Caso de benchmark desconhecido: ${requestedCaseId}`);
const tasks = cases.flatMap((evaluationCase) =>
  Array.from({ length: repeat }, (_, index) => ({
    evaluationCase,
    repetition: index + 1,
  }))
);
const runs = new Array<BenchmarkRun>(tasks.length);
let nextTaskIndex = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (nextTaskIndex < tasks.length) {
      const taskIndex = nextTaskIndex;
      nextTaskIndex += 1;
      const task = tasks[taskIndex];
      if (!task) return;
      runs[taskIndex] = await runBenchmarkCase(task.evaluationCase, task.repetition);
    }
  }),
);

const generatedAt = new Date().toISOString();
const failedRuns = runs.filter((run) => run.divergences.length > 0);
const report = {
  generatedAt,
  challengeId: challenge.id,
  model,
  promptVersion: DEFAULT_EVALUATION_PROMPT_VERSION,
  rubricVersion: rubric.version,
  repeat,
  requestsPerMinute,
  summary: { total: runs.length, passed: runs.length - failedRuns.length, failed: failedRuns.length },
  runs,
};
const outputDir = path.join(repoRoot, "test-results/evaluation-benchmark");
await mkdir(outputDir, { recursive: true });
const stamp = generatedAt.replace(/[:.]/g, "-");
const jsonPath = path.join(outputDir, `${stamp}.json`);
const markdownPath = path.join(outputDir, `${stamp}.md`);
await Bun.write(jsonPath, JSON.stringify(report, null, 2));
await Bun.write(markdownPath, renderMarkdown(report));
console.log(`Relatório JSON: ${jsonPath}`);
console.log(`Relatório Markdown: ${markdownPath}`);
console.log(`Resultado: ${report.summary.passed}/${report.summary.total} dentro do esperado`);
if (failedRuns.length > 0) process.exitCode = 1;

async function runBenchmarkCase(
  evaluationCase: EvaluationCase,
  repetition: number,
): Promise<BenchmarkRun> {
  let providerDiagnostic: unknown;
  const evaluator = createOpenRouterEvaluator({
    apiKey: env.OPENROUTER_API_KEY,
    model,
    timeoutMs,
    maxRetries,
    fetchImplementation: async (input, init) => {
      await waitForRequestSlot();
      const response = await fetch(input, init);
      providerDiagnostic = await sanitizeProviderResponse(response.clone());
      return response;
    },
  });
  const result = await evaluateAnswer(evaluator, {
    challenge: { ...challenge, code },
    userAnswer: evaluationCase.answer,
    rubric,
  });
  if (!result.ok) {
    console.log(
      `ERROR ${evaluationCase.id} #${repetition}: ${result.reason} retryable=${result.retryable}`,
    );
    return {
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
    `${divergences.length === 0 ? "PASS" : "FAIL"} ${evaluationCase.id} #${repetition}: ${result.score.toFixed(1)} ${actualStatus}`,
  );
  return {
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
}

function findDivergences(
  evaluationCase: EvaluationCase,
  score: number,
  status: EvaluationCase["expectedStatus"],
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

function renderMarkdown(report: typeof report) {
  const rows = report.runs.map((run) => [
    run.divergences.length === 0 ? "PASS" : "FAIL",
    run.caseId,
    String(run.repetition),
    run.actualScore?.toFixed(1) ?? run.providerFailure?.reason ?? "-",
    run.actualStatus ?? "-",
    run.divergences.join("; ") || "-",
  ]);
  return [
    "# Benchmark real da avaliação Kodan",
    "",
    `- Gerado em: ${report.generatedAt}`,
    `- Modelo: ${report.model}`,
    `- Prompt: ${report.promptVersion}`,
    `- Rubrica: ${report.rubricVersion}`,
    `- Limite do runner: ${report.requestsPerMinute} requisições/minuto`,
    `- Resultado: ${report.summary.passed}/${report.summary.total}`,
    "",
    "| Resultado | Caso | Repetição | Nota/falha | Status | Divergências |",
    "|---|---|---:|---:|---|---|",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Respostas e classificações",
    "",
    ...report.runs.flatMap((run) => [
      `### ${run.caseId} #${run.repetition}`,
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
    ...(error
      ? { error: { code: error.code, message: error.message } }
      : {}),
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
          return { conceptId: value.conceptId, state: value.state, hasEvidence: Boolean(value.evidence) };
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
