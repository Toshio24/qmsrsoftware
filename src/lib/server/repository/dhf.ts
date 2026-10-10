import "server-only";
import { db } from "@/lib/server/db";
import { ItemType } from "@/generated/prisma/enums";
import { getItemTypeConfig } from "@/lib/domain/itemTypes";

/**
 * The design-control record types that make up a Design History File:
 * the governing plan plus every requirement/output/test type it's expected
 * to cover (see gapRules.ts's GOVERNS-based rules for the same set, minus
 * the plan itself).
 */
const DHF_SECTION_TYPES: ItemType[] = [
  ItemType.DESIGN_PLAN,
  ItemType.USER_NEED,
  ItemType.DESIGN_INPUT,
  ItemType.DESIGN_OUTPUT,
  ItemType.VERIFICATION_TEST,
  ItemType.VALIDATION_TEST,
  ItemType.CONTROLLED_DOCUMENT,
];

export type DhfRow = {
  id: string;
  humanCode: string;
  title: string;
  status: string;
  versionNumber: number;
};

export type DhfSection = {
  itemType: ItemType;
  label: string;
  items: DhfRow[];
};

/** One section per design-control record type, each item's current status
 * and version — a compiled index into the Design History File, not a dump
 * of every field (use the item's own page/export for full detail). A Design
 * History File is inherently per-device, so `productId` restricts this to
 * one product. */
export async function getDhfSections(productId?: string): Promise<DhfSection[]> {
  const items = await db.traceItem.findMany({
    where: { itemType: { in: DHF_SECTION_TYPES }, ...(productId ? { productId } : {}) },
    orderBy: { humanCode: "asc" },
  });

  const byType = new Map<ItemType, typeof items>();
  for (const item of items) {
    const bucket = byType.get(item.itemType);
    if (bucket) bucket.push(item);
    else byType.set(item.itemType, [item]);
  }

  return DHF_SECTION_TYPES.map((itemType) => ({
    itemType,
    label: getItemTypeConfig(itemType).pluralLabel,
    items: (byType.get(itemType) ?? []).map((i) => ({
      id: i.id,
      humanCode: i.humanCode,
      title: i.title,
      status: i.status,
      versionNumber: i.currentVersionNo,
    })),
  }));
}
