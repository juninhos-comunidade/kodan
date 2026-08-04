import type {
  AnswerEvaluator,
  EvaluationFailureReason,
  EvaluationProviderMetadata,
  EvaluatorResult,
} from "./types";
import {
  buildModelEvaluationJsonSchema,
  parseModelEvaluation,
} from "./schemas";
import {
  DEFAULT_EVALUATION_PROMPT_VERSION,
  EVALUATION_SYSTEM_PROMPT,
} from "./prompt";
import type { EvaluationTelemetry } from "./evaluation-telemetry";

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type OpenRouterEvaluatorDependencies = {
  apiKey: string | undefined;
  model: string;
  promptVersion?: string;
  timeoutMs?: number;
  maxRetries?: number;
  maxRetryDelayMs?: number;
  sleepImplementation?: (milliseconds: number) => Promise<void>;
  telemetry?: EvaluationTelemetry;
  fetchImplementation: FetchImplementation;
};

type ProviderRequestFailure = Extract<EvaluatorResult, { ok: false }> & {
  retryAfterMs?: number;
};

type OpenRouterResponse = {
  id?: string;
  choices?: Array<{ message?: { content?: string } }>;
};

export function createOpenRouterEvaluator(
  dependencies: OpenRouterEvaluatorDependencies,
): AnswerEvaluator {
  return {
    async evaluate(input) {
      if (!dependencies.apiKey) {
        return {
          ok: false,
          reason: "MISSING_CONFIGURATION",
          retryable: false,
        };
      }

      const startedAt = performance.now();
      const promptVersion = dependencies.promptVersion ??
        DEFAULT_EVALUATION_PROMPT_VERSION;
      const maxRetries = dependencies.maxRetries ?? 1;
      let requestBody = buildRequestBody(dependencies.model, input);

      for (let requestAttempt = 0; requestAttempt <= maxRetries; requestAttempt += 1) {
        const responseResult = await requestOpenRouter(dependencies, requestBody);
        if (!responseResult.ok) {
          if (responseResult.retryable && requestAttempt < maxRetries) {
            emitProviderTelemetry(dependencies, input, promptVersion, {
              name: "attempt_evaluation_retried",
              failureReason: responseResult.reason,
              retryable: true,
            });
            if (responseResult.retryAfterMs) {
              await (dependencies.sleepImplementation ?? sleep)(Math.min(
                responseResult.retryAfterMs,
                dependencies.maxRetryDelayMs ?? 1_000,
              ));
            }
            continue;
          }
          const { retryAfterMs: _retryAfterMs, ...failure } = responseResult;
          return failure;
        }
        const response = responseResult.response;

        let payload: OpenRouterResponse;
        try {
          payload = await response.json() as OpenRouterResponse;
        } catch {
          return providerFailure("INVALID_PROVIDER_RESPONSE", false);
        }
        const content = payload.choices?.[0]?.message?.content;
        if (!content) {
          return {
            ok: false,
            reason: "INVALID_PROVIDER_RESPONSE",
            retryable: false,
          };
        }

        const decodedEvaluation = decodeStructuredContent(content);
        if (!decodedEvaluation) {
          return {
            ok: false,
            reason: "INVALID_PROVIDER_RESPONSE",
            retryable: false,
          };
        }
        const evaluation = parseModelEvaluation(decodedEvaluation, input.rubric);
        if (!evaluation) {
          emitProviderTelemetry(dependencies, input, promptVersion, {
            name: "attempt_evaluation_schema_rejected",
            failureReason: "INVALID_EVALUATION",
            retryable: requestAttempt < maxRetries,
          });
          if (requestAttempt < maxRetries) {
            emitProviderTelemetry(dependencies, input, promptVersion, {
              name: "attempt_evaluation_retried",
              failureReason: "INVALID_EVALUATION",
              retryable: true,
            });
            requestBody = buildRequestBody(dependencies.model, input, true);
            continue;
          }
          return {
            ok: false,
            reason: "INVALID_EVALUATION",
            retryable: false,
          };
        }

        const metadata: EvaluationProviderMetadata = {
          mechanism: "OPENROUTER",
          model: dependencies.model,
          promptVersion,
          rubricVersion: input.rubric.version,
          ...(payload.id ? { requestId: payload.id } : {}),
          latencyMs: Math.round(performance.now() - startedAt),
        };
        return {
          ok: true,
          evaluation,
          metadata,
        };
      }

      return providerFailure("UNKNOWN_PROVIDER_ERROR", true);
    },
  };
}

function emitProviderTelemetry(
  dependencies: OpenRouterEvaluatorDependencies,
  input: Parameters<AnswerEvaluator["evaluate"]>[0],
  promptVersion: string,
  event: {
    name: "attempt_evaluation_retried" | "attempt_evaluation_schema_rejected";
    failureReason: EvaluationFailureReason;
    retryable: boolean;
  },
) {
  dependencies.telemetry?.({
    ...event,
    challengeId: input.challenge.id,
    attemptNumber: input.attemptNumber ?? 1,
    model: dependencies.model,
    promptVersion,
    rubricVersion: input.rubric.version,
  });
}

function buildRequestBody(
  model: string,
  input: Parameters<AnswerEvaluator["evaluate"]>[0],
  repairInvalidEvaluation = false,
) {
  return JSON.stringify({
    model,
    temperature: 0,
    stream: false,
    max_tokens: 2_400,
    reasoning: { effort: "low", exclude: true },
    provider: { require_parameters: true },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "kodan_answer_evaluation",
        strict: true,
        schema: buildModelEvaluationJsonSchema(input.rubric),
      },
    },
    messages: [
      {
        role: "system",
        content: EVALUATION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
      ...(repairInvalidEvaluation
        ? [{
            role: "user",
            content:
              "A resposta anterior violou o schema. Gere novamente somente o objeto de avaliacao solicitado, sem campos extras, sem schema e sem markdown.",
          }]
        : []),
    ],
  });
}

async function requestOpenRouter(
  dependencies: OpenRouterEvaluatorDependencies,
  body: string,
): Promise<
  | { ok: true; response: Response }
  | ProviderRequestFailure
> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    dependencies.timeoutMs ?? 12_000,
  );
  try {
    const response = await dependencies.fetchImplementation(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dependencies.apiKey}`,
        },
        body,
        signal: controller.signal,
      },
    );
    if (!response.ok) return classifyHttpFailure(response);
    return { ok: true, response };
  } catch (error) {
    if (controller.signal.aborted || isAbortError(error)) {
      return providerFailure("TIMEOUT", true);
    }
    return providerFailure("UNKNOWN_PROVIDER_ERROR", true);
  } finally {
    clearTimeout(timeout);
  }
}

function classifyHttpFailure(
  response: Response,
): ProviderRequestFailure {
  const status = response.status;
  if (status === 401 || status === 403) {
    return providerFailure("AUTHENTICATION", false);
  }
  if (status === 400) return providerFailure("INVALID_PROVIDER_RESPONSE", false);
  if (status === 402) return providerFailure("INSUFFICIENT_CREDITS", false);
  if (status === 408) return providerFailure("TIMEOUT", true);
  if (status === 404) return providerFailure("MODEL_UNAVAILABLE", false);
  if (status === 429) {
    return {
      ...providerFailure("RATE_LIMIT", true),
      ...readRetryAfter(response),
    };
  }
  if (status === 502 || status === 503 || status === 504) {
    return providerFailure("MODEL_UNAVAILABLE", true);
  }
  return providerFailure("UNKNOWN_PROVIDER_ERROR", status >= 500);
}

function providerFailure(
  reason: EvaluationFailureReason,
  retryable: boolean,
): Extract<EvaluatorResult, { ok: false }> {
  return { ok: false, reason, retryable };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function readRetryAfter(response: Response) {
  const rawValue = response.headers.get("Retry-After");
  if (!rawValue) return {};
  const seconds = Number(rawValue);
  if (Number.isFinite(seconds) && seconds > 0) {
    return { retryAfterMs: Math.round(seconds * 1_000) };
  }
  const retryAt = Date.parse(rawValue);
  const retryAfterMs = retryAt - Date.now();
  return Number.isFinite(retryAfterMs) && retryAfterMs > 0
    ? { retryAfterMs }
    : {};
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function decodeStructuredContent(content: string): unknown | null {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    const fencedJson = content.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/i)?.[1];
    if (!fencedJson) return null;
    try {
      return JSON.parse(fencedJson) as unknown;
    } catch {
      return null;
    }
  }
}
