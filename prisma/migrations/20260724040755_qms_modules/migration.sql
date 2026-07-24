-- CreateEnum
CREATE TYPE "SupplierApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'CONDITIONAL', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "SupplierAuditType" AS ENUM ('ONSITE', 'REMOTE', 'DOCUMENT_REVIEW');

-- CreateEnum
CREATE TYPE "CapaType" AS ENUM ('CORRECTIVE', 'PREVENTIVE');

-- CreateEnum
CREATE TYPE "NonconformanceDisposition" AS ENUM ('USE_AS_IS', 'REWORK', 'SCRAP', 'RETURN_TO_SUPPLIER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ItemType" ADD VALUE 'SUPPLIER';
ALTER TYPE "ItemType" ADD VALUE 'SUPPLIER_AUDIT';
ALTER TYPE "ItemType" ADD VALUE 'CAPA';
ALTER TYPE "ItemType" ADD VALUE 'NONCONFORMANCE';
ALTER TYPE "ItemType" ADD VALUE 'COMPLAINT';
ALTER TYPE "ItemType" ADD VALUE 'INTERNAL_AUDIT';
ALTER TYPE "ItemType" ADD VALUE 'MANAGEMENT_REVIEW';
ALTER TYPE "ItemType" ADD VALUE 'TRAINING_RECORD';
ALTER TYPE "ItemType" ADD VALUE 'EQUIPMENT';

-- CreateTable
CREATE TABLE "supplier_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "approvalStatus" "SupplierApprovalStatus" NOT NULL,
    "qualificationDate" TIMESTAMP(3),
    "requalificationDueDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_audit_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "auditType" "SupplierAuditType" NOT NULL,
    "findingsSummary" TEXT NOT NULL,
    "score" INTEGER,
    "correctiveActionRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_audit_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capa_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "capaType" "CapaType" NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "actionPlan" TEXT,
    "dueDate" TIMESTAMP(3),
    "effectivenessCheckDate" TIMESTAMP(3),
    "effectivenessResult" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capa_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nonconformance_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "detectedDate" TIMESTAMP(3) NOT NULL,
    "dispositionType" "NonconformanceDisposition",
    "disposition" TEXT,
    "severity" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nonconformance_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "isReportable" BOOLEAN NOT NULL DEFAULT false,
    "investigationSummary" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_audit_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "auditorName" TEXT NOT NULL,
    "findingsSummary" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_audit_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "management_review_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT,
    "summary" TEXT NOT NULL,
    "actionItems" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "management_review_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_record_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "traineeName" TEXT NOT NULL,
    "trainingTitle" TEXT NOT NULL,
    "completedDate" TIMESTAMP(3) NOT NULL,
    "expiresDate" TIMESTAMP(3),
    "method" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_record_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "assetTag" TEXT,
    "calibrationDate" TIMESTAMP(3),
    "calibrationDueDate" TIMESTAMP(3),
    "calibratedBy" TEXT,
    "certificateRef" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_sequences" (
    "itemType" "ItemType" NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "item_sequences_pkey" PRIMARY KEY ("itemType")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_versions_traceItemId_versionNumber_key" ON "supplier_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_audit_versions_traceItemId_versionNumber_key" ON "supplier_audit_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "capa_versions_traceItemId_versionNumber_key" ON "capa_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "nonconformance_versions_traceItemId_versionNumber_key" ON "nonconformance_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_versions_traceItemId_versionNumber_key" ON "complaint_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "internal_audit_versions_traceItemId_versionNumber_key" ON "internal_audit_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "management_review_versions_traceItemId_versionNumber_key" ON "management_review_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "training_record_versions_traceItemId_versionNumber_key" ON "training_record_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_versions_traceItemId_versionNumber_key" ON "equipment_versions"("traceItemId", "versionNumber");

-- AddForeignKey
ALTER TABLE "supplier_versions" ADD CONSTRAINT "supplier_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_versions" ADD CONSTRAINT "supplier_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_audit_versions" ADD CONSTRAINT "supplier_audit_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_audit_versions" ADD CONSTRAINT "supplier_audit_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_versions" ADD CONSTRAINT "capa_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_versions" ADD CONSTRAINT "capa_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nonconformance_versions" ADD CONSTRAINT "nonconformance_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nonconformance_versions" ADD CONSTRAINT "nonconformance_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_versions" ADD CONSTRAINT "complaint_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_versions" ADD CONSTRAINT "complaint_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_audit_versions" ADD CONSTRAINT "internal_audit_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_audit_versions" ADD CONSTRAINT "internal_audit_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_review_versions" ADD CONSTRAINT "management_review_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_review_versions" ADD CONSTRAINT "management_review_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_record_versions" ADD CONSTRAINT "training_record_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_record_versions" ADD CONSTRAINT "training_record_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_versions" ADD CONSTRAINT "equipment_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_versions" ADD CONSTRAINT "equipment_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
