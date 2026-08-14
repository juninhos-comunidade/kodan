import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  DEFAULT_BENCHMARK_DAILY_BUDGET,
  FREE_OPENROUTER_DAILY_LIMIT,
  createBenchmarkBudgetController,
  createBenchmarkCacheKey,
  parseBenchmarkDailyBudget,
} from "./benchmark-budget";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "kodan-benchmark-budget-"));
  roots.push(root);
  return root;
}

describe("orçamento diário do benchmark", () => {
  test("reserva vinte chamadas do limite gratuito por padrão", () => {
    expect(FREE_OPENROUTER_DAILY_LIMIT).toBe(50);
    expect(DEFAULT_BENCHMARK_DAILY_BUDGET).toBe(30);
    expect(parseBenchmarkDailyBudget(undefined)).toBe(30);
    expect(() => parseBenchmarkDailyBudget("51")).toThrow("não pode superar 50");
  });

  test("recusa o lote inteiro antes da primeira chamada quando não há orçamento", async () => {
    const controller = createBenchmarkBudgetController({
      stateDirectory: await createRoot(),
      dailyBudget: 3,
      now: () => new Date("2026-08-14T12:00:00.000Z"),
    });
    await controller.consumeRequest();

    await expect(controller.assertCanSchedule(3)).rejects.toThrow(
      "2 chamadas restantes",
    );
    expect((await controller.getSnapshot()).used).toBe(1);
  });

  test("persiste o consumo e abre um novo contador no dia seguinte", async () => {
    const stateDirectory = await createRoot();
    let now = new Date("2026-08-14T12:00:00.000Z");
    const controller = createBenchmarkBudgetController({
      stateDirectory,
      dailyBudget: 3,
      now: () => now,
    });
    await controller.consumeRequest();
    await controller.consumeRequest();

    const sameDay = createBenchmarkBudgetController({
      stateDirectory,
      dailyBudget: 3,
      now: () => now,
    });
    expect(await sameDay.getSnapshot()).toMatchObject({ used: 2, remaining: 1 });

    now = new Date("2026-08-15T01:00:00.000Z");
    expect(await sameDay.getSnapshot()).toMatchObject({ used: 0, remaining: 3 });
  });

  test("reutiliza cache aprovado sem consumir uma nova chamada", async () => {
    const controller = createBenchmarkBudgetController({
      stateDirectory: await createRoot(),
      dailyBudget: 3,
      now: () => new Date("2026-08-14T12:00:00.000Z"),
    });
    const cacheKey = createBenchmarkCacheKey({
      challengeId: "react-state",
      challengeContent: { question: "Por que o estado fica obsoleto?" },
      caseId: "accepted",
      repetition: 1,
      answer: "A atualização funcional evita o valor obsoleto.",
      model: "openrouter/free",
      promptVersion: "1.0.0",
      rubricVersion: "1.0.0",
      rubric: { centralAnswer: "A atualização funcional evita o valor obsoleto." },
    });
    await controller.writeApprovedCache(cacheKey, { score: 9 });

    expect(await controller.readApprovedCache<{ score: number }>(cacheKey)).toEqual({ score: 9 });
    expect((await controller.getSnapshot()).used).toBe(0);
    expect(createBenchmarkCacheKey({
      challengeId: "react-state",
      challengeContent: { question: "Por que o estado fica obsoleto?" },
      caseId: "accepted",
      repetition: 1,
      answer: "Outra resposta.",
      model: "openrouter/free",
      promptVersion: "1.0.0",
      rubricVersion: "1.0.0",
      rubric: { centralAnswer: "A atualização funcional evita o valor obsoleto." },
    })).not.toBe(cacheKey);
  });

  test("invalida o cache quando qualquer conteúdo editorial muda", () => {
    const base = {
      challengeId: "go-output",
      challengeContent: {
        question: "Explique a saída.",
        scenario: "Um teste falhou.",
        code: "fmt.Println(value)",
        terminal: { command: "go test", blocks: [] },
      },
      caseId: "accepted",
      repetition: 1,
      answer: "A saída diverge por causa do valor capturado.",
      model: "openrouter/free",
      promptVersion: "1.0.0",
      rubricVersion: "1.0.0",
      rubric: { centralAnswer: "O valor capturado está obsoleto." },
    };

    const original = createBenchmarkCacheKey(base);
    expect(createBenchmarkCacheKey({
      ...base,
      challengeContent: { ...base.challengeContent, question: "O código está correto?" },
    })).not.toBe(original);
    expect(createBenchmarkCacheKey({
      ...base,
      rubric: { centralAnswer: "A ordem de execução mudou." },
    })).not.toBe(original);
  });
});
