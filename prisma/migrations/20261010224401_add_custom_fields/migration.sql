-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CUSTOM_FIELD_ADD';
ALTER TYPE "AuditAction" ADD VALUE 'CUSTOM_FIELD_REMOVE';

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "traceItemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "addedById" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedById" TEXT,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_fields_traceItemId_idx" ON "custom_fields"("traceItemId");

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_traceItemId_fkey" FOREIGN KEY ("traceItemId") REFERENCES "trace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Same treatment as attachments/trace_links: soft-delete only, never a hard
-- delete or truncate, using the guard functions already defined in
-- append_only_triggers/migration.sql.
CREATE TRIGGER custom_fields_no_delete BEFORE DELETE ON "custom_fields"
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();
CREATE TRIGGER custom_fields_no_truncate BEFORE TRUNCATE ON "custom_fields"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_delete();
