"use server";

import { notFound, redirect } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { parseItemForm } from "@/lib/domain/itemForm";
import { createItem } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import type { ItemFormState } from "../item-form";

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

  const item = await createItem(config.type, parsed.data, user);
  redirect(`/items/${config.slug}/${item.id}`);
}
