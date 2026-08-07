-- CreateEnum
CREATE TYPE "KilaiStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "OfficeBearerRole" AS ENUM ('SECRETARY', 'PRESIDENT', 'TREASURER', 'DEPUTY_SECRETARY', 'YOUTH_WING', 'WOMEN_WING', 'STUDENT_WING', 'IT_WING');

-- CreateEnum
CREATE TYPE "PublicIssueCategory" AS ENUM ('ROAD', 'STREET_LIGHT', 'WATER', 'DRAINAGE', 'SCHOOL', 'HOSPITAL', 'ELECTRICITY', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicIssueStatus" AS ENUM ('PENDING', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Kilai" ADD COLUMN     "address" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "healthScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "officePhotoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "status" "KilaiStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tamilName" TEXT,
ADD COLUMN     "village" TEXT;

-- CreateTable
CREATE TABLE "OfficeBearer" (
    "id" TEXT NOT NULL,
    "role" "OfficeBearerRole" NOT NULL,
    "status" "KilaiStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kilaiId" TEXT NOT NULL,
    "cadreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeBearer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "PublicIssueCategory" NOT NULL,
    "location" TEXT NOT NULL,
    "department" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" "PublicIssueStatus" NOT NULL DEFAULT 'PENDING',
    "petitionDate" TIMESTAMP(3),
    "remarks" TEXT,
    "kilaiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booth" (
    "id" TEXT NOT NULL,
    "boothNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "kilaiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "comments" TEXT,
    "kilaiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT,
    "minutes" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "kilaiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAlbum" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kilaiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "albumId" TEXT,
    "publicIssueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficeBearer_kilaiId_role_cadreId_key" ON "OfficeBearer"("kilaiId", "role", "cadreId");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_kilaiId_boothNumber_key" ON "Booth"("kilaiId", "boothNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Kilai_code_key" ON "Kilai"("code");

-- AddForeignKey
ALTER TABLE "OfficeBearer" ADD CONSTRAINT "OfficeBearer_kilaiId_fkey" FOREIGN KEY ("kilaiId") REFERENCES "Kilai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeBearer" ADD CONSTRAINT "OfficeBearer_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicIssue" ADD CONSTRAINT "PublicIssue_kilaiId_fkey" FOREIGN KEY ("kilaiId") REFERENCES "Kilai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booth" ADD CONSTRAINT "Booth_kilaiId_fkey" FOREIGN KEY ("kilaiId") REFERENCES "Kilai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_kilaiId_fkey" FOREIGN KEY ("kilaiId") REFERENCES "Kilai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_kilaiId_fkey" FOREIGN KEY ("kilaiId") REFERENCES "Kilai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAlbum" ADD CONSTRAINT "MediaAlbum_kilaiId_fkey" FOREIGN KEY ("kilaiId") REFERENCES "Kilai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "MediaAlbum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_publicIssueId_fkey" FOREIGN KEY ("publicIssueId") REFERENCES "PublicIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

