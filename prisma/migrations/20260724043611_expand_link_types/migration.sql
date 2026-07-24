-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LinkType" ADD VALUE 'RESULTED_FROM';
ALTER TYPE "LinkType" ADD VALUE 'ADDRESSES';
ALTER TYPE "LinkType" ADD VALUE 'SUPPLIED_BY';
ALTER TYPE "LinkType" ADD VALUE 'TRAINED_ON';
ALTER TYPE "LinkType" ADD VALUE 'USED_EQUIPMENT';
