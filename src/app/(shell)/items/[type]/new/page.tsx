import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug, itemTypeByType } from "@/lib/domain/itemTypes";
import { getLinkRulesForSourceType } from "@/lib/domain/linkRules";
import { getFolder, getFolderPath } from "@/lib/server/repository/folders";
import {
  getCurrentVersionsForItems,
  getDistinctFieldValues,
  listItemSummaries,
} from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import { getCurrentProduct } from "@/lib/auth/currentProduct";
import { isProductScopedType } from "@/lib/domain/itemTypes";
import { ItemForm } from "../item-form";
import { LinkPickerFields } from "../link-picker-fields";
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

  const product = await getCurrentProduct();
  const currentProductId = product?.id;
  // The product this new item itself will belong to — null for unscoped
  // (Quality Operations) types, which are never tied to a product.
  const itemProductId = isProductScopedType(config.type) ? (currentProductId ?? null) : null;

  // A folder id from another item type/product (or a stale/bad one) is
  // treated as unfiled rather than erroring — folders are scoped per item
  // type and, for product-scoped types, per product too.
  let folderId: string | null = null;
  if (folderParam) {
    const folder = await getFolder(folderParam);
    if (folder && folder.itemType === config.type && folder.productId === itemProductId) {
      folderId = folder.id;
    }
  }
  const folderPath = folderId ? await getFolderPath(folderId) : [];
  const backHref = folderId ? `/items/${config.slug}?folder=${folderId}` : `/items/${config.slug}`;

  const sourceRules = getLinkRulesForSourceType(config.type);
  const targetTypesNeeded = Array.from(new Set(sourceRules.flatMap((r) => r.targetTypes)));
  // Link candidates are restricted to the current product (plus every
  // unscoped/shared record) regardless of whether the new item itself is
  // product-scoped — e.g. a new CAPA should only offer the current
  // product's Risk Analyses to address, not another product's.
  const candidates =
    targetTypesNeeded.length > 0
      ? await listItemSummaries(targetTypesNeeded, undefined, currentProductId)
      : [];

  const candidateItemsByType: Record<
    string,
    { id: string; humanCode: string; title: string; status: string }[]
  > = {};
  for (const c of candidates) {
    (candidateItemsByType[c.itemType] ??= []).push(c);
  }

  const typeLabelByType: Record<string, string> = {};
  const fieldsByType: Record<string, (typeof config.fields)> = {};
  for (const [type, typeConfig] of itemTypeByType) {
    typeLabelByType[type] = typeConfig.label;
    fieldsByType[type] = typeConfig.fields;
  }

  const previewByItemId = Object.fromEntries(
    (await getCurrentVersionsForItems(candidates)).entries()
  );

  const suggestFields = config.fields.filter((f) => f.suggestFromExisting);
  const fieldSuggestions = Object.fromEntries(
    await Promise.all(
      suggestFields.map(async (f) => [f.key, await getDistinctFieldValues(config.type, f.key)] as const)
    )
  );

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 hover:underline dark:hover:text-neutral-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {config.pluralLabel}
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">New {config.label}</h1>
          {itemProductId && product && (
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
              {product.name}
            </span>
          )}
        </div>
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
        action={createItemAction.bind(null, slug, folderId, itemProductId)}
        submitLabel="Create"
        allowAttachments
        allowCustomFields
        cancelHref={backHref}
        fieldSuggestions={fieldSuggestions}
        linkPicker={
          sourceRules.length > 0 && (
            <LinkPickerFields
              rules={sourceRules.map((r) => ({
                linkType: r.linkType,
                label: r.label,
                targetTypes: r.targetTypes,
              }))}
              candidateItemsByType={candidateItemsByType}
              typeLabelByType={typeLabelByType}
              fieldsByType={fieldsByType}
              previewByItemId={previewByItemId}
            />
          )
        }
      />
    </div>
  );
}
