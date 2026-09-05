-- CreateTable
CREATE TABLE "category_sequences" (
    "itemType" "ItemType" NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryNumber" INTEGER NOT NULL,
    "lastItemNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_sequences_pkey" PRIMARY KEY ("itemType","categoryName")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_sequences_itemType_categoryNumber_key" ON "category_sequences"("itemType", "categoryNumber");
