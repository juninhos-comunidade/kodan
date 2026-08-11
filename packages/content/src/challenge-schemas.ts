import { z } from "zod";

export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const challengeLanguageSchema = z.enum([
  "react",
  "typescript",
  "python",
  "nodejs",
]);

export const rubricCriterionSchema = z.object({
  criterion: z.string().trim().min(1),
  points: z.number().int().min(0),
});

export const evaluationRubricConceptSchema = z.object({
  id: z.string().trim().min(1),
  importance: z.enum(["critical", "essential", "complementary"]),
  internalDescription: z.string().trim().min(1),
  publicLabel: z.string().trim().min(1).refine((value) => value !== "???"),
  reflectionPrompt: z.string().trim().min(1).optional(),
}).strict();

export const evaluationRubricMisconceptionSchema = z.object({
  id: z.string().trim().min(1),
  severity: z.enum(["minor", "major", "critical"]),
  internalDescription: z.string().trim().min(1),
  publicCorrection: z.string().trim().min(1).optional(),
}).strict();

export const challengeEvaluationRubricSchema = z.object({
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
  concepts: z.array(evaluationRubricConceptSchema).min(1),
  misconceptions: z.array(evaluationRubricMisconceptionSchema).optional(),
}).strict().superRefine((rubric, context) => {
  const conceptIds = rubric.concepts.map((concept) => concept.id);
  if (new Set(conceptIds).size !== conceptIds.length) {
    context.addIssue({ code: "custom", message: "IDs de conceitos devem ser únicos", path: ["concepts"] });
  }
  if (!rubric.concepts.some((concept) => concept.importance === "critical")) {
    context.addIssue({ code: "custom", message: "A rubrica deve possuir conceito crítico", path: ["concepts"] });
  }
  const misconceptionIds = rubric.misconceptions?.map((misconception) => misconception.id) ?? [];
  if (new Set(misconceptionIds).size !== misconceptionIds.length) {
    context.addIssue({ code: "custom", message: "IDs de misconceptions devem ser únicos", path: ["misconceptions"] });
  }
  const internalTexts = [
    rubric.centralAnswer,
    ...rubric.concepts.map((concept) => concept.internalDescription),
  ].map(normalizeEditorialText);
  rubric.concepts.forEach((concept, index) => {
    if (!concept.reflectionPrompt) return;
    const prompt = normalizeEditorialText(concept.reflectionPrompt);
    if (internalTexts.some((internalText) => prompt.includes(internalText))) {
      context.addIssue({
        code: "custom",
        message: "A pergunta de reflexão não pode revelar a resposta interna",
        path: ["concepts", index, "reflectionPrompt"],
      });
    }
  });
});

const evaluationBenchmarkScoreRangeSchema = z.object({
  min: z.number().min(0).max(10),
  max: z.number().min(0).max(10),
}).strict().refine((range) => range.min <= range.max, {
  message: "A nota mínima não pode superar a máxima",
});

export const evaluationBenchmarkCaseSchema = z.object({
  id: z.string().trim().min(1),
  category: z.enum(["accepted", "partial", "rejected", "adversarial"]),
  answer: z.string().trim().min(1),
  expectedScore: evaluationBenchmarkScoreRangeSchema,
  expectedStatus: z.enum(["SOLVED", "RETRY_AVAILABLE"]),
  expectedMatchedConceptIds: z.array(z.string().trim().min(1)).optional(),
  forbiddenMatchedConceptIds: z.array(z.string().trim().min(1)).optional(),
}).strict();

export const evaluationBenchmarkCasesSchema = z
  .array(evaluationBenchmarkCaseSchema)
  .min(1)
  .superRefine((cases, context) => {
    const caseIds = cases.map((evaluationCase) => evaluationCase.id);
    if (new Set(caseIds).size !== caseIds.length) {
      context.addIssue({ code: "custom", message: "IDs de casos devem ser únicos" });
    }
  });

function normalizeEditorialText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const baseChallengeSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  difficulty: difficultySchema,
  recommendedElo: z.number().int().min(0),
  question: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
  language: challengeLanguageSchema.optional(),
  type: z.string().trim().min(1).optional(),
  estimatedTime: z.number().int().min(1).max(180).optional(),
  status: z.string().trim().min(1).optional(),
  rubric: z.array(rubricCriterionSchema).optional(),
  evaluationRubric: challengeEvaluationRubricSchema.optional(),
  hints: z.array(z.string().trim().min(1)).optional(),
  commonMistakes: z.array(z.string().trim().min(1)).optional(),
});

export const challengeLegacySchema = baseChallengeSchema.extend({
  code: z.string().trim().min(1),
  solution: z.string().trim().min(1),
  expectedAnswer: z.string().trim().min(1).optional(),
});

export const challengeSplitMetaSchema = baseChallengeSchema.extend({
  codeFile: z.string().trim().min(1).optional(),
  solutionFile: z.string().trim().min(1).optional(),
  expectedAnswerFile: z.string().trim().min(1).optional(),
  rubricFile: z.string().trim().min(1).optional(),
  hintsFile: z.string().trim().min(1).optional(),
  commonMistakesFile: z.string().trim().min(1).optional(),
});

export const challengeIndexEntrySchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  language: challengeLanguageSchema,
  difficulty: difficultySchema,
  type: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)),
  estimatedTime: z.number().int().min(1).max(180),
  recommendedElo: z.number().int().min(0),
  status: z.string().trim().min(1),
});

export const challengeIndexSchema = z.array(challengeIndexEntrySchema);

export type ChallengeLegacy = z.infer<typeof challengeLegacySchema>;
export type ChallengeSplitMeta = z.infer<typeof challengeSplitMetaSchema>;
export type ChallengeIndexEntry = z.infer<typeof challengeIndexEntrySchema>;
export type ChallengeEvaluationRubric = z.infer<typeof challengeEvaluationRubricSchema>;
export type EvaluationBenchmarkCase = z.infer<typeof evaluationBenchmarkCaseSchema>;
