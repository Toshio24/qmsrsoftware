import { requireUser } from "@/lib/auth/session";
import { getCurrentProduct } from "@/lib/auth/currentProduct";
import { buildRiskRegisterCsv } from "@/lib/server/exports/riskRegisterCsv";
import { writeAuditLog } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";
import { exportFilenamePart } from "@/lib/domain/product";

export async function GET() {
  const user = await requireUser();
  const product = await getCurrentProduct();
  const csv = await buildRiskRegisterCsv(product?.id);

  await writeAuditLog(db, {
    entityType: "Export",
    entityId: "risk-register-csv",
    action: AuditAction.EXPORT,
    actor: user,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="risk-register${exportFilenamePart(product)}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
