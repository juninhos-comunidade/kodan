import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { currentTrainingAdapter as trainingAdapter } from "@/server/training/current-training-adapter";
import type {
  AttemptAdapter,
  ChallengeCatalogAdapter,
  PractitionerAdapter,
  ProductTelemetryAdapter,
  SessionAgeBucket,
} from "@/server/training/training-adapter";
import type { ProductEventInput } from "@/server/training/product-event-store";
import { EvaluationUnavailableError } from "@/server/training/evaluation/errors";
import { handleEvaluationUnavailable } from "./evaluation-failure-handler";
import { submitAttemptSchema, updateCurrentUserSchema } from "./schemas";

type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

const practitionerAdapter: PractitionerAdapter = trainingAdapter;
const challengeCatalogAdapter: ChallengeCatalogAdapter = trainingAdapter;
const attemptAdapter: AttemptAdapter = trainingAdapter;
const productTelemetryAdapter: ProductTelemetryAdapter = trainingAdapter;

async function requireAuthenticatedUser() {
  const user = await practitionerAdapter.getOptionalUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function revalidateTrainingViews() {
  revalidatePath("/perfil");
  revalidatePath("/desafios");
  revalidatePath("/inicio");
}

export async function getCurrentUser() {
  try {
    return { success: true as const, data: await requireAuthenticatedUser() };
  } catch (error: unknown) {
    return { success: false as const, error: getErrorMessage(error, "Erro ao obter usuário local") };
  }
}

export async function updateCurrentUserProfile(params: z.infer<typeof updateCurrentUserSchema>) {
  try {
    const parsedParams = updateCurrentUserSchema.parse(params);
    const image = parseProfileImage(parsedParams.image);
    const user = await requireAuthenticatedUser();
    const updatedUser = await practitionerAdapter.updateUser(user.id, {
      name: parsedParams.name.trim().slice(0, 60),
      ...(parsedParams.bio !== undefined ? { bio: parsedParams.bio.trim().slice(0, 180) } : {}),
      ...(image.wasProvided ? { image: image.value } : {}),
    });

    revalidatePath("/", "layout");
    revalidateTrainingViews();
    return { success: true as const, data: updatedUser };
  } catch (error: unknown) {
    return { success: false as const, error: getErrorMessage(error, "Erro ao atualizar perfil") };
  }
}

export async function listChallenges(params?: { limit?: number; offset?: number }) {
  try {
    const limit = Math.min(50, Math.max(1, params?.limit ?? 15));
    const offset = Math.max(0, params?.offset ?? 0);
    const user = await practitionerAdapter.getOptionalUser();
    const result = await challengeCatalogAdapter.listChallenges({ limit, offset, userId: user?.id });
    const nextOffset = offset + result.items.length;

    return {
      success: true as const,
      data: {
        items: result.items,
        total: result.total,
        offset,
        nextOffset,
        hasMore: nextOffset < result.total,
        userElo: result.userElo,
      },
    };
  } catch (error: unknown) {
    return { success: false as const, error: getErrorMessage(error, "Erro ao buscar desafios") };
  }
}

export async function getChallengeById(id: string) {
  try {
    const user = await practitionerAdapter.getOptionalUser();
    const challenge = await challengeCatalogAdapter.getChallengeById(id, user?.id);
    return challenge
      ? { success: true as const, data: challenge }
      : { success: false as const, error: "Desafio não encontrado" };
  } catch (error: unknown) {
    return { success: false as const, error: getErrorMessage(error, "Erro ao buscar desafio") };
  }
}

export async function submitChallengeAttempt(challengeId: string, input: SubmitAttemptInput) {
  try {
    const parsedInput = submitAttemptSchema.parse(input);
    const user = await requireAuthenticatedUser();
    const result = await attemptAdapter.submitAttempt(
      user.id,
      challengeId,
      parsedInput,
    );
    revalidateTrainingViews();
    return { success: true as const, data: result };
  } catch (error: unknown) {
    if (error instanceof EvaluationUnavailableError) {
      return handleEvaluationUnavailable(
        error,
        challengeId,
        (event) => productTelemetryAdapter.recordProductEvent(event),
      );
    }
    return { success: false as const, error: getErrorMessage(error, "Erro ao enviar tentativa") };
  }
}

export async function revealChallengeSolution(challengeId: string) {
  try {
    const user = await requireAuthenticatedUser();
    const result = await attemptAdapter.revealAttemptSolution(user.id, challengeId);
    revalidateTrainingViews();
    return { success: true as const, data: result };
  } catch (error: unknown) {
    return {
      success: false as const,
      error: getErrorMessage(error, "Erro ao revelar solução"),
    };
  }
}

export async function recordChallengeFeedbackViewed(
  challengeId: string,
  attemptNumber: number,
  sessionAgeBucket: SessionAgeBucket,
) {
  try {
    if (
      !["UNDER_10_MIN", "MIN_10_TO_30", "OVER_30_MIN"].includes(
        sessionAgeBucket,
      )
    ) {
      throw new Error("Faixa de sessão inválida");
    }
    const user = await requireAuthenticatedUser();
    const recorded = await productTelemetryAdapter.recordFeedbackViewed(
      user.id,
      challengeId,
      attemptNumber,
      sessionAgeBucket,
    );
    return { success: true as const, recorded };
  } catch (error: unknown) {
    return {
      success: false as const,
      error: getErrorMessage(error, "Erro ao registrar visualização do feedback"),
    };
  }
}

export async function recordAnonymousProductEvent(input: ProductEventInput) {
  try {
    const recorded = await productTelemetryAdapter.recordProductEvent(input);
    return { success: true as const, recorded };
  } catch (error: unknown) {
    return {
      success: false as const,
      error: getErrorMessage(error, "Erro ao registrar evento de produto"),
    };
  }
}

export async function listCurrentUserAttempts() {
  try {
    const user = await requireAuthenticatedUser();
    return { success: true as const, data: await practitionerAdapter.listAttempts(user.id) };
  } catch (error: unknown) {
    return { success: false as const, error: getErrorMessage(error, "Erro ao buscar histórico de tentativas") };
  }
}

function parseProfileImage(image: string | null | undefined) {
  if (image === undefined) return { wasProvided: false as const, value: undefined };
  if (image === null) return { wasProvided: true as const, value: null };
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(image)) {
    throw new Error("Formato de imagem inválido");
  }
  if (image.length > 2_000_000) throw new Error("Imagem muito grande (máx. 2MB em base64)");
  return { wasProvided: true as const, value: image };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
