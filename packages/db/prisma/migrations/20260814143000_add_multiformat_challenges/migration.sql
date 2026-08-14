ALTER TABLE "challenge"
ALTER COLUMN "code" DROP NOT NULL,
ADD COLUMN "codeFileName" TEXT,
ADD COLUMN "scenario" TEXT,
ADD COLUMN "topic" TEXT NOT NULL DEFAULT 'state-rendering',
ADD COLUMN "presentation" TEXT NOT NULL DEFAULT 'code',
ADD COLUMN "intent" TEXT NOT NULL DEFAULT 'diagnose',
ADD COLUMN "terminalJson" TEXT;

CREATE INDEX "challenge_language_topic_idx" ON "challenge"("language", "topic");
