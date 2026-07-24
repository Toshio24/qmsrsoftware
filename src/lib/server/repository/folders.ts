import "server-only";
import { db } from "@/lib/server/db";
import { AuditAction, ItemType, LinkStatus } from "@/generated/prisma/enums";
import { writeAuditLog, type Actor } from "@/lib/server/audit";

export type FolderResult = { success: true; id?: string } | { success: false; error: string };

export async function createFolder(
  itemType: ItemType,
  name: string,
  parentFolderId: string | null,
  actor: Actor
): Promise<FolderResult> {
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Folder name is required." };

  if (parentFolderId) {
    const parent = await db.folder.findUnique({ where: { id: parentFolderId } });
    if (!parent || parent.itemType !== itemType || parent.status !== LinkStatus.ACTIVE) {
      return { success: false, error: "Parent folder not found." };
    }
  }

  const folder = await db.$transaction(async (tx) => {
    const created = await tx.folder.create({
      data: { itemType, name: trimmedName, parentFolderId, createdById: actor.id },
    });
    await writeAuditLog(tx, {
      entityType: "Folder",
      entityId: created.id,
      action: AuditAction.CREATE,
      actor,
      afterState: { itemType, name: trimmedName, parentFolderId },
    });
    return created;
  });

  return { success: true, id: folder.id };
}

export async function renameFolder(
  folderId: string,
  name: string,
  actor: Actor
): Promise<FolderResult> {
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Folder name is required." };

  await db.$transaction(async (tx) => {
    const before = await tx.folder.findUniqueOrThrow({ where: { id: folderId } });
    await tx.folder.update({ where: { id: folderId }, data: { name: trimmedName } });
    await writeAuditLog(tx, {
      entityType: "Folder",
      entityId: folderId,
      action: AuditAction.UPDATE,
      actor,
      beforeState: { name: before.name },
      afterState: { name: trimmedName },
    });
  });

  return { success: true };
}

/** Soft-deletes a folder. Its direct items and subfolders move up to the
 * folder's own parent (or root) — nothing inside a deleted folder is itself
 * deleted or orphaned. */
export async function deleteFolder(folderId: string, actor: Actor): Promise<FolderResult> {
  await db.$transaction(async (tx) => {
    const folder = await tx.folder.findUniqueOrThrow({ where: { id: folderId } });

    await tx.traceItem.updateMany({
      where: { folderId },
      data: { folderId: folder.parentFolderId },
    });
    await tx.folder.updateMany({
      where: { parentFolderId: folderId },
      data: { parentFolderId: folder.parentFolderId },
    });
    await tx.folder.update({
      where: { id: folderId },
      data: { status: LinkStatus.REMOVED },
    });

    await writeAuditLog(tx, {
      entityType: "Folder",
      entityId: folderId,
      action: AuditAction.UPDATE,
      actor,
      beforeState: { status: LinkStatus.ACTIVE },
      afterState: { status: LinkStatus.REMOVED },
      reasonForChange: "Folder deleted; contents moved to parent folder",
    });
  });

  return { success: true };
}

export async function moveItemToFolder(
  traceItemId: string,
  folderId: string | null,
  actor: Actor
): Promise<FolderResult> {
  const item = await db.traceItem.findUnique({ where: { id: traceItemId } });
  if (!item) return { success: false, error: "Item not found." };

  if (folderId) {
    const folder = await db.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.status !== LinkStatus.ACTIVE) {
      return { success: false, error: "Folder not found." };
    }
    if (folder.itemType !== item.itemType) {
      return { success: false, error: "That folder belongs to a different item type." };
    }
  }

  await db.$transaction(async (tx) => {
    await tx.traceItem.update({ where: { id: traceItemId }, data: { folderId } });
    await writeAuditLog(tx, {
      entityType: item.itemType,
      entityId: traceItemId,
      action: AuditAction.UPDATE,
      actor,
      beforeState: { folderId: item.folderId },
      afterState: { folderId },
      reasonForChange: folderId ? "Moved into folder" : "Removed from folder",
    });
  });

  return { success: true };
}

/** Direct subfolders of `parentFolderId` (null = root) for one item type. */
export async function getFolderChildren(itemType: ItemType, parentFolderId: string | null) {
  return db.folder.findMany({
    where: { itemType, parentFolderId, status: LinkStatus.ACTIVE },
    orderBy: { name: "asc" },
  });
}

export async function getFolder(folderId: string) {
  return db.folder.findUnique({ where: { id: folderId } });
}

/** Root-to-leaf path for breadcrumbs. */
export async function getFolderPath(folderId: string) {
  const path: { id: string; name: string }[] = [];
  let currentId: string | null = folderId;
  while (currentId) {
    const folder: { id: string; name: string; parentFolderId: string | null } | null =
      await db.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentFolderId: true },
      });
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentFolderId;
  }
  return path;
}

/** Every active folder for a type, flattened into tree order with a depth
 * per node — for a "move to folder" picker that shows the whole tree. */
export async function getFoldersFlatForType(itemType: ItemType) {
  const all = await db.folder.findMany({
    where: { itemType, status: LinkStatus.ACTIVE },
    orderBy: { name: "asc" },
  });

  const childrenByParent = new Map<string | null, typeof all>();
  for (const folder of all) {
    const key = folder.parentFolderId;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(folder);
  }

  const flat: { id: string; name: string; depth: number }[] = [];
  function visit(parentId: string | null, depth: number) {
    for (const folder of childrenByParent.get(parentId) ?? []) {
      flat.push({ id: folder.id, name: folder.name, depth });
      visit(folder.id, depth + 1);
    }
  }
  visit(null, 0);

  return flat;
}
