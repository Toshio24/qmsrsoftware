import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import { UserRole, AuditAction } from "@/generated/prisma/enums";
import { getEntityLabel as entityLabel } from "@/lib/domain/itemTypes";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entityType?: string; actor?: string }>;
}) {
  await requireRole([UserRole.ADMIN, UserRole.QA, UserRole.AUDITOR_READONLY]);
  const { action, entityType, actor } = await searchParams;

  const entries = await db.auditLog.findMany({
    where: {
      ...(action ? { action: action as AuditAction } : {}),
      ...(entityType ? { entityType } : {}),
      ...(actor ? { actorUsernameSnapshot: { contains: actor, mode: "insensitive" } } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  const distinctEntityTypes = await db.auditLog.findMany({
    distinct: ["entityType"],
    select: { entityType: true },
    orderBy: { entityType: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Append-only record of every create, edit, status change, link, and auth event.
          Showing the most recent 200 matching entries.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <label className="text-sm font-medium">Action</label>
          <select
            name="action"
            defaultValue={action ?? ""}
            className="mt-1 block rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">All actions</option>
            {Object.values(AuditAction).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Entity type</label>
          <select
            name="entityType"
            defaultValue={entityType ?? ""}
            className="mt-1 block rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">All entity types</option>
            {distinctEntityTypes.map((e) => (
              <option key={e.entityType} value={e.entityType}>
                {entityLabel(e.entityType)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Actor username contains</label>
          <input
            type="text"
            name="actor"
            defaultValue={actor ?? ""}
            className="mt-1 block rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2">Timestamp</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id.toString()}
                className="border-b border-neutral-100 align-top last:border-0 dark:border-neutral-900"
              >
                <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-500">
                  {entry.timestamp.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs font-medium">{entry.action}</td>
                <td className="px-3 py-2 text-xs">
                  {entityLabel(entry.entityType)}
                  <br />
                  <span className="font-mono text-neutral-400">{entry.entityId}</span>
                </td>
                <td className="px-3 py-2 text-xs">{entry.actorUsernameSnapshot}</td>
                <td className="px-3 py-2 text-xs text-neutral-500">{entry.reasonForChange ?? "—"}</td>
                <td className="px-3 py-2 text-xs">
                  {(entry.beforeState || entry.afterState) && (
                    <details>
                      <summary className="cursor-pointer text-neutral-500">View</summary>
                      {entry.beforeState !== null && (
                        <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-neutral-50 p-2 text-[10px] dark:bg-neutral-900">
                          before: {JSON.stringify(entry.beforeState)}
                        </pre>
                      )}
                      {entry.afterState !== null && (
                        <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-neutral-50 p-2 text-[10px] dark:bg-neutral-900">
                          after: {JSON.stringify(entry.afterState)}
                        </pre>
                      )}
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-500">No matching audit entries.</p>
        )}
      </div>
    </div>
  );
}
