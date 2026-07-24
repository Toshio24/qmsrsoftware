import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { requireUser } from "@/lib/auth/session";
import { ItemForm } from "../item-form";
import { createItemAction } from "./actions";

export default async function NewItemPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  await requireUser();
  const { type: slug } = await params;
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">New {config.label}</h1>
      <ItemForm
        fields={config.fields}
        action={createItemAction.bind(null, slug)}
        submitLabel="Create"
      />
    </div>
  );
}
