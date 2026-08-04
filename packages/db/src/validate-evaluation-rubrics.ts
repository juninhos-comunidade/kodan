import {
  findActiveChallengesWithoutEvaluationRubric,
  readPromotedChallengeCatalog,
} from "@kodan/content/promoted-challenge-catalog";

async function run() {
  const catalog = await readPromotedChallengeCatalog();
  const missing = findActiveChallengesWithoutEvaluationRubric(catalog);
  if (missing.length === 0) {
    console.log("[evaluation:rubrics] todos os desafios ativos possuem rubrica");
    return;
  }

  console.error(`[evaluation:rubrics] ${missing.length} desafio(s) ativo(s) sem rubrica:`);
  for (const challenge of missing) {
    console.error(`- ${challenge.id}: ${challenge.title}`);
  }
  process.exitCode = 1;
}

run().catch((error) => {
  console.error("[evaluation:rubrics] falha ao validar", error);
  process.exitCode = 1;
});
