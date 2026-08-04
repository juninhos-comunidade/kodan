import type { EvaluationFailureReason } from "./types";

export class EvaluationUnavailableError extends Error {
  readonly code = "EVALUATION_UNAVAILABLE";
  readonly preserveAnswer = true;

  constructor(
    readonly reason: EvaluationFailureReason,
    readonly retryable: boolean,
  ) {
    super(userMessageForReason(reason));
    this.name = "EvaluationUnavailableError";
  }
}

function userMessageForReason(reason: EvaluationFailureReason) {
  if (reason === "MISSING_RUBRIC") {
    return "Este desafio ainda nao possui uma rubrica de avaliacao valida.";
  }
  if (reason === "MISSING_CONFIGURATION") {
    return "A avaliacao automatica ainda nao esta configurada.";
  }
  return "Nao foi possivel avaliar sua resposta agora. Sua resposta foi preservada; tente novamente.";
}
