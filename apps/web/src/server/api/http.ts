import { ZodError, type ZodSchema } from "zod";

type ApiFailure = {
  success: false;
  error: string;
  code?: "EVALUATION_UNAVAILABLE";
  reason?: string;
  retryable?: boolean;
  preserveAnswer?: boolean;
};

type ApiFailureDetails = Omit<ApiFailure, "success" | "error">;

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function jsonFailure(
  error: string,
  status = 400,
  details: ApiFailureDetails = {},
) {
  return Response.json({ success: false, error, ...details } satisfies ApiFailure, {
    status,
  });
}

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>) {
  try {
    const body = (await request.json()) as unknown;
    return { success: true as const, data: schema.parse(body) };
  } catch (error) {
    return {
      success: false as const,
      error: formatValidationError(error),
    };
  }
}

export function parseSearchParams<T>(request: Request, schema: ZodSchema<T>) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    return { success: true as const, data: schema.parse(params) };
  } catch (error) {
    return {
      success: false as const,
      error: formatValidationError(error),
    };
  }
}

function formatValidationError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
      .join("; ");
  }

  if (error instanceof SyntaxError) {
    return "JSON inválido";
  }

  return "Payload inválido";
}
