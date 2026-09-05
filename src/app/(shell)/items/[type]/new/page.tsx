import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { getFolder, getFolderPath } from "@/lib/server/repository/folders";
import { requireUser } from "@/lib/auth/session";
import { ItemForm } from "../item-form";
import { createItemAction } from "./actions";

export default async function NewItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  await requireUser();
  const { type: slug } = await params;
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const { folder: folderParam } = await searchParams;

  // A folder id from another item type (or a stale/bad one) is treated as
  // unfiled rather than erroring — folders are scoped per item type.
  let folderId: string | null = null;
  if (folderParam) {
    const folder = await getFolder(folderParam);
    if (folder && folder.itemType === config.type) folderId = folder.id;
  }
  const folderPath = folderId ? await getFolderPath(folderId) : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">New {config.label}</h1>
        {folderPath.length > 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            Will be created in{" "}
            <Link href={`/items/${config.slug}?folder=${folderId}`} className="hover:underline">
              {folderPath.map((f) => f.name).join(" / ")}
            </Link>
          </p>
        )}
      </div>
      <ItemForm
        fields={config.fields}
        action={createItemAction.bind(null, slug, folderId)}
        submitLabel="Create"
        allowAttachments
      />
    </div>
  );
}
