import "server-only";
import { db } from "@/lib/server/db";
import { AuditAction, LinkStatus } from "@/generated/prisma/enums";
import { writeAuditLog, type Actor, type DbOrTx } from "@/lib/server/audit";

export type AddCustomFieldResult = { success: true } | { success: false; error: string };

/** Core create logic, usable either standalone (own transaction) or nested
 * inside another operation's transaction (e.g. creating an item with custom
 * fields in one go). Silently skips rows missing a label or value. */
export async function createCustomFieldInTx(
  tx: DbOrTx,
  traceItemId: string,
  label: string,
  value: string,
  actor: Actor
) {
  const trimmedLabel = label.trim();
  const trimmedValue = value.trim();
  if (!trimmedLabel || !trimmedValue) return null;

  const created = await tx.customField.create({
    data: { traceItemId, label: trimmedLabel, value: trimmedValue, addedById: actor.id },
  });

  await writeAuditLog(tx, {
    entityType: "CustomField",
    entityId: created.id,
    action: AuditAction.CUSTOM_FIELD_ADD,
    actor,
    afterState: { traceItemId, label: trimmedLabel, value: trimmedValue },
  });

  return created;
}

export async function addCustomField(
  traceItemId: string,
  label: string,
  value: string,
  actor: Actor
): Promise<AddCustomFieldResult> {
  if (!label.trim()) return { success: false, error: "Label is required." };
  if (!value.trim()) return { success: false, error: "Value is required." };

  await db.$transaction((tx) => createCustomFieldInTx(tx, traceItemId, label, value, actor));
  return { success: true };
}

export async function removeCustomField(customFieldId: string, actor: Actor) {
  await db.$transaction(async (tx) => {
    const before = await tx.customField.findUniqueOrThrow({ where: { id: customFieldId } });

    await tx.customField.update({
      where: { id: customFieldId },
      data: { status: LinkStatus.REMOVED, removedById: actor.id, removedAt: new Date() },
    });

    await writeAuditLog(tx, {
      entityType: "CustomField",
      entityId: customFieldId,
      action: AuditAction.CUSTOM_FIELD_REMOVE,
      actor,
      beforeState: { label: before.label, value: before.value },
    });
  });
}

export async function getCustomFieldsForItem(traceItemId: string) {
  return db.customField.findMany({
    where: { traceItemId, status: LinkStatus.ACTIVE },
    include: { addedBy: true },
    orderBy: { addedAt: "asc" },
  });
}
