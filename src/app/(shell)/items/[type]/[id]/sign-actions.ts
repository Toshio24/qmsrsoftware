"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { signAndTransition, signOnly } from "@/lib/server/repository/signatures";
import { ItemStatus, SignatureMeaning, UserRole } from "@/generated/prisma/enums";

export type SignFormState = { error?: string };

/** Roles allowed to sign records. Segregation of duties (author ≠ approver)
 * is a followed policy, not enforced in code — see plan caveats. */
const SIGNER_ROLES = [UserRole.APPROVER, UserRole.QA, UserRole.ADMIN];

export async function signTransitionAction(
  slug: string,
  traceItemId: string,
  targetStatus: ItemStatus,
  meaning: SignatureMeaning,
  _prevState: SignFormState,
  formData: FormData
): Promise<SignFormState> {
  const actor = await requireRole(SIGNER_ROLES);
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const password = formData.get("password") as string;
  if (!password) return { error: "Password is required to sign." };

  const result = await signAndTransition({
    itemType: config.type,
    traceItemId,
    targetStatus,
    meaning,
    password,
    actor,
  });
  if (!result.success) return { error: result.error };

  revalidatePath(`/items/${slug}/${traceItemId}`);
  return {};
}

export async function signOnlyAction(
  slug: string,
  traceItemId: string,
  meaning: SignatureMeaning,
  _prevState: SignFormState,
  formData: FormData
): Promise<SignFormState> {
  const actor = await requireRole(SIGNER_ROLES);
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const password = formData.get("password") as string;
  if (!password) return { error: "Password is required to sign." };

  const result = await signOnly({
    itemType: config.type,
    traceItemId,
    meaning,
    password,
    actor,
  });
  if (!result.success) return { error: result.error };

  revalidatePath(`/items/${slug}/${traceItemId}`);
  return {};
}
