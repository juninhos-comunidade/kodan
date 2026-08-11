ALTER TABLE "challenge"
ADD COLUMN "promoted" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "challenge_promoted_idx" ON "challenge"("promoted");
