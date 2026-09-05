import "server-only";
import { db } from "@/lib/server/db";
import { AuditAction, ItemType, LinkStatus, LinkType } from "@/generated/prisma/enums";
import { isValidLink } from "@/lib/domain/linkRules";
import { writeAuditLog, type Actor } from "@/lib/server/audit";

export type AddLinkResult =
  | { success: true }
  | { success: false; error: string };

export async function addTraceLink(
  sourceItemId: string,
  targetItemId: string,
  linkType: LinkType,
  actor: Actor
): Promise<AddLinkResult> {
  if (sourceItemId === targetItemId) {
    return { success: false, error: "An item can't be linked to itself." };
  }

  const [sourceItem, targetItem] = await Promise.all([
    db.traceItem.findUnique({ where: { id: sourceItemId } }),
    db.traceItem.findUnique({ where: { id: targetItemId } }),
  ]);
  if (!sourceItem || !targetItem) {
    return { success: false, error: "Item not found." };
  }
  if (!isValidLink(linkType, sourceItem.itemType, targetItem.itemType)) {
    return { success: false, error: "That relationship isn't valid between these item types." };
  }

  const existing = await db.traceLink.findFirst({
    where: { sourceItemId, targetItemId, linkType, status: LinkStatus.ACTIVE },
  });
  if (existing) {
    return { success: false, error: "This link already exists." };
  }

  await db.$transaction(async (tx) => {
    const created = await tx.traceLink.create({
      data: { sourceItemId, targetItemId, linkType, createdById: actor.id },
    });

    await writeAuditLog(tx, {
      entityType: "TraceLink",
      entityId: created.id,
      action: AuditAction.LINK_ADD,
      actor,
      afterState: { sourceItemId, targetItemId, linkType },
    });
  });

  return { success: true };
}

export async function removeTraceLink(linkId: string, actor: Actor) {
  await db.$transaction(async (tx) => {
    const before = await tx.traceLink.findUniqueOrThrow({ where: { id: linkId } });

    await tx.traceLink.update({
      where: { id: linkId },
      data: { status: LinkStatus.REMOVED, removedById: actor.id, removedAt: new Date() },
    });

    await writeAuditLog(tx, {
      entityType: "TraceLink",
      entityId: linkId,
      action: AuditAction.LINK_REMOVE,
      actor,
      beforeState: {
        status: before.status,
        sourceItemId: before.sourceItemId,
        targetItemId: before.targetItemId,
        linkType: before.linkType,
      },
      afterState: { status: LinkStatus.REMOVED },
    });
  });
}

export async function getLinksForItem(traceItemId: string) {
  const links = await db.traceLink.findMany({
    where: {
      status: LinkStatus.ACTIVE,
      OR: [{ sourceItemId: traceItemId }, { targetItemId: traceItemId }],
    },
    include: { sourceItem: true, targetItem: true },
    orderBy: { createdAt: "desc" },
  });

  return links.map((link) => ({
    ...link,
    direction: (link.sourceItemId === traceItemId ? "outgoing" : "incoming") as
      | "outgoing"
      | "incoming",
    otherItem: link.sourceItemId === traceItemId ? link.targetItem : link.sourceItem,
  }));
}

export async function getAllActiveLinks() {
  return db.traceLink.findMany({
    where: { status: LinkStatus.ACTIVE },
    include: { sourceItem: true, targetItem: true },
  });
}

/**
 * For a batch of source items, the ACTIVE-linked targets of one specific
 * type (e.g. every linked User Need for a page of Design Inputs) — one
 * query for the whole list, keyed by source item id.
 */
export async function getLinkedTargetsByType(
  sourceItemIds: string[],
  targetType: ItemType
): Promise<Map<string, { id: string; humanCode: string }[]>> {
  if (sourceItemIds.length === 0) return new Map();

  const links = await db.traceLink.findMany({
    where: {
      sourceItemId: { in: sourceItemIds },
      status: LinkStatus.ACTIVE,
      targetItem: { itemType: targetType },
    },
    select: { sourceItemId: true, targetItem: { select: { id: true, humanCode: true } } },
  });

  const result = new Map<string, { id: string; humanCode: string }[]>();
  for (const link of links) {
    const bucket = result.get(link.sourceItemId);
    if (bucket) bucket.push(link.targetItem);
    else result.set(link.sourceItemId, [link.targetItem]);
  }
  return result;
}
