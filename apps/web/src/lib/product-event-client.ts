import type { ProductEventInput } from "@/server/training/product-event-store";

export const ACTIVATION_DAY_STORAGE_KEY = "kodan:activation-day";

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export async function sendProductEvent(
  event: ProductEventInput,
  fetchImplementation: FetchImplementation = fetch,
) {
  const response = await fetchImplementation("/api/product-events", {
    method: "POST",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error("Não foi possível registrar o evento");
}

export function getActiveDayBucket(
  activationDay: string,
  now: Date,
): "D1" | "D2_TO_D6" | "D7_PLUS" | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activationDay)) return null;
  const activationTimestamp = Date.parse(`${activationDay}T00:00:00.000Z`);
  if (!Number.isFinite(activationTimestamp)) return null;
  if (toUtcDateKey(new Date(activationTimestamp)) !== activationDay) return null;

  const currentDayTimestamp = Date.parse(`${toUtcDateKey(now)}T00:00:00.000Z`);
  const elapsedDays = Math.floor(
    (currentDayTimestamp - activationTimestamp) / 86_400_000,
  );
  if (elapsedDays <= 0) return null;
  if (elapsedDays === 1) return "D1";
  if (elapsedDays < 7) return "D2_TO_D6";
  return "D7_PLUS";
}

export function toUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
