-- Backfill plan item titles from linked Task / TaskTitle before dropping Task FKs.
UPDATE "plan_items" AS pi
SET "customTitle" = COALESCE(
  NULLIF(TRIM(pi."customTitle"), ''),
  t."title",
  tt."title",
  'Untitled'
)
FROM "plan_items" AS src
LEFT JOIN "tasks" AS t ON t."id" = src."taskId"
LEFT JOIN "task_titles" AS tt ON tt."id" = src."taskTitleId"
WHERE pi."id" = src."id"
  AND (
    pi."customTitle" IS NULL
    OR TRIM(pi."customTitle") = ''
  );

-- Backfill report entry custom titles when missing (from Task / PlanItem / TaskTitle).
UPDATE "report_entries" AS re
SET "customTitle" = COALESCE(
  NULLIF(TRIM(re."customTitle"), ''),
  t."title",
  pi."customTitle",
  tt."title",
  'Untitled'
)
FROM "report_entries" AS src
LEFT JOIN "tasks" AS t ON t."id" = src."taskId"
LEFT JOIN "plan_items" AS pi ON pi."id" = src."planItemId"
LEFT JOIN "task_titles" AS tt ON tt."id" = src."taskTitleId"
WHERE re."id" = src."id"
  AND (
    re."customTitle" IS NULL
    OR TRIM(re."customTitle") = ''
  );

-- Drop Task FKs from plan_items / report_entries.
ALTER TABLE "plan_items" DROP CONSTRAINT IF EXISTS "plan_items_taskId_fkey";
DROP INDEX IF EXISTS "plan_items_taskId_idx";
ALTER TABLE "plan_items" DROP COLUMN IF EXISTS "taskId";

ALTER TABLE "report_entries" DROP CONSTRAINT IF EXISTS "report_entries_taskId_fkey";
DROP INDEX IF EXISTS "report_entries_taskId_idx";
ALTER TABLE "report_entries" DROP COLUMN IF EXISTS "taskId";

-- Require customTitle on plan items (after backfill).
ALTER TABLE "plan_items" ALTER COLUMN "customTitle" SET NOT NULL;

-- Drop Task hierarchy table and org/user relations.
DROP TABLE IF EXISTS "tasks";

-- Attachments: support plan items (XOR with report entries).
ALTER TABLE "attachments" ALTER COLUMN "reportEntryId" DROP NOT NULL;
ALTER TABLE "attachments" ADD COLUMN IF NOT EXISTS "planItemId" TEXT;

CREATE INDEX IF NOT EXISTS "attachments_planItemId_idx" ON "attachments"("planItemId");

ALTER TABLE "attachments" DROP CONSTRAINT IF EXISTS "attachments_planItemId_fkey";
ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_planItemId_fkey"
  FOREIGN KEY ("planItemId") REFERENCES "plan_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Exactly one of reportEntryId | planItemId
ALTER TABLE "attachments" DROP CONSTRAINT IF EXISTS "attachments_owner_xor";
ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_owner_xor"
  CHECK (
    ("reportEntryId" IS NOT NULL AND "planItemId" IS NULL)
    OR ("reportEntryId" IS NULL AND "planItemId" IS NOT NULL)
  );

-- User avatar fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarMimeType" TEXT;
