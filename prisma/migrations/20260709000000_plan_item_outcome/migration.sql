-- CreateEnum
CREATE TYPE "PlanItemOutcome" AS ENUM ('OPEN', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "plan_items" ADD COLUMN "outcome" "PlanItemOutcome" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "report_entries" ADD COLUMN "planItemOutcome" "PlanItemOutcome";

-- Backfill completed items
UPDATE "plan_items" SET "outcome" = 'COMPLETED' WHERE "completedAt" IS NOT NULL;
