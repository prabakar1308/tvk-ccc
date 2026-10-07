-- Migration: Add areasCovered to Union table
ALTER TABLE "Union" ADD COLUMN "areasCovered" TEXT[] DEFAULT ARRAY[]::TEXT[];
