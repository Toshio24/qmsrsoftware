import Link from "next/link";
import { ItemStatus } from "@/generated/prisma/enums";
import type { ItemTypeConfig } from "@/lib/domain/itemTypes";
import type { ItemRow } from "./types";
import { EmptyState } from "./list-view";

const COLUMNS: ItemStatus[] = [
  ItemStatus.DRAFT,
  ItemStatus.IN_REVIEW,
  ItemStatus.APPROVED,
  ItemStatus.EFFECTIVE,
  ItemStatus.REJECTED,
  ItemStatus.RETIRED,
  ItemStatus.OBSOLETE,
];

export function BoardView({ config, rows }: { config: ItemTypeConfig; rows: ItemRow[] }) {
  if (rows.length === 0) return <EmptyState config={config} />;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((status) => {
        const columnRows = rows.filter(({ item }) => item.status === status);
        if (columnRows.length === 0) return null;
        return (
          <div key={status} className="w-64 shrink-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {status.replace("_", " ")} ({columnRows.length})
            </p>
            <div className="flex flex-col gap-2">
              {columnRows.map(({ item }) => (
                <Link
                  key={item.id}
                  href={`/items/${config.slug}/${item.id}`}
                  className="block rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                >
                  <p className="font-mono text-xs text-neutral-500">{item.humanCode}</p>
                  <p className="mt-1 line-clamp-3">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
