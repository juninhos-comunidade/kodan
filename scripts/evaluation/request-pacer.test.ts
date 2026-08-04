import { describe, expect, mock, test } from "bun:test";

import { createRequestPacer } from "./request-pacer";

describe("createRequestPacer", () => {
  test("espaca chamadas concorrentes abaixo do limite por minuto", async () => {
    const sleep = mock(async (_milliseconds: number) => undefined);
    const waitForSlot = createRequestPacer({
      requestsPerMinute: 20,
      now: () => 1_000,
      sleep,
    });

    await Promise.all([waitForSlot(), waitForSlot(), waitForSlot()]);

    expect(sleep.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([
      3_000,
      6_000,
    ]);
  });
});
