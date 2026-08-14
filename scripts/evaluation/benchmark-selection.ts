import type {
  ChallengeContentEntry,
} from "../../packages/content/src/promoted-challenge-catalog";
import type {
  ChallengeIndexEntry,
  EvaluationBenchmarkCase,
} from "../../packages/content/src/challenge-schemas";

export const LANGUAGE_PILOT_CHALLENGE_COUNT = 5;
export const BENCHMARK_CASES_PER_CHALLENGE = 6;

const categoryTargets = {
  accepted: 2,
  partial: 2,
  rejected: 1,
  adversarial: 1,
} as const satisfies Record<EvaluationBenchmarkCase["category"], number>;

export type BenchmarkChallenge = ChallengeContentEntry & {
  evaluationRubric: NonNullable<ChallengeContentEntry["evaluationRubric"]>;
  evaluationCases: EvaluationBenchmarkCase[];
};

export function selectLanguagePilot({
  challenges,
  language,
  requestedChallengeId,
}: {
  challenges: ChallengeContentEntry[];
  language: ChallengeIndexEntry["language"];
  requestedChallengeId?: string;
}): BenchmarkChallenge[] {
  const candidates = challenges
    .filter((challenge) => challenge.language === language)
    .filter(hasEvaluationAssets)
    .sort((left, right) => left.id.localeCompare(right.id));

  if (requestedChallengeId) {
    const selected = candidates.find((challenge) => challenge.id === requestedChallengeId);
    if (!selected) {
      throw new Error(
        `Desafio "${requestedChallengeId}" não possui rubrica e casos válidos para o piloto de ${language}.`,
      );
    }
    return [selected];
  }

  if (candidates.length !== LANGUAGE_PILOT_CHALLENGE_COUNT) {
    throw new Error(
      `O piloto de ${language} exige exatamente ${LANGUAGE_PILOT_CHALLENGE_COUNT} desafios com rubrica e casos; encontrados ${candidates.length}.`,
    );
  }
  return candidates;
}

export function selectRepresentativeCases(cases: EvaluationBenchmarkCase[]) {
  const selected = (Object.entries(categoryTargets) as Array<[
    EvaluationBenchmarkCase["category"],
    number,
  ]>).flatMap(([category, count]) => {
    const matching = cases.filter((evaluationCase) => evaluationCase.category === category);
    if (matching.length < count) {
      throw new Error(
        `Benchmark exige ${count} caso(s) da categoria ${category}; encontrados ${matching.length}.`,
      );
    }
    return matching.slice(0, count);
  });

  if (selected.length !== BENCHMARK_CASES_PER_CHALLENGE) {
    throw new Error(`Benchmark deve selecionar ${BENCHMARK_CASES_PER_CHALLENGE} casos por desafio.`);
  }
  return selected;
}

function hasEvaluationAssets(challenge: ChallengeContentEntry): challenge is BenchmarkChallenge {
  return Boolean(challenge.evaluationRubric && challenge.evaluationCases);
}
