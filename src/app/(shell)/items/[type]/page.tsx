import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { listItemsWithCurrentVersion } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { ListView } from "./list-view";
import { BoardView } from "./board-view";
import { GridView } from "./grid-view";

const VIEW_MODES = ["list", "board", "grid"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

export default async function ItemTypeListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  await requireUser();

  const { type: slug } = await params;
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const { view: viewParam } = await searchParams;
  const view: ViewMode = (VIEW_MODES as readonly string[]).includes(viewParam ?? "")
    ? (viewParam as ViewMode)
    : "list";

  const rows = await listItemsWithCurrentVersion(config.type);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{config.pluralLabel}</h1>
          <p className="text-sm text-neutral-500">
            {rows.length} item{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href={`/items/${config.slug}/new`}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          New {config.label}
        </Link>
      </div>

      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {VIEW_MODES.map((mode) => (
          <Link
            key={mode}
            href={`/items/${config.slug}?view=${mode}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-1.5 text-sm capitalize",
              view === mode
                ? "border-neutral-900 font-medium dark:border-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            {mode}
          </Link>
        ))}
      </div>

      {view === "list" && <ListView config={config} rows={rows} />}
      {view === "board" && <BoardView config={config} rows={rows} />}
      {view === "grid" && <GridView config={config} rows={rows} />}
    </div>
  );
}
