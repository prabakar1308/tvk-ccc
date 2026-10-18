-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ScopeLevel" AS ENUM ('GLOBAL', 'DISTRICT', 'UNION', 'KILAI');

-- CreateEnum
CREATE TYPE "DistrictGroupEnum" AS ENUM ('KURINJIPADI', 'CUDDALORE');

-- CreateEnum
CREATE TYPE "UnitTypeEnum" AS ENUM ('UNION', 'TOWN', 'TOWN_PANCHAYAT', 'AREA');

-- CreateEnum
CREATE TYPE "KilaiStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "CadreLevel" AS ENUM ('DISTRICT', 'GROUP', 'UNION', 'KILAI');

-- CreateEnum
CREATE TYPE "OfficeBearerRole" AS ENUM ('SECRETARY', 'PRESIDENT', 'TREASURER', 'DEPUTY_SECRETARY', 'YOUTH_WING', 'WOMEN_WING', 'STUDENT_WING', 'IT_WING');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "scopeLevel" "ScopeLevel" NOT NULL DEFAULT 'GLOBAL',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT,
    "cadreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "attachments" JSONB,
    "translations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Union" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" TEXT,
    "group" "DistrictGroupEnum" NOT NULL DEFAULT 'KURINJIPADI',
    "unitType" "UnitTypeEnum" NOT NULL DEFAULT 'UNION',
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "areasCovered" TEXT[],
    "attachments" JSONB,
    "translations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Union_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kilai" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secretaryName" TEXT,
    "panchayat" TEXT,
    "description" TEXT,
    "translations" JSONB,
    "villages" TEXT[],
    "address" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "officePhotoUrl" TEXT,
    "status" "KilaiStatus" NOT NULL DEFAULT 'ACTIVE',
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "unionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cadre" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "aadhaarNumber" TEXT,
    "voterId" TEXT,
    "photoUrl" TEXT,
    "attachments" JSONB,
    "translations" JSONB,
    "role" TEXT,
    "area" TEXT,
    "boothNo" TEXT,
    "level" "CadreLevel" NOT NULL DEFAULT 'KILAI',
    "districtId" TEXT,
    "districtGroup" "DistrictGroupEnum",
    "unionId" TEXT,
    "homeKilaiId" TEXT,
    "wingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cadre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "textColor" TEXT,
    "iconName" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "translations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeBearer" (
    "id" TEXT NOT NULL,
    "role" "OfficeBearerRole" NOT NULL,
    "status" "KilaiStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "CadreLevel" NOT NULL DEFAULT 'KILAI',
    "kilaiId" TEXT,
    "cadreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeBearer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booth" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boothNo" TEXT NOT NULL,
    "translations" JSONB,
    "area" TEXT,
    "maleCount" INTEGER NOT NULL DEFAULT 0,
    "femaleCount" INTEGER NOT NULL DEFAULT 0,
    "thirdGenderCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BoothToKilai" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BoothToKilai_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BoothAgents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BoothAgents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_cadreId_key" ON "User"("cadreId");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_key" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Union_name_key" ON "Union"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Cadre_memberId_key" ON "Cadre"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Cadre_aadhaarNumber_key" ON "Cadre"("aadhaarNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Cadre_voterId_key" ON "Cadre"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "Wing_name_key" ON "Wing"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_boothNo_key" ON "Booth"("boothNo");

-- CreateIndex
CREATE INDEX "_BoothToKilai_B_index" ON "_BoothToKilai"("B");

-- CreateIndex
CREATE INDEX "_BoothAgents_B_index" ON "_BoothAgents"("B");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kilai" ADD CONSTRAINT "Kilai_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "Union"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cadre" ADD CONSTRAINT "Cadre_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cadre" ADD CONSTRAINT "Cadre_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "Union"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cadre" ADD CONSTRAINT "Cadre_homeKilaiId_fkey" FOREIGN KEY ("homeKilaiId") REFERENCES "Kilai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cadre" ADD CONSTRAINT "Cadre_wingId_fkey" FOREIGN KEY ("wingId") REFERENCES "Wing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeBearer" ADD CONSTRAINT "OfficeBearer_kilaiId_fkey" FOREIGN KEY ("kilaiId") REFERENCES "Kilai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeBearer" ADD CONSTRAINT "OfficeBearer_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoothToKilai" ADD CONSTRAINT "_BoothToKilai_A_fkey" FOREIGN KEY ("A") REFERENCES "Booth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoothToKilai" ADD CONSTRAINT "_BoothToKilai_B_fkey" FOREIGN KEY ("B") REFERENCES "Kilai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoothAgents" ADD CONSTRAINT "_BoothAgents_A_fkey" FOREIGN KEY ("A") REFERENCES "Booth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoothAgents" ADD CONSTRAINT "_BoothAgents_B_fkey" FOREIGN KEY ("B") REFERENCES "Cadre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
