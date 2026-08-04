import { jsonFailure, jsonSuccess, parseJsonBody } from "@/server/api/http";
import { submitAttemptSchema } from "@/server/api/schemas";
import { submitChallengeAttempt } from "@/server/api/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return jsonFailure("ID do desafio é obrigatório", 400);
  }

  const parsed = await parseJsonBody(request, submitAttemptSchema);

  if (!parsed.success) {
    return jsonFailure(parsed.error, 400);
  }

  const result = await submitChallengeAttempt(id, parsed.data);

  if (!result.success || !result.data) {
    const error = result.error ?? "Erro ao enviar tentativa";
    const status = result.code === "EVALUATION_UNAVAILABLE"
      ? 503
      : error === "Unauthorized"
        ? 401
        : error === "Desafio não encontrado"
          ? 404
          : 500;
    return jsonFailure(error, status, result.code === "EVALUATION_UNAVAILABLE"
      ? {
          code: result.code,
          reason: result.reason,
          retryable: result.retryable,
          preserveAnswer: result.preserveAnswer,
        }
      : {});
  }

  return jsonSuccess(result.data, { status: 201 });
}
