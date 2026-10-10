import "server-only";
import { db } from "@/lib/server/db";

export type TableSizeRow = { name: string; bytes: number; rows: number };
export type DatabaseStats = {
  totalBytes: number;
  tables: TableSizeRow[];
};

function toNumber(value: unknown): number {
  // pg (via @prisma/adapter-pg) can hand back bigint columns as a JS bigint,
  // a string, or a number depending on the value's size — normalize all three.
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
}

/**
 * Postgres-specific (works against both the local docker-compose instance
 * and a hosted Neon database — both are plain Postgres). Used for the
 * storage readout in Admin → Settings; not meant for frequent polling, just
 * an occasional admin check.
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const totalRows = await db.$queryRaw<{ bytes: unknown }[]>`
    SELECT pg_database_size(current_database()) AS bytes
  `;

  const tableRows = await db.$queryRaw<{ name: string; bytes: unknown; rows: unknown }[]>`
    SELECT relname AS name, pg_total_relation_size(relid) AS bytes, n_live_tup AS rows
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 10
  `;

  return {
    totalBytes: toNumber(totalRows[0]?.bytes),
    tables: tableRows.map((t) => ({ name: t.name, bytes: toNumber(t.bytes), rows: toNumber(t.rows) })),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value < 10 ? 2 : 1)} ${units[unitIndex]}`;
}
