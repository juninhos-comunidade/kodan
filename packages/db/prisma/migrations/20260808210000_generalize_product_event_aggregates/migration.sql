ALTER TABLE "product_event_aggregate"
DROP CONSTRAINT "product_event_aggregate_challengeId_fkey";

ALTER TABLE "product_event_aggregate"
DROP CONSTRAINT "product_event_aggregate_pkey";

ALTER TABLE "product_event_aggregate"
RENAME COLUMN "challengeId" TO "scopeKey";

ALTER TABLE "product_event_aggregate"
RENAME COLUMN "sessionAgeBucket" TO "contextBucket";

ALTER TABLE "product_event_aggregate"
ADD CONSTRAINT "product_event_aggregate_pkey"
PRIMARY KEY ("name", "scopeKey", "contextBucket", "day");
