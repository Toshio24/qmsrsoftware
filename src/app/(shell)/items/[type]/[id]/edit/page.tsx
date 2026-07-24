import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { getItemWithCurrentVersion } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import { ItemForm } from "../../item-form";
import { createItemVersionAction } from "./actions";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  await requireUser();
  const { type: slug, id } = await params;
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const result = await getItemWithCurrentVersion(config.type, id);
  if (!result || !result.version) notFound();
  const { item, version } = result;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-mono text-xs text-neutral-500">{item.humanCode}</p>
        <h1 className="text-2xl font-semibold">
          Edit {config.label} — creates version {item.currentVersionNo + 1}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          The current version is kept as history; this saves a new one.
        </p>
      </div>
      <ItemForm
        fields={config.fields}
        action={createItemVersionAction.bind(null, slug, item.id)}
        defaultValues={version}
        submitLabel="Save new version"
      />
    </div>
  );
}
