-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'QA', 'AUTHOR', 'APPROVER', 'AUDITOR_READONLY');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('USER_NEED', 'DESIGN_INPUT', 'DESIGN_OUTPUT', 'RISK_ITEM', 'RISK_CONTROL', 'VERIFICATION_TEST', 'VALIDATION_TEST', 'CONTROLLED_DOCUMENT');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'EFFECTIVE', 'REJECTED', 'RETIRED', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('DERIVED_FROM', 'SATISFIES', 'VERIFIES', 'VALIDATES', 'MITIGATES', 'IMPLEMENTS', 'REFERENCES');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "RiskControlType" AS ENUM ('DESIGN', 'PROTECTIVE', 'INFORMATION');

-- CreateEnum
CREATE TYPE "TestOutcome" AS ENUM ('PASS', 'FAIL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SignatureMeaning" AS ENUM ('AUTHORED', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STATUS_CHANGE', 'LINK_ADD', 'LINK_REMOVE', 'SIGNATURE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'EXPORT', 'USER_ROLE_CHANGE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trace_items" (
    "id" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "humanCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionNo" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trace_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_need_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "needText" TEXT NOT NULL,
    "rationale" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_need_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_input_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "requirementText" TEXT NOT NULL,
    "acceptanceCriteria" TEXT,
    "category" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_input_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_output_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "specText" TEXT NOT NULL,
    "implementationRef" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_output_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_item_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "hazard" TEXT NOT NULL,
    "hazardousSituation" TEXT NOT NULL,
    "harm" TEXT NOT NULL,
    "severityInitial" INTEGER NOT NULL,
    "probabilityInitial" INTEGER NOT NULL,
    "rpnInitial" INTEGER NOT NULL,
    "severityResidual" INTEGER,
    "probabilityResidual" INTEGER,
    "rpnResidual" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_item_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_control_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "controlType" "RiskControlType" NOT NULL,
    "description" TEXT NOT NULL,
    "effectivenessVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_control_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_test_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "procedure" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_test_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_test_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "procedure" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_test_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_document_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "docName" TEXT NOT NULL,
    "controlNumber" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "googleDocUrl" TEXT,
    "pdfSnapshotUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "reviewCycleMonths" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controlled_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumberTested" INTEGER NOT NULL,
    "executedById" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "TestOutcome" NOT NULL,
    "actualResults" TEXT,
    "attachmentUrl" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trace_links" (
    "id" TEXT NOT NULL,
    "sourceItemId" TEXT NOT NULL,
    "targetItemId" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedById" TEXT,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "trace_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorUserId" TEXT,
    "actorUsernameSnapshot" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beforeState" JSONB,
    "afterState" JSONB,
    "reasonForChange" TEXT,
    "ipAddress" TEXT,
    "requestId" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e_signatures" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "meaning" "SignatureMeaning" NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attestationTextSnapshot" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "e_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "trace_items_humanCode_key" ON "trace_items"("humanCode");

-- CreateIndex
CREATE INDEX "trace_items_itemType_idx" ON "trace_items"("itemType");

-- CreateIndex
CREATE INDEX "trace_items_status_idx" ON "trace_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_need_versions_traceItemId_versionNumber_key" ON "user_need_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "design_input_versions_traceItemId_versionNumber_key" ON "design_input_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "design_output_versions_traceItemId_versionNumber_key" ON "design_output_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "risk_item_versions_traceItemId_versionNumber_key" ON "risk_item_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "risk_control_versions_traceItemId_versionNumber_key" ON "risk_control_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "verification_test_versions_traceItemId_versionNumber_key" ON "verification_test_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "validation_test_versions_traceItemId_versionNumber_key" ON "validation_test_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "controlled_document_versions_traceItemId_versionNumber_key" ON "controlled_document_versions"("traceItemId", "versionNumber");

-- CreateIndex
CREATE INDEX "test_results_traceItemId_idx" ON "test_results"("traceItemId");

-- CreateIndex
CREATE INDEX "trace_links_sourceItemId_idx" ON "trace_links"("sourceItemId");

-- CreateIndex
CREATE INDEX "trace_links_targetItemId_idx" ON "trace_links"("targetItemId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_actorUserId_idx" ON "audit_log"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE INDEX "e_signatures_entityType_entityId_idx" ON "e_signatures"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "e_signatures_signerId_idx" ON "e_signatures"("signerId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_items" ADD CONSTRAINT "trace_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_need_versions" ADD CONSTRAINT "user_need_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_need_versions" ADD CONSTRAINT "user_need_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_input_versions" ADD CONSTRAINT "design_input_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_input_versions" ADD CONSTRAINT "design_input_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_output_versions" ADD CONSTRAINT "design_output_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_output_versions" ADD CONSTRAINT "design_output_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_item_versions" ADD CONSTRAINT "risk_item_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_item_versions" ADD CONSTRAINT "risk_item_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_control_versions" ADD CONSTRAINT "risk_control_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_control_versions" ADD CONSTRAINT "risk_control_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_test_versions" ADD CONSTRAINT "verification_test_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_test_versions" ADD CONSTRAINT "verification_test_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_test_versions" ADD CONSTRAINT "validation_test_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_test_versions" ADD CONSTRAINT "validation_test_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_document_versions" ADD CONSTRAINT "controlled_document_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_document_versions" ADD CONSTRAINT "controlled_document_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_links" ADD CONSTRAINT "trace_links_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_links" ADD CONSTRAINT "trace_links_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_links" ADD CONSTRAINT "trace_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_links" ADD CONSTRAINT "trace_links_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "e_signatures" ADD CONSTRAINT "e_signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
