import "server-only";
import { db } from "@/lib/server/db";
import { ItemType, ItemStatus, AuditAction } from "@/generated/prisma/enums";
import { getItemTypeConfig, deriveTitle } from "@/lib/domain/itemTypes";
import { writeAuditLog, type Actor } from "@/lib/server/audit";
import { createAttachmentInTx } from "./attachments";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type DbOrTx = typeof db | TxClient;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type VersionDelegate = { create: Function; findMany: Function };

/**
 * Generic dispatch table: one entry per ItemType naming the exact Prisma
 * model to use for a given client (either the module-level `db` or a
 * `$transaction` callback's `tx`). This is intentionally an explicit map
 * (not `client[someString]`) so every case is a real, checked reference to
 * a generated model — the `data` payload itself is a loosely-typed record
 * because it was already validated against the type's Zod schema (see
 * lib/domain/itemForm.ts) before it gets here.
 */
const versionDelegateByType: Record<ItemType, (client: DbOrTx) => VersionDelegate> = {
  USER_NEED: (client) => client.userNeedVersion,
  DESIGN_INPUT: (client) => client.designInputVersion,
  DESIGN_OUTPUT: (client) => client.designOutputVersion,
  RISK_ITEM: (client) => client.riskItemVersion,
  RISK_CONTROL: (client) => client.riskControlVersion,
  VERIFICATION_TEST: (client) => client.verificationTestVersion,
  VALIDATION_TEST: (client) => client.validationTestVersion,
  CONTROLLED_DOCUMENT: (client) => client.controlledDocumentVersion,
  SUPPLIER: (client) => client.supplierVersion,
  SUPPLIER_AUDIT: (client) => client.supplierAuditVersion,
  CAPA: (client) => client.capaVersion,
  NONCONFORMANCE: (client) => client.nonconformanceVersion,
  COMPLAINT: (client) => client.complaintVersion,
  INTERNAL_AUDIT: (client) => client.internalAuditVersion,
  MANAGEMENT_REVIEW: (client) => client.managementReviewVersion,
  TRAINING_RECORD: (client) => client.trainingRecordVersion,
  EQUIPMENT: (client) => client.equipmentVersion,
};

function delegateFor(type: ItemType, client: DbOrTx = db): VersionDelegate {
  return versionDelegateByType[type](client) as unknown as VersionDelegate;
}

export type VersionRow = {
  id: string;
  traceItemId: string;
  versionNumber: number;
  createdById: string;
  createdAt: Date;
  [key: string]: unknown;
};

/** Strips DB/audit metadata off a version row, leaving just domain fields. */
export function toPlainVersionData(version: VersionRow): Record<string, unknown> {
  const { id, traceItemId, versionNumber, createdById, createdAt, createdBy, ...rest } =
    version as VersionRow & { createdBy?: unknown };
  void id;
  void traceItemId;
  void versionNumber;
  void createdById;
  void createdAt;
  void createdBy;
  return rest;
}

export async function createItem(
  type: ItemType,
  data: Record<string, unknown>,
  actor: Actor,
  attachments: { name: string; url: string }[] = [],
  folderId: string | null = null
) {
  const config = getItemTypeConfig(type);
  const title = deriveTitle(config, data);

  return db.$transaction(async (tx) => {
    const seq = await tx.itemSequence.upsert({
      where: { itemType: type },
      create: { itemType: type, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    const humanCode = `${config.codePrefix}-${String(seq.lastNumber).padStart(3, "0")}`;

    const traceItem = await tx.traceItem.create({
      data: { itemType: type, humanCode, title, createdById: actor.id, folderId },
    });

    await delegateFor(type, tx).create({
      data: { traceItemId: traceItem.id, versionNumber: 1, createdById: actor.id, ...data },
    });

    await writeAuditLog(tx, {
      entityType: type,
      entityId: traceItem.id,
      action: AuditAction.CREATE,
      actor,
      afterState: { humanCode, title, versionNumber: 1, ...data },
    });

    for (const attachment of attachments) {
      await createAttachmentInTx(tx, traceItem.id, attachment.name, attachment.url, actor);
    }

    return traceItem;
  });
}

export async function createItemVersion(
  type: ItemType,
  traceItemId: string,
  data: Record<string, unknown>,
  actor: Actor
) {
  const config = getItemTypeConfig(type);

  return db.$transaction(async (tx) => {
    const traceItem = await tx.traceItem.findUniqueOrThrow({ where: { id: traceItemId } });
    const nextVersionNumber = traceItem.currentVersionNo + 1;
    const title = deriveTitle(config, data);

    const previousVersions = (await delegateFor(type, tx).findMany({
      where: { traceItemId, versionNumber: traceItem.currentVersionNo },
    })) as VersionRow[];
    const previousVersion = previousVersions[0];

    await delegateFor(type, tx).create({
      data: {
        traceItemId,
        versionNumber: nextVersionNumber,
        createdById: actor.id,
        ...data,
      },
    });

    const updated = await tx.traceItem.update({
      where: { id: traceItemId },
      data: { currentVersionNo: nextVersionNumber, title },
    });

    await writeAuditLog(tx, {
      entityType: type,
      entityId: traceItemId,
      action: AuditAction.UPDATE,
      actor,
      beforeState: previousVersion ? toPlainVersionData(previousVersion) : undefined,
      afterState: { versionNumber: nextVersionNumber, ...data },
      reasonForChange: `Created version ${nextVersionNumber}`,
    });

    return updated;
  });
}

/**
 * `folderId`: omit to return every item of the type regardless of folder
 * (used by Board/Grid views, which ignore folders); pass `null` for only
 * unfiled/root items; pass a folder id for only that folder's direct items.
 *
 * RETIRED items are excluded by default — they're kept for the audit trail
 * but shouldn't clutter the active lists; pass `includeRetired: true` to
 * show them (e.g. an explicit "show retired" toggle).
 */
export async function listItemsWithCurrentVersion(
  type: ItemType,
  folderId?: string | null,
  { includeRetired = false }: { includeRetired?: boolean } = {}
) {
  const items = await db.traceItem.findMany({
    where: {
      itemType: type,
      ...(folderId !== undefined ? { folderId } : {}),
      ...(includeRetired ? {} : { status: { not: ItemStatus.RETIRED } }),
    },
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
  });
  if (items.length === 0) return [];

  const versions = (await delegateFor(type).findMany({
    where: { traceItemId: { in: items.map((i) => i.id) } },
  })) as VersionRow[];

  const itemById = new Map(items.map((i) => [i.id, i]));
  const versionByItemId = new Map<string, VersionRow>();
  for (const v of versions) {
    if (v.versionNumber === itemById.get(v.traceItemId)?.currentVersionNo) {
      versionByItemId.set(v.traceItemId, v);
    }
  }

  return items.map((item) => ({
    item,
    version: versionByItemId.get(item.id) ?? null,
  }));
}

/** Count of RETIRED items hidden by the default view, for a "show retired" toggle. */
export async function countRetiredItems(type: ItemType, folderId?: string | null) {
  return db.traceItem.count({
    where: {
      itemType: type,
      status: ItemStatus.RETIRED,
      ...(folderId !== undefined ? { folderId } : {}),
    },
  });
}

/** Lightweight item list for populating link-target pickers. */
export async function listItemSummaries(types: ItemType[], excludeId?: string) {
  return db.traceItem.findMany({
    where: {
      itemType: { in: types },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, humanCode: true, title: true, itemType: true, status: true },
    orderBy: { humanCode: "asc" },
  });
}

export async function getItemWithCurrentVersion(type: ItemType, traceItemId: string) {
  const item = await db.traceItem.findUnique({
    where: { id: traceItemId },
    include: { createdBy: true },
  });
  if (!item || item.itemType !== type) return null;

  const versions = (await delegateFor(type).findMany({
    where: { traceItemId },
  })) as VersionRow[];
  const version = versions.find((v) => v.versionNumber === item.currentVersionNo) ?? null;

  return { item, version };
}

/**
 * Plain status change, not yet e-signature-gated (that arrives in Phase 5 for
 * APPROVED/EFFECTIVE transitions specifically). Fine for DRAFT/IN_REVIEW/
 * REJECTED/RETIRED/OBSOLETE bookkeeping in the meantime.
 */
export async function updateItemStatus(traceItemId: string, status: ItemStatus, actor: Actor) {
  return db.$transaction(async (tx) => {
    const before = await tx.traceItem.findUniqueOrThrow({ where: { id: traceItemId } });
    const updated = await tx.traceItem.update({ where: { id: traceItemId }, data: { status } });

    await writeAuditLog(tx, {
      entityType: before.itemType,
      entityId: traceItemId,
      action: AuditAction.STATUS_CHANGE,
      actor,
      beforeState: { status: before.status },
      afterState: { status },
    });

    return updated;
  });
}

export async function listVersionHistory(type: ItemType, traceItemId: string) {
  const versions = (await delegateFor(type).findMany({
    where: { traceItemId },
    orderBy: { versionNumber: "desc" },
    include: { createdBy: true },
  })) as VersionRow[];
  return versions;
}
