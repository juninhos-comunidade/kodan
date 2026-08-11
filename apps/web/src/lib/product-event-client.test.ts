import { describe, expect, mock, test } from "bun:test";

import { getActiveDayBucket, sendProductEvent } from "./product-event-client";

describe("getActiveDayBucket", () => {
  test("não trata o mesmo dia da ativação como retenção", () => {
    expect(getActiveDayBucket("2026-08-08", new Date("2026-08-08T23:00:00Z")))
      .toBeNull();
  });

  test("separa retorno D1, dias intermediários e D7+", () => {
    expect(getActiveDayBucket("2026-08-08", new Date("2026-08-09T12:00:00Z")))
      .toBe("D1");
    expect(getActiveDayBucket("2026-08-08", new Date("2026-08-12T12:00:00Z")))
      .toBe("D2_TO_D6");
    expect(getActiveDayBucket("2026-08-08", new Date("2026-08-15T12:00:00Z")))
      .toBe("D7_PLUS");
  });

  test("ignora datas inválidas ou futuras", () => {
    expect(getActiveDayBucket("not-a-date", new Date("2026-08-09T12:00:00Z")))
      .toBeNull();
    expect(getActiveDayBucket("2026-08-10", new Date("2026-08-09T12:00:00Z")))
      .toBeNull();
  });
});

describe("sendProductEvent", () => {
  test("envia somente o evento agregado ao endpoint público", async () => {
    const fetchImplementation = mock(async () => new Response(null, { status: 204 }));

    await sendProductEvent(
      { name: "challenge_viewed", challengeId: "challenge-1" },
      fetchImplementation,
    );

    expect(fetchImplementation).toHaveBeenCalledWith("/api/product-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "challenge_viewed",
        challengeId: "challenge-1",
      }),
    });
  });
});
