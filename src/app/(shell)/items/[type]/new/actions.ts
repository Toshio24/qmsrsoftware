"use server";

import { notFound, redirect } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { parseItemForm } from "@/lib/domain/itemForm";
import { createItem } from "@/lib/server/repository/items";
import { getFolder } from "@/lib/server/repository/folders";
import { addTraceLink } from "@/lib/server/repository/links";
import type { LinkType } from "@/generated/prisma/enums";
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
  folderId: string | null,
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const user = await requireUser();
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  // A folder id from another item type (or a stale/bad one) is treated as
  // unfiled rather than erroring — folders are scoped per item type.
  let targetFolderId: string | null = null;
  if (folderId) {
    const folder = await getFolder(folderId);
    if (folder && folder.itemType === config.type) targetFolderId = folder.id;
  }

  const parsed = parseItemForm(config, formData);
  if (!parsed.success) return { error: parsed.error };

  const attachments = extractAttachments(formData);
  const item = await createItem(config.type, parsed.data, user, attachments, targetFolderId);

  const linkType = formData.get("linkType") as LinkType | null;
  const targetItemId = formData.get("targetItemId") as string | null;
  if (linkType && targetItemId) {
    // Best-effort: the item itself was already created successfully, so a
    // failed link (e.g. a race with someone else) shouldn't block the
    // redirect — the user can add it from the item's page instead.
    await addTraceLink(item.id, targetItemId, linkType, user);
  }

  redirect(`/items/${config.slug}/${item.id}`);
}
