import { z } from "zod";

import type {
  ChallengeEvaluationRubric,
  ModelEvaluation,
} from "./types";

const rubricConceptSchema = z.strictObject({
  id: z.string().trim().min(1),
  importance: z.enum(["critical", "essential", "complementary"]),
  internalDescription: z.string().trim().min(1),
  publicLabel: z.string().trim().min(1).refine((value) => value !== "???"),
  reflectionPrompt: z.string().trim().min(1).optional(),
});

const rubricMisconceptionSchema = z.strictObject({
  id: z.string().trim().min(1),
  severity: z.enum(["minor", "major", "critical"]),
  internalDescription: z.string().trim().min(1),
  publicCorrection: z.string().trim().min(1).optional(),
});

const challengeEvaluationRubricSchema = z.strictObject({
  version: z.string().trim().min(1),
  questionKind: z.enum([
    "debugging",
    "explain-code",
    "explain-concept",
    "justify-use",
    "explain-bad-practice",
    "other",
  ]),
  centralAnswer: z.string().trim().min(1),
  evaluatorNotes: z.array(z.string().trim().min(1)).optional(),
  concepts: z.array(rubricConceptSchema).min(1),
  misconceptions: z.array(rubricMisconceptionSchema).optional(),
}).superRefine((rubric, context) => {
  if (!rubric.concepts.some((concept) => concept.importance === "critical")) {
    context.addIssue({ code: "custom", message: "Rubrica sem conceito critico" });
  }
  const conceptIds = rubric.concepts.map((concept) => concept.id);
  if (new Set(conceptIds).size !== conceptIds.length) {
    context.addIssue({ code: "custom", message: "IDs de conceitos duplicados" });
  }
  const misconceptionIds = rubric.misconceptions?.map((item) => item.id) ?? [];
  if (new Set(misconceptionIds).size !== misconceptionIds.length) {
    context.addIssue({ code: "custom", message: "IDs de erros duplicados" });
  }
});

export function parseChallengeEvaluationRubric(
  serialized: string | null | undefined,
): ChallengeEvaluationRubric | null {
  if (!serialized) return null;
  try {
    const parsed = challengeEvaluationRubricSchema.safeParse(JSON.parse(serialized));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const conceptAssessmentSchema = z.strictObject({
  conceptId: z.string().trim().min(1),
  state: z.enum(["MATCHED", "PARTIAL", "MISSING", "CONTRADICTED"]),
  evidence: z.string(),
}).superRefine((assessment, context) => {
  if (assessment.state !== "MISSING" && assessment.evidence.trim().length === 0) {
    context.addIssue({
      code: "custom",
      path: ["evidence"],
      message: "Conceito avaliado exige evidencia",
    });
  }
});

const modelEvaluationSchema = z.strictObject({
  status: z.enum(["VALID", "OFF_TOPIC", "NONSENSE"]),
  centralCorrectness: z.number().int().min(0).max(100),
  technicalReasoning: z.number().int().min(0).max(100),
  technicalPrecision: z.number().int().min(0).max(100),
  conceptAssessments: z.array(conceptAssessmentSchema),
  misconceptionIds: z.array(z.string().trim().min(1)),
  decisionRationale: z.string().trim().min(1),
});

export function parseModelEvaluation(
  value: unknown,
  rubric: ChallengeEvaluationRubric,
): ModelEvaluation | null {
  const parsed = modelEvaluationSchema.safeParse(value);
  if (!parsed.success) return null;

  const expectedConceptIds = new Set(rubric.concepts.map((concept) => concept.id));
  const receivedConceptIds = parsed.data.conceptAssessments.map(
    (assessment) => assessment.conceptId,
  );
  if (
    receivedConceptIds.length !== expectedConceptIds.size ||
    new Set(receivedConceptIds).size !== receivedConceptIds.length ||
    receivedConceptIds.some((id) => !expectedConceptIds.has(id))
  ) {
    return null;
  }

  const knownMisconceptionIds = new Set(
    rubric.misconceptions?.map((misconception) => misconception.id) ?? [],
  );
  if (
    new Set(parsed.data.misconceptionIds).size !== parsed.data.misconceptionIds.length ||
    parsed.data.misconceptionIds.some((id) => !knownMisconceptionIds.has(id))
  ) {
    return null;
  }

  return parsed.data;
}

export function buildModelEvaluationJsonSchema(
  rubric: ChallengeEvaluationRubric,
) {
  const conceptIds = rubric.concepts.map((concept) => concept.id);
  const misconceptionIds = rubric.misconceptions?.map(
    (misconception) => misconception.id,
  ) ?? [];

  return {
    type: "object",
    additionalProperties: false,
    required: [
      "status",
      "centralCorrectness",
      "technicalReasoning",
      "technicalPrecision",
      "conceptAssessments",
      "misconceptionIds",
      "decisionRationale",
    ],
    properties: {
      status: { type: "string", enum: ["VALID", "OFF_TOPIC", "NONSENSE"] },
      centralCorrectness: { type: "integer", minimum: 0, maximum: 100 },
      technicalReasoning: { type: "integer", minimum: 0, maximum: 100 },
      technicalPrecision: { type: "integer", minimum: 0, maximum: 100 },
      conceptAssessments: {
        type: "array",
        minItems: conceptIds.length,
        maxItems: conceptIds.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["conceptId", "state", "evidence"],
          properties: {
            conceptId: { type: "string", enum: conceptIds },
            state: {
              type: "string",
              enum: ["MATCHED", "PARTIAL", "MISSING", "CONTRADICTED"],
            },
                evidence: { type: "string" },
          },
        },
      },
      misconceptionIds: {
        type: "array",
        uniqueItems: true,
        maxItems: misconceptionIds.length,
        items: misconceptionIds.length > 0
          ? { type: "string", enum: misconceptionIds }
          : { type: "string" },
      },
      decisionRationale: { type: "string", minLength: 1 },
    },
  } as const;
}
