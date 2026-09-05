import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug, itemTypeByType } from "@/lib/domain/itemTypes";
import { getLinkRulesForSourceType } from "@/lib/domain/linkRules";
import { ItemType } from "@/generated/prisma/enums";
import { countRetiredItems, listItemsWithCurrentVersion } from "@/lib/server/repository/items";
import {
  getFolder,
  getFolderChildren,
  getFolderPath,
  getFoldersFlatForType,
} from "@/lib/server/repository/folders";
import { getLinkedTargetsByType } from "@/lib/server/repository/links";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { BoardView } from "./board-view";
import { GridView } from "./grid-view";
import { FolderBrowser } from "./folder-browser";

const VIEW_MODES = ["list", "board", "grid"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

export default async function ItemTypeListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ view?: string; folder?: string; retired?: string }>;
}) {
  await requireUser();

  const { type: slug } = await params;
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const { view: viewParam, folder: folderParam, retired: retiredParam } = await searchParams;
  const view: ViewMode = (VIEW_MODES as readonly string[]).includes(viewParam ?? "")
    ? (viewParam as ViewMode)
    : "list";
  const showRetired = retiredParam === "1";

  // A folder id from another item type (or a stale/bad one) is treated as
  // root rather than erroring — folders are scoped per item type.
  let currentFolderId: string | null = null;
  if (folderParam) {
    const folder = await getFolder(folderParam);
    if (folder && folder.itemType === config.type) currentFolderId = folder.id;
  }

  let listContent: React.ReactNode;
  let totalCount: number;
  let retiredCount: number;

  if (view === "list") {
    const [subfolders, rows, folderPath, allFoldersFlat, retiredHiddenCount] = await Promise.all([
      getFolderChildren(config.type, currentFolderId),
      listItemsWithCurrentVersion(config.type, currentFolderId, { includeRetired: showRetired }),
      currentFolderId ? getFolderPath(currentFolderId) : Promise.resolve([]),
      getFoldersFlatForType(config.type),
      countRetiredItems(config.type, currentFolderId),
    ]);
    totalCount = rows.length + subfolders.length;
    retiredCount = retiredHiddenCount;

    // Only show a "linked X" column when this item type actually has an
    // outgoing relationship to User Needs (e.g. Design Input, Risk) — not
    // meaningful for every item type.
    const linksToUserNeeds = getLinkRulesForSourceType(config.type).some((r) =>
      r.targetTypes.includes(ItemType.USER_NEED)
    );
    const linkedUserNeedsByItemId = linksToUserNeeds
      ? await getLinkedTargetsByType(rows.map(({ item }) => item.id), ItemType.USER_NEED)
      : new Map<string, { id: string; humanCode: string }[]>();

    listContent = (
      <FolderBrowser
        slug={config.slug}
        itemLabel={config.label}
        pluralLabel={config.pluralLabel}
        currentFolderId={currentFolderId}
        folderPath={folderPath}
        subfolders={subfolders}
        items={rows.map(({ item, version }) => ({
          id: item.id,
          humanCode: item.humanCode,
          title: (version?.[config.titleField] as string | undefined) || item.title,
          status: item.status,
        }))}
        allFoldersFlat={allFoldersFlat}
        linkedColumnLabel={linksToUserNeeds ? itemTypeByType.get(ItemType.USER_NEED)?.label : undefined}
        linkedColumnSlug={itemTypeByType.get(ItemType.USER_NEED)?.slug}
        linkedItemsByItemId={Object.fromEntries(linkedUserNeedsByItemId)}
      />
    );
  } else {
    const [rows, retiredHiddenCount] = await Promise.all([
      listItemsWithCurrentVersion(config.type, undefined, { includeRetired: showRetired }),
      countRetiredItems(config.type),
    ]);
    totalCount = rows.length;
    retiredCount = retiredHiddenCount;
    listContent = view === "board" ? <BoardView config={config} rows={rows} /> : <GridView config={config} rows={rows} />;
  }

  const retiredToggleHref = (() => {
    const p = new URLSearchParams();
    if (viewParam) p.set("view", viewParam);
    if (currentFolderId) p.set("folder", currentFolderId);
    if (!showRetired) p.set("retired", "1");
    const qs = p.toString();
    return `/items/${config.slug}${qs ? `?${qs}` : ""}`;
  })();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{config.pluralLabel}</h1>
          <p className="text-sm text-neutral-500">
            {totalCount} item{totalCount === 1 ? "" : "s"}
            {retiredCount > 0 && (
              <>
                {" · "}
                <Link href={retiredToggleHref} className="underline-offset-2 hover:underline">
                  {showRetired
                    ? "hide retired"
                    : `${retiredCount} retired hidden — show`}
                </Link>
              </>
            )}
          </p>
        </div>
        <Link
          href={
            currentFolderId
              ? `/items/${config.slug}/new?folder=${currentFolderId}`
              : `/items/${config.slug}/new`
          }
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          New {config.label}
        </Link>
      </div>

      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {VIEW_MODES.map((mode) => {
          const p = new URLSearchParams({ view: mode });
          if (currentFolderId) p.set("folder", currentFolderId);
          if (showRetired) p.set("retired", "1");
          return (
            <Link
              key={mode}
              href={`/items/${config.slug}?${p.toString()}`}
              className={cn(
                "-mb-px border-b-2 px-3 py-1.5 text-sm capitalize",
                view === mode
                  ? "border-neutral-900 font-medium dark:border-neutral-100"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              {mode}
            </Link>
          );
        })}
      </div>

      {listContent}
    </div>
  );
}
