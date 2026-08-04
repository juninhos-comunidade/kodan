type RequestPacerOptions = {
  requestsPerMinute: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export function createRequestPacer({
  requestsPerMinute,
  now = () => performance.now(),
  sleep = (milliseconds) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
}: RequestPacerOptions) {
  const minimumIntervalMs = 60_000 / requestsPerMinute;
  let nextAvailableAt = 0;

  return async function waitForRequestSlot() {
    const currentTime = now();
    const scheduledAt = Math.max(currentTime, nextAvailableAt);
    nextAvailableAt = scheduledAt + minimumIntervalMs;
    const waitMs = Math.ceil(scheduledAt - currentTime);
    if (waitMs > 0) await sleep(waitMs);
  };
}
