import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMatrixItems, getMatrixLinks, computeConnectedIds } from "@/lib/server/repository/matrix";
import { itemTypeRegistry, itemTypeBySlug } from "@/lib/domain/itemTypes";
import { ItemType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { TableView } from "./table-view";
import { FlowChartView } from "./flow-chart-view";

const VIEW_MODES = ["table", "flow"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

export default async function MatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; type?: string; focus?: string }>;
}) {
  await requireUser();
  const { view: viewParam, type: typeSlug, focus } = await searchParams;
  const view: ViewMode = viewParam === "flow" ? "flow" : "table";

  const typeConfig = typeSlug ? itemTypeBySlug.get(typeSlug) : undefined;
  const typeFilter: ItemType | undefined = typeConfig?.type;

  // Always load the full unfiltered graph — the type filter and focus mode
  // are both applied in JS below, since a focus chain can span item types
  // outside whatever type filter happens to be selected.
  const [allItems, allLinks] = await Promise.all([getMatrixItems(), getMatrixLinks()]);

  let items = typeFilter ? allItems.filter((i) => i.itemType === typeFilter) : allItems;
  let links = allLinks;

  if (focus) {
    const connected = computeConnectedIds(focus, allLinks);
    items = allItems.filter((i) => connected.has(i.id));
    links = allLinks.filter((l) => connected.has(l.sourceItemId) && connected.has(l.targetItemId));
  }

  const baseParams = new URLSearchParams();
  if (typeSlug) baseParams.set("type", typeSlug);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trace Matrix</h1>
          <p className="text-sm text-neutral-500">
            {focus
              ? `Showing the full upstream/downstream chain for the focused item (${items.length} item${items.length === 1 ? "" : "s"}).`
              : `${items.length} item${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {focus && (
            <Link
              href={`/matrix?view=${view}${typeSlug ? `&type=${typeSlug}` : ""}`}
              className="text-sm text-neutral-500 underline-offset-2 hover:underline"
            >
              Clear focus
            </Link>
          )}
          <Link href="/matrix/gaps" className="text-sm underline-offset-2 hover:underline">
            Coverage gaps →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <div className="flex gap-1">
          {VIEW_MODES.map((mode) => {
            const params = new URLSearchParams(baseParams);
            params.set("view", mode);
            if (focus) params.set("focus", focus);
            return (
              <Link
                key={mode}
                href={`/matrix?${params.toString()}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm capitalize",
                  view === mode
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                {mode === "flow" ? "Flow chart" : mode}
              </Link>
            );
          })}
        </div>

        <form className="flex items-center gap-2">
          <input type="hidden" name="view" value={view} />
          {focus && <input type="hidden" name="focus" value={focus} />}
          <label className="text-sm text-neutral-500">Filter by type:</label>
          <select
            name="type"
            defaultValue={typeSlug ?? ""}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">All types</option>
            {itemTypeRegistry.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.pluralLabel}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            Apply
          </button>
        </form>
      </div>

      {view === "table" ? (
        <TableView items={items} links={links} focusId={focus} />
      ) : (
        <FlowChartView items={items} links={links} />
      )}
    </div>
  );
}
