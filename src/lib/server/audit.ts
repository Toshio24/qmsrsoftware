import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
export type DbOrTx = typeof db | TxClient;

/** The minimal identity every audited action needs — pass the full
 * SessionUser through, only id/username are read. */
export type Actor = { id: string; username: string };

export type AuditEntry = {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actor: Actor | null;
  /** Used instead of `actor` for events where the actor may not exist yet,
   * e.g. a failed login against an unknown username. */
  actorUsernameOverride?: string;
  beforeState?: unknown;
  afterState?: unknown;
  reasonForChange?: string;
};

async function getRequestIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]!.trim();
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}

/** Round-trips through JSON so Dates/enums/etc. become plain JSON-safe
 * values Prisma's Json columns will accept. */
function toJsonSafe(value: unknown): object | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as object;
}

export async function writeAuditLog(client: DbOrTx, entry: AuditEntry) {
  const ipAddress = await getRequestIp();
  await client.auditLog.create({
    data: {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      actorUserId: entry.actor?.id ?? null,
      actorUsernameSnapshot: entry.actor?.username ?? entry.actorUsernameOverride ?? "unknown",
      beforeState: toJsonSafe(entry.beforeState),
      afterState: toJsonSafe(entry.afterState),
      reasonForChange: entry.reasonForChange,
      ipAddress,
    },
  });
}
