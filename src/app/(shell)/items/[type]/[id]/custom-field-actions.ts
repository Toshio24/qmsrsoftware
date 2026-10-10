"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addCustomField, removeCustomField } from "@/lib/server/repository/customFields";

export type AddCustomFieldFormState = { error?: string; success?: boolean };

export async function addCustomFieldAction(
  slug: string,
  traceItemId: string,
  _prevState: AddCustomFieldFormState,
  formData: FormData
): Promise<AddCustomFieldFormState> {
  const user = await requireUser();
  const label = (formData.get("label") as string) ?? "";
  const value = (formData.get("value") as string) ?? "";

  const result = await addCustomField(traceItemId, label, value, user);
  if (!result.success) return { error: result.error };

  revalidatePath(`/items/${slug}/${traceItemId}`);
  return { success: true };
}

export async function removeCustomFieldAction(formData: FormData) {
  const user = await requireUser();
  const customFieldId = formData.get("customFieldId") as string;
  const slug = formData.get("slug") as string;
  const traceItemId = formData.get("traceItemId") as string;

  await removeCustomField(customFieldId, user);
  revalidatePath(`/items/${slug}/${traceItemId}`);
}
