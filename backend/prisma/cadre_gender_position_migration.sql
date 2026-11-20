-- ============================================================================
-- Migration: Add Gender, Position, and recent Cadre fields for UAT/Staging
-- Date: 2026-11-18
-- Safe & Idempotent (Uses IF NOT EXISTS and non-destructive backfills)
-- ============================================================================

-- 1. Add 'position' column for Executive Committee & Wing Officer reordering
ALTER TABLE "Cadre" ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;

-- 2. Add 'gender' column with default 'Male' ('Male', 'Female', '3rd Gender')
ALTER TABLE "Cadre" ADD COLUMN IF NOT EXISTS "gender" TEXT DEFAULT 'Male';

-- 3. Ensure other recent Cadre attributes exist (if not already added)
ALTER TABLE "Cadre" ADD COLUMN IF NOT EXISTS "panchayat" TEXT;
ALTER TABLE "Cadre" ADD COLUMN IF NOT EXISTS "village" TEXT;
ALTER TABLE "Cadre" ADD COLUMN IF NOT EXISTS "dateOfBirth" TEXT;
ALTER TABLE "Cadre" ADD COLUMN IF NOT EXISTS "dob" TEXT;
ALTER TABLE "Cadre" ADD COLUMN IF NOT EXISTS "remarks" TEXT;

-- 4. Backfill existing records to guarantee defaults
UPDATE "Cadre" SET "gender" = 'Male' WHERE "gender" IS NULL;
UPDATE "Cadre" SET "position" = 0 WHERE "position" IS NULL;
