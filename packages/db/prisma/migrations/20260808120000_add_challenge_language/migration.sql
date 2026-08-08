ALTER TABLE "challenge"
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'react';

CREATE INDEX "challenge_language_idx" ON "challenge"("language");
