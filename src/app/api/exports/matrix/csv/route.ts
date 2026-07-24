import { requireUser } from "@/lib/auth/session";
import { buildMatrixCsv } from "@/lib/server/exports/matrixCsv";
import { writeAuditLog } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";

export async function GET() {
  const user = await requireUser();
  const csv = await buildMatrixCsv();

  await writeAuditLog(db, {
    entityType: "Export",
    entityId: "matrix-csv",
    action: AuditAction.EXPORT,
    actor: user,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qms-trace-matrix-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
