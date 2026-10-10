-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'DESIGN_PLAN';

-- AlterEnum
ALTER TYPE "LinkType" ADD VALUE 'GOVERNS';

-- CreateTable
CREATE TABLE "design_plan_versions" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "designStages" TEXT NOT NULL,
    "reviewScheduleAndMethods" TEXT NOT NULL,
    "responsibilitiesAndAuthorities" TEXT NOT NULL,
    "interfaceManagement" TEXT,
    "transferPlan" TEXT,
    "targetCompletionDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "design_plan_versions_traceItemId_versionNumber_key" ON "design_plan_versions"("traceItemId", "versionNumber");

-- AddForeignKey
ALTER TABLE "design_plan_versions" ADD CONSTRAINT "design_plan_versions_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_plan_versions" ADD CONSTRAINT "design_plan_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
