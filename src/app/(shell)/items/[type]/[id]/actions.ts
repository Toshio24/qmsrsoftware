"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { updateItemStatus } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import { ItemStatus } from "@/generated/prisma/enums";
import { SIGNATURE_GATED_STATUSES } from "@/lib/domain/statusRules";

export async function updateStatusAction(formData: FormData) {
  const user = await requireUser();
  const slug = formData.get("slug") as string;
  const traceItemId = formData.get("traceItemId") as string;
  const status = formData.get("status") as string;

  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();
  if (!Object.values(ItemStatus).includes(status as ItemStatus)) return;
  // Defense in depth: the UI already hides these, but never trust the client —
  // APPROVED/EFFECTIVE/REJECTED can only be reached via the signature flow.
  if (SIGNATURE_GATED_STATUSES.has(status as ItemStatus)) return;

  await updateItemStatus(traceItemId, status as ItemStatus, user);
  revalidatePath(`/items/${slug}/${traceItemId}`);
}
