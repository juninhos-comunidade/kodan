import { EvaluationUnavailableError } from "./errors";

export const DEFAULT_FREE_OPENROUTER_MODEL =
  "google/gemma-4-26b-a4b-it:free";

export function resolveFreeOpenRouterModel(configuredModel: string | undefined) {
  const model = configuredModel ?? DEFAULT_FREE_OPENROUTER_MODEL;
  if (model === "openrouter/free" || !model.endsWith(":free")) {
    throw new EvaluationUnavailableError("MISSING_CONFIGURATION", false);
  }
  return model;
}
