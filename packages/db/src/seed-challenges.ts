import prisma from "./index";
import { syncChallengesIndexFromContent, upsertChallengesFromContent } from "./challenge-content";

async function run() {
  const pruneDuplicateOrphans = process.argv.includes("--prune-duplicate-orphans");
  const syncResult = await syncChallengesIndexFromContent();
  console.log(`[seed:challenges] indexSynced total=${syncResult.total}`);

  const result = await upsertChallengesFromContent(prisma, {
    pruneDuplicateOrphans,
  });
  console.log(
    `[seed:challenges] total=${result.total} inserted=${result.inserted} updated=${result.updated} pruned=${result.pruned} protectedOrphans=${result.protectedOrphans.length}`,
  );
  for (const orphan of result.protectedOrphans) {
    console.warn(
      `[seed:challenges] protectedOrphan id=${orphan.id} attempts=${orphan.attemptCount}`,
    );
  }
}

run()
  .catch((error) => {
    console.error("[seed:challenges] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
