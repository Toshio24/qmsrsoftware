-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "trace_items" ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- CreateIndex
CREATE INDEX "folders_productId_idx" ON "folders"("productId");

-- CreateIndex
CREATE INDEX "trace_items_productId_idx" ON "trace_items"("productId");

-- AddForeignKey
ALTER TABLE "trace_items" ADD CONSTRAINT "trace_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data migration: seed the two known products and backfill every existing
-- product-scoped TraceItem/Folder onto LapRotator (everything that exists
-- today predates multi-product support and is all LapRotator's). The scoped
-- set here must match PRODUCT_SCOPED_TYPES in lib/domain/itemTypes.ts.
INSERT INTO "products" ("id", "name") VALUES
  (gen_random_uuid(), 'LapRotator'),
  (gen_random_uuid(), 'ENT');

UPDATE "trace_items"
SET "productId" = (SELECT "id" FROM "products" WHERE "name" = 'LapRotator')
WHERE "itemType" IN (
  'DESIGN_PLAN', 'USER_NEED', 'DESIGN_INPUT', 'DESIGN_OUTPUT',
  'VERIFICATION_TEST', 'VALIDATION_TEST', 'CONTROLLED_DOCUMENT',
  'RISK_ITEM', 'RISK_CONTROL'
);

UPDATE "folders"
SET "productId" = (SELECT "id" FROM "products" WHERE "name" = 'LapRotator')
WHERE "itemType" IN (
  'DESIGN_PLAN', 'USER_NEED', 'DESIGN_INPUT', 'DESIGN_OUTPUT',
  'VERIFICATION_TEST', 'VALIDATION_TEST', 'CONTROLLED_DOCUMENT',
  'RISK_ITEM', 'RISK_CONTROL'
);
