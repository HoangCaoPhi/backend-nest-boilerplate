-- AlterTable
ALTER TABLE "outbox_messages" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX "outbox_messages_processedOn_occurredOn_idx";

-- CreateIndex
CREATE INDEX "outbox_messages_processedOn_nextAttemptAt_occurredOn_idx" ON "outbox_messages"("processedOn", "nextAttemptAt", "occurredOn");
