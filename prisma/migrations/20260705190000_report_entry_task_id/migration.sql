-- Add taskId to report_entries (migrate from legacy TaskTitle to user Task model)
ALTER TABLE "report_entries" ADD COLUMN "taskId" TEXT;

-- Copy taskId from linked plan items where available
UPDATE "report_entries" re
SET "taskId" = pi."taskId"
FROM "plan_items" pi
WHERE re."planItemId" = pi."id"
  AND pi."taskId" IS NOT NULL
  AND re."taskId" IS NULL;

CREATE INDEX "report_entries_taskId_idx" ON "report_entries"("taskId");

ALTER TABLE "report_entries" ADD CONSTRAINT "report_entries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
