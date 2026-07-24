"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addAttachment, removeAttachment } from "@/lib/server/repository/attachments";

export type AddAttachmentFormState = { error?: string; success?: boolean };

export async function addAttachmentAction(
  slug: string,
  traceItemId: string,
  _prevState: AddAttachmentFormState,
  formData: FormData
): Promise<AddAttachmentFormState> {
  const user = await requireUser();
  const name = (formData.get("name") as string) ?? "";
  const url = (formData.get("url") as string) ?? "";

  const result = await addAttachment(traceItemId, name, url, user);
  if (!result.success) return { error: result.error };

  revalidatePath(`/items/${slug}/${traceItemId}`);
  return { success: true };
}

export async function removeAttachmentAction(formData: FormData) {
  const user = await requireUser();
  const attachmentId = formData.get("attachmentId") as string;
  const slug = formData.get("slug") as string;
  const traceItemId = formData.get("traceItemId") as string;

  await removeAttachment(attachmentId, user);
  revalidatePath(`/items/${slug}/${traceItemId}`);
}
