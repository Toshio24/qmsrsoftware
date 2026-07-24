import "server-only";
import crypto from "node:crypto";
import { db } from "@/lib/server/db";
import { verifyPassword } from "@/lib/auth/password";
import { AuditAction, ItemStatus, ItemType, SignatureMeaning } from "@/generated/prisma/enums";
import { writeAuditLog, type Actor } from "@/lib/server/audit";
import { getItemWithCurrentVersion, listVersionHistory, toPlainVersionData } from "./items";
import { ATTESTATION_TEXT } from "@/lib/domain/attestation";

/** Which current statuses a signed transition into `targetStatus` may start from. */
const VALID_SIGNED_TRANSITIONS: Partial<Record<ItemStatus, ItemStatus[]>> = {
  [ItemStatus.APPROVED]: [ItemStatus.DRAFT, ItemStatus.IN_REVIEW],
  [ItemStatus.REJECTED]: [ItemStatus.DRAFT, ItemStatus.IN_REVIEW],
  [ItemStatus.EFFECTIVE]: [ItemStatus.APPROVED],
};

export type SignResult = { success: true } | { success: false; error: string };

function computeContentHash(data: Record<string, unknown>): string {
  const sorted = Object.keys(data)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {});
  return crypto.createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}

async function verifyActorPassword(actorId: string, password: string): Promise<SignResult> {
  const user = await db.user.findUniqueOrThrow({ where: { id: actorId } });
  const valid = await verifyPassword(user.passwordHash, password);
  return valid ? { success: true } : { success: false, error: "Incorrect password." };
}

/**
 * Signs the item's current version and moves it to `targetStatus`. Requires
 * re-entering the signer's password (checked here, independent of the
 * session) — see plan §"Electronic signatures" (21 CFR 11.200(a)(1)).
 */
export async function signAndTransition({
  itemType,
  traceItemId,
  targetStatus,
  meaning,
  password,
  actor,
}: {
  itemType: ItemType;
  traceItemId: string;
  targetStatus: ItemStatus;
  meaning: SignatureMeaning;
  password: string;
  actor: Actor;
}): Promise<SignResult> {
  const passwordCheck = await verifyActorPassword(actor.id, password);
  if (!passwordCheck.success) return passwordCheck;

  const result = await getItemWithCurrentVersion(itemType, traceItemId);
  if (!result || !result.version) return { success: false, error: "Item not found." };
  const { item, version } = result;

  const allowedFrom = VALID_SIGNED_TRANSITIONS[targetStatus];
  if (!allowedFrom || !allowedFrom.includes(item.status)) {
    return {
      success: false,
      error: `Can't sign into ${targetStatus} from ${item.status}.`,
    };
  }

  if (
    itemType === ItemType.CONTROLLED_DOCUMENT &&
    (targetStatus === ItemStatus.APPROVED || targetStatus === ItemStatus.EFFECTIVE) &&
    !version.pdfSnapshotUrl
  ) {
    return {
      success: false,
      error:
        "A PDF snapshot is required before this document revision can be approved or made effective.",
    };
  }

  const contentHash = computeContentHash(toPlainVersionData(version));

  await db.$transaction(async (tx) => {
    await tx.eSignature.create({
      data: {
        entityType: itemType,
        entityId: version.id,
        signerId: actor.id,
        meaning,
        attestationTextSnapshot: ATTESTATION_TEXT,
        contentHash,
      },
    });

    await tx.traceItem.update({ where: { id: traceItemId }, data: { status: targetStatus } });

    await writeAuditLog(tx, {
      entityType: itemType,
      entityId: traceItemId,
      action: AuditAction.SIGNATURE,
      actor,
      beforeState: { status: item.status },
      afterState: { status: targetStatus, meaning, signedVersionId: version.id, contentHash },
      reasonForChange: `Signed version ${version.versionNumber} as ${meaning}`,
    });
  });

  return { success: true };
}

/** Records a signature (e.g. a peer review sign-off) without changing status. */
export async function signOnly({
  itemType,
  traceItemId,
  meaning,
  password,
  actor,
}: {
  itemType: ItemType;
  traceItemId: string;
  meaning: SignatureMeaning;
  password: string;
  actor: Actor;
}): Promise<SignResult> {
  const passwordCheck = await verifyActorPassword(actor.id, password);
  if (!passwordCheck.success) return passwordCheck;

  const result = await getItemWithCurrentVersion(itemType, traceItemId);
  if (!result || !result.version) return { success: false, error: "Item not found." };
  const { version } = result;

  const contentHash = computeContentHash(toPlainVersionData(version));

  await db.$transaction(async (tx) => {
    await tx.eSignature.create({
      data: {
        entityType: itemType,
        entityId: version.id,
        signerId: actor.id,
        meaning,
        attestationTextSnapshot: ATTESTATION_TEXT,
        contentHash,
      },
    });

    await writeAuditLog(tx, {
      entityType: itemType,
      entityId: traceItemId,
      action: AuditAction.SIGNATURE,
      actor,
      afterState: { meaning, signedVersionId: version.id, contentHash },
      reasonForChange: `Signed version ${version.versionNumber} as ${meaning}`,
    });
  });

  return { success: true };
}

export async function getSignaturesForItem(itemType: ItemType, traceItemId: string) {
  const versions = await listVersionHistory(itemType, traceItemId);
  const versionNumberById = new Map(versions.map((v) => [v.id, v.versionNumber]));
  const versionIds = versions.map((v) => v.id);
  if (versionIds.length === 0) return [];

  const signatures = await db.eSignature.findMany({
    where: { entityId: { in: versionIds } },
    include: { signer: true },
    orderBy: { signedAt: "desc" },
  });

  return signatures.map((sig) => ({
    ...sig,
    versionNumber: versionNumberById.get(sig.entityId) ?? null,
  }));
}
