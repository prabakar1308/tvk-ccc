DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UnitTypeEnum') THEN
        CREATE TYPE "UnitTypeEnum" AS ENUM ('UNION', 'TOWN', 'TOWN_PANCHAYAT', 'AREA');
        ALTER TABLE "Union" ADD COLUMN "unitType" "UnitTypeEnum" NOT NULL DEFAULT 'UNION';
    ELSE
        BEGIN
            ALTER TYPE "UnitTypeEnum" ADD VALUE 'TOWN';
        EXCEPTION WHEN duplicate_object THEN null; END;
        
        BEGIN
            ALTER TYPE "UnitTypeEnum" ADD VALUE 'TOWN_PANCHAYAT';
        EXCEPTION WHEN duplicate_object THEN null; END;
        
        BEGIN
            ALTER TYPE "UnitTypeEnum" ADD VALUE 'AREA';
        EXCEPTION WHEN duplicate_object THEN null; END;
    END IF;
END$$;
