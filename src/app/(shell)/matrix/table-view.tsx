import Link from "next/link";
import { getItemTypeConfig } from "@/lib/domain/itemTypes";
import { statusBadgeClasses } from "@/lib/domain/formatField";
import type { ItemType, ItemStatus } from "@/generated/prisma/enums";

type MatrixItem = {
  id: string;
  humanCode: string;
  title: string;
  itemType: ItemType;
  status: ItemStatus;
};

type MatrixLink = {
  id: string;
  linkType: string;
  sourceItem: MatrixItem;
  targetItem: MatrixItem;
};

export function TableView({
  items,
  links,
  focusId,
}: {
  items: MatrixItem[];
  links: MatrixLink[];
  focusId?: string;
}) {
  const linksByItemId = new Map<string, { direction: "out" | "in"; linkType: string; other: MatrixItem }[]>();
  for (const link of links) {
    if (!linksByItemId.has(link.sourceItem.id)) linksByItemId.set(link.sourceItem.id, []);
    if (!linksByItemId.has(link.targetItem.id)) linksByItemId.set(link.targetItem.id, []);
    linksByItemId.get(link.sourceItem.id)!.push({ direction: "out", linkType: link.linkType, other: link.targetItem });
    linksByItemId.get(link.targetItem.id)!.push({ direction: "in", linkType: link.linkType, other: link.sourceItem });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No items match this filter yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Links</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const config = getItemTypeConfig(item.itemType);
            const itemLinks = linksByItemId.get(item.id) ?? [];
            const isFocus = item.id === focusId;
            return (
              <tr
                key={item.id}
                className={
                  isFocus
                    ? "border-b border-neutral-100 bg-amber-50 last:border-0 dark:border-neutral-900 dark:bg-amber-900/20"
                    : "border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                }
              >
                <td className="px-3 py-2 font-mono text-xs">
                  <Link href={`/items/${config.slug}/${item.id}`} className="hover:underline">
                    {item.humanCode}
                  </Link>
                </td>
                <td className="px-3 py-2 text-neutral-500">{config.label}</td>
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
                <td className="px-3 py-2">
                  {itemLinks.length === 0 ? (
                    <span className="text-xs text-neutral-400">No links</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {itemLinks.map((l, i) => {
                        const otherConfig = getItemTypeConfig(l.other.itemType);
                        return (
                          <Link
                            key={i}
                            href={`/items/${otherConfig.slug}/${l.other.id}`}
                            className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
                            title={`${l.linkType} ${l.other.humanCode} (${l.other.status})`}
                          >
                            {l.direction === "out" ? "→" : "←"} {l.linkType} {l.other.humanCode}{" "}
                            <span className="text-neutral-400">({l.other.status})</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/matrix?view=table&focus=${item.id}`}
                    className="text-xs text-neutral-500 underline-offset-2 hover:underline"
                  >
                    Focus
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
