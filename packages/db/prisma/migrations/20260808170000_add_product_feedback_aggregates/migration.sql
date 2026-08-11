ALTER TABLE "attempt"
ADD COLUMN "activationCounted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "product_event_aggregate" (
  "name" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "sessionAgeBucket" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_event_aggregate_pkey"
  PRIMARY KEY ("name", "challengeId", "sessionAgeBucket", "day")
);

CREATE INDEX "product_event_aggregate_name_day_idx"
ON "product_event_aggregate"("name", "day");

ALTER TABLE "product_event_aggregate"
ADD CONSTRAINT "product_event_aggregate_challengeId_fkey"
FOREIGN KEY ("challengeId") REFERENCES "challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
