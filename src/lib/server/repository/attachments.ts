import "server-only";
import { db } from "@/lib/server/db";
import { AuditAction, LinkStatus } from "@/generated/prisma/enums";
import { writeAuditLog, type Actor, type DbOrTx } from "@/lib/server/audit";
import { normalizeUrl } from "@/lib/domain/url";

export type AddAttachmentResult = { success: true } | { success: false; error: string };

/** Core create logic, usable either standalone (own transaction) or nested
 * inside another operation's transaction (e.g. creating an item with
 * attachments in one go). Silently skips rows missing a name or link. */
export async function createAttachmentInTx(
  tx: DbOrTx,
  traceItemId: string,
  name: string,
  url: string,
  actor: Actor
) {
  const trimmedName = name.trim();
  const normalizedUrl = normalizeUrl(url);
  if (!trimmedName || !normalizedUrl) return null;

  const created = await tx.attachment.create({
    data: { traceItemId, name: trimmedName, url: normalizedUrl, addedById: actor.id },
  });

  await writeAuditLog(tx, {
    entityType: "Attachment",
    entityId: created.id,
    action: AuditAction.ATTACHMENT_ADD,
    actor,
    afterState: { traceItemId, name: trimmedName, url: normalizedUrl },
  });

  return created;
}

export async function addAttachment(
  traceItemId: string,
  name: string,
  url: string,
  actor: Actor
): Promise<AddAttachmentResult> {
  if (!name.trim()) return { success: false, error: "Name is required." };
  if (!normalizeUrl(url)) return { success: false, error: "Link is required." };

  await db.$transaction((tx) => createAttachmentInTx(tx, traceItemId, name, url, actor));
  return { success: true };
}

export async function removeAttachment(attachmentId: string, actor: Actor) {
  await db.$transaction(async (tx) => {
    const before = await tx.attachment.findUniqueOrThrow({ where: { id: attachmentId } });

    await tx.attachment.update({
      where: { id: attachmentId },
      data: { status: LinkStatus.REMOVED, removedById: actor.id, removedAt: new Date() },
    });

    await writeAuditLog(tx, {
      entityType: "Attachment",
      entityId: attachmentId,
      action: AuditAction.ATTACHMENT_REMOVE,
      actor,
      beforeState: { name: before.name, url: before.url },
    });
  });
}

export async function getAttachmentsForItem(traceItemId: string) {
  return db.attachment.findMany({
    where: { traceItemId, status: LinkStatus.ACTIVE },
    include: { addedBy: true },
    orderBy: { addedAt: "desc" },
  });
}
