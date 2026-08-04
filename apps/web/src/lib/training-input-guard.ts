export const MAX_TRAINING_ANSWER_LENGTH = 10_000;

export type TrainingAnswerValidation =
  | { valid: true }
  | { valid: false; error: string };

export function validateTrainingAnswer(
  answer: string,
): TrainingAnswerValidation {
  if (!answer.trim()) {
    return { valid: false, error: "Escreva uma resposta antes de enviar." };
  }
  if (answer.length > MAX_TRAINING_ANSWER_LENGTH) {
    return {
      valid: false,
      error: `A resposta deve ter no máximo ${MAX_TRAINING_ANSWER_LENGTH} caracteres.`,
    };
  }
  if (!/[\p{L}\p{N}]/u.test(answer)) {
    return {
      valid: false,
      error: "A resposta precisa conter ao menos uma letra ou número.",
    };
  }
  if (/(.)\1{79,}/u.test(answer)) {
    return {
      valid: false,
      error: "A resposta contém uma repetição excessiva do mesmo caractere.",
    };
  }
  return { valid: true };
}
