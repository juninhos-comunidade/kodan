import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const FREE_OPENROUTER_DAILY_LIMIT = 50;
export const DEFAULT_BENCHMARK_DAILY_BUDGET = 30;

type BudgetSnapshot = {
  date: string;
  dailyBudget: number;
  used: number;
  remaining: number;
};

type CacheKeyInput = {
  challengeId: string;
  challengeContent: unknown;
  caseId: string;
  repetition: number;
  answer: string;
  model: string;
  promptVersion: string;
  rubricVersion: string;
  rubric: unknown;
  expectation?: unknown;
};

export function parseBenchmarkDailyBudget(value: string | undefined) {
  const parsed = Number(value ?? DEFAULT_BENCHMARK_DAILY_BUDGET);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("O orçamento diário do benchmark deve ser um inteiro positivo.");
  }
  if (parsed > FREE_OPENROUTER_DAILY_LIMIT) {
    throw new Error(`O orçamento diário não pode superar ${FREE_OPENROUTER_DAILY_LIMIT} chamadas.`);
  }
  return parsed;
}

export function createBenchmarkCacheKey(input: CacheKeyInput) {
  return createHash("sha256")
    .update(JSON.stringify({ version: 2, ...input }))
    .digest("hex");
}

export function createBenchmarkBudgetController({
  stateDirectory,
  dailyBudget,
  now = () => new Date(),
}: {
  stateDirectory: string;
  dailyBudget: number;
  now?: () => Date;
}) {
  if (!Number.isInteger(dailyBudget) || dailyBudget < 1 || dailyBudget > FREE_OPENROUTER_DAILY_LIMIT) {
    throw new Error(`Orçamento diário inválido: use um valor entre 1 e ${FREE_OPENROUTER_DAILY_LIMIT}.`);
  }
  const ledgerPath = path.join(stateDirectory, "ledger.json");
  const cacheDirectory = path.join(stateDirectory, "approved-cache");
  let queue = Promise.resolve();

  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };

  const getSnapshot = () => serialize(async (): Promise<BudgetSnapshot> => {
    const date = getUtcDate(now);
    const ledger = await readLedger(ledgerPath, date);
    return snapshot(date, dailyBudget, ledger.used);
  });

  return {
    getSnapshot,
    async assertCanSchedule(plannedRequests: number) {
      if (!Number.isInteger(plannedRequests) || plannedRequests < 0) {
        throw new Error("Quantidade planejada de chamadas inválida.");
      }
      const current = await getSnapshot();
      if (plannedRequests > current.remaining) {
        throw new Error(
          `Benchmark cancelado antes da rede: ${plannedRequests} chamadas planejadas e ${current.remaining} chamadas restantes no orçamento local de hoje.`,
        );
      }
      return current;
    },
    consumeRequest() {
      return serialize(async () => {
        const date = getUtcDate(now);
        const ledger = await readLedger(ledgerPath, date);
        if (ledger.used >= dailyBudget) {
          throw new Error(
            `Orçamento local do benchmark esgotado: ${ledger.used}/${dailyBudget} chamadas em ${date}.`,
          );
        }
        const used = ledger.used + 1;
        await writeJsonAtomically(ledgerPath, { version: 1, date, used });
        return snapshot(date, dailyBudget, used);
      });
    },
    async readApprovedCache<T>(cacheKey: string): Promise<T | null> {
      try {
        const raw = JSON.parse(
          await readFile(path.join(cacheDirectory, `${cacheKey}.json`), "utf-8"),
        ) as { version?: unknown; approved?: unknown; value?: unknown };
        return raw.version === 1 && raw.approved === true
          ? raw.value as T
          : null;
      } catch {
        return null;
      }
    },
    async writeApprovedCache<T>(cacheKey: string, value: T) {
      await writeJsonAtomically(
        path.join(cacheDirectory, `${cacheKey}.json`),
        { version: 1, approved: true, savedAt: now().toISOString(), value },
      );
    },
  };
}

async function readLedger(ledgerPath: string, date: string) {
  try {
    const parsed = JSON.parse(await readFile(ledgerPath, "utf-8")) as {
      version?: unknown;
      date?: unknown;
      used?: unknown;
    };
    if (
      parsed.version === 1 &&
      parsed.date === date &&
      typeof parsed.used === "number" &&
      Number.isInteger(parsed.used) &&
      parsed.used >= 0
    ) {
      return { used: parsed.used };
    }
  } catch {
    // A ausência do ledger significa que nenhuma chamada foi registrada hoje.
  }
  return { used: 0 };
}

async function writeJsonAtomically(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
  await rename(temporaryPath, filePath);
}

function getUtcDate(now: () => Date) {
  return now().toISOString().slice(0, 10);
}

function snapshot(date: string, dailyBudget: number, used: number): BudgetSnapshot {
  return {
    date,
    dailyBudget,
    used,
    remaining: Math.max(0, dailyBudget - used),
  };
}
