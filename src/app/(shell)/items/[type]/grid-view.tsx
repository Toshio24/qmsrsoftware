import Link from "next/link";
import type { ItemTypeConfig } from "@/lib/domain/itemTypes";
import { statusBadgeClasses } from "@/lib/domain/formatField";
import type { ItemRow } from "./types";
import { EmptyState } from "./list-view";

export function GridView({ config, rows }: { config: ItemTypeConfig; rows: ItemRow[] }) {
  if (rows.length === 0) return <EmptyState config={config} />;
  const Icon = config.icon;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map(({ item }) => (
        <Link
          key={item.id}
          href={`/items/${config.slug}/${item.id}`}
          className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              <Icon className="h-4 w-4" />
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClasses(item.status)}`}>
              {item.status}
            </span>
          </div>
          <p className="font-mono text-xs text-neutral-500">{item.humanCode}</p>
          <p className="line-clamp-3 text-sm">{item.title}</p>
        </Link>
      ))}
    </div>
  );
}
