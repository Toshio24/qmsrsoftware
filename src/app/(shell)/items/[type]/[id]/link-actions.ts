"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addTraceLink, removeTraceLink } from "@/lib/server/repository/links";
import { LinkType } from "@/generated/prisma/enums";

export type AddLinkFormState = { error?: string };

export async function addLinkAction(
  slug: string,
  traceItemId: string,
  _prevState: AddLinkFormState,
  formData: FormData
): Promise<AddLinkFormState> {
  const user = await requireUser();
  const targetItemId = formData.get("targetItemId") as string;
  const linkType = formData.get("linkType") as LinkType;
  if (!targetItemId || !linkType) {
    return { error: "Choose a relationship and a target item." };
  }

  const result = await addTraceLink(traceItemId, targetItemId, linkType, user);
  if (!result.success) return { error: result.error };

  revalidatePath(`/items/${slug}/${traceItemId}`);
  return {};
}

export async function removeLinkAction(formData: FormData) {
  const user = await requireUser();
  const linkId = formData.get("linkId") as string;
  const slug = formData.get("slug") as string;
  const traceItemId = formData.get("traceItemId") as string;
  await removeTraceLink(linkId, user);
  revalidatePath(`/items/${slug}/${traceItemId}`);
}
