import Link from "next/link";
import type { ItemTypeConfig } from "@/lib/domain/itemTypes";
import { statusBadgeClasses } from "@/lib/domain/formatField";
import type { ItemRow } from "./types";

export function ListView({ config, rows }: { config: ItemTypeConfig; rows: ItemRow[] }) {
  if (rows.length === 0) {
    return <EmptyState config={config} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Version</th>
            <th className="px-3 py-2">Created by</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item }) => (
            <tr
              key={item.id}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900"
            >
              <td className="px-3 py-2 font-mono text-xs">
                <Link href={`/items/${config.slug}/${item.id}`} className="hover:underline">
                  {item.humanCode}
                </Link>
              </td>
              <td className="px-3 py-2">
                <Link href={`/items/${config.slug}/${item.id}`} className="hover:underline">
                  {item.title}
                </Link>
              </td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClasses(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-3 py-2 text-neutral-500">v{item.currentVersionNo}</td>
              <td className="px-3 py-2 text-neutral-500">{item.createdBy.fullName}</td>
              <td className="px-3 py-2 text-neutral-500">
                {item.createdAt.toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ config }: { config: ItemTypeConfig }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
      No {config.pluralLabel.toLowerCase()} yet.{" "}
      <Link href={`/items/${config.slug}/new`} className="underline">
        Create the first one
      </Link>
      .
    </div>
  );
}
