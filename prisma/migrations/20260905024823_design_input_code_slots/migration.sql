-- AlterTable
ALTER TABLE "category_sequences" DROP COLUMN "lastItemNumber";

-- CreateTable
CREATE TABLE "design_input_code_slots" (
    "categoryNumber" INTEGER NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "traceItemId" TEXT NOT NULL,

    CONSTRAINT "design_input_code_slots_pkey" PRIMARY KEY ("categoryNumber","itemNumber")
);

-- CreateIndex
CREATE UNIQUE INDEX "design_input_code_slots_traceItemId_key" ON "design_input_code_slots"("traceItemId");
