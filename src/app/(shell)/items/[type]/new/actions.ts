"use server";

import { notFound, redirect } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { parseItemForm } from "@/lib/domain/itemForm";
import { createItem } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import type { ItemFormState } from "../item-form";

function extractAttachments(formData: FormData) {
  const names = formData.getAll("attachmentName") as string[];
  const urls = formData.getAll("attachmentUrl") as string[];
  return names
    .map((name, i) => ({ name: name.trim(), url: (urls[i] ?? "").trim() }))
    .filter((a) => a.name && a.url);
}

export async function createItemAction(
  slug: string,
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const user = await requireUser();
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const parsed = parseItemForm(config, formData);
  if (!parsed.success) return { error: parsed.error };

  const attachments = extractAttachments(formData);
  const item = await createItem(config.type, parsed.data, user, attachments);
  redirect(`/items/${config.slug}/${item.id}`);
}
