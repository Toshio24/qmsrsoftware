import "server-only";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";
import { writeAuditLog, type Actor } from "@/lib/server/audit";

export type ProductResult = { success: true; id?: string } | { success: false; error: string };

export async function listProducts() {
  return db.product.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getProduct(id: string) {
  return db.product.findUnique({ where: { id } });
}

/** The default product when no selection cookie is set (or it points at
 * something that no longer exists) — the oldest one, so this is stable. */
export async function getDefaultProduct() {
  return db.product.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function createProduct(name: string, actor: Actor): Promise<ProductResult> {
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Product name is required." };

  const existing = await db.product.findUnique({ where: { name: trimmedName } });
  if (existing) return { success: false, error: "A product with that name already exists." };

  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({ data: { name: trimmedName } });
    await writeAuditLog(tx, {
      entityType: "Product",
      entityId: created.id,
      action: AuditAction.CREATE,
      actor,
      afterState: { name: trimmedName },
    });
    return created;
  });

  return { success: true, id: product.id };
}
