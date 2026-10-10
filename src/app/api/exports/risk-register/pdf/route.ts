import { requireUser } from "@/lib/auth/session";
import { getCurrentProduct } from "@/lib/auth/currentProduct";
import { renderRiskRegisterPdf } from "@/lib/server/exports/riskRegisterPdf";
import { writeAuditLog } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";
import { exportFilenamePart } from "@/lib/domain/product";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  const product = await getCurrentProduct();
  const pdf = await renderRiskRegisterPdf(product ?? undefined);

  await writeAuditLog(db, {
    entityType: "Export",
    entityId: "risk-register-pdf",
    action: AuditAction.EXPORT,
    actor: user,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="risk-register${exportFilenamePart(product)}-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
