import { requireUser } from "@/lib/auth/session";
import { buildGapsCsv } from "@/lib/server/exports/gapsCsv";
import { writeAuditLog } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";

export async function GET() {
  const user = await requireUser();
  const csv = await buildGapsCsv();

  await writeAuditLog(db, {
    entityType: "Export",
    entityId: "gaps-csv",
    action: AuditAction.EXPORT,
    actor: user,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qms-coverage-gaps-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
