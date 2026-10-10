import { requireUser } from "@/lib/auth/session";
import { getCurrentProduct } from "@/lib/auth/currentProduct";
import { buildGapsCsv } from "@/lib/server/exports/gapsCsv";
import { writeAuditLog } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";
import { exportFilenamePart } from "@/lib/domain/product";

export async function GET() {
  const user = await requireUser();
  const product = await getCurrentProduct();
  const csv = await buildGapsCsv(product?.id);

  await writeAuditLog(db, {
    entityType: "Export",
    entityId: "gaps-csv",
    action: AuditAction.EXPORT,
    actor: user,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qms-coverage-gaps${exportFilenamePart(product)}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
