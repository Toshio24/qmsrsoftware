"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { requireUser } from "@/lib/auth/session";
import {
  createFolder,
  deleteFolder,
  moveItemToFolder,
  renameFolder,
} from "@/lib/server/repository/folders";

export type FolderFormState = { error?: string };

function requireConfig(slug: string) {
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();
  return config;
}

export async function createFolderAction(
  slug: string,
  currentFolderId: string | null,
  _prevState: FolderFormState,
  formData: FormData
): Promise<FolderFormState> {
  const user = await requireUser();
  const config = requireConfig(slug);
  const name = (formData.get("name") as string) ?? "";

  const result = await createFolder(config.type, name, currentFolderId, user);
  if (!result.success) return { error: result.error };

  revalidatePath(`/items/${slug}`);
  return {};
}

export async function renameFolderAction(formData: FormData) {
  const user = await requireUser();
  const slug = formData.get("slug") as string;
  const folderId = formData.get("folderId") as string;
  const name = formData.get("name") as string;
  requireConfig(slug);

  await renameFolder(folderId, name, user);
  revalidatePath(`/items/${slug}`);
}

/** `currentFolderId` is wherever the browser is standing when the delete is
 * triggered (folders are always deleted from their parent's listing, so this
 * is normally just "stay put" — the folder's contents move up into this same
 * view). */
export async function deleteFolderAction(formData: FormData) {
  const user = await requireUser();
  const slug = formData.get("slug") as string;
  const folderId = formData.get("folderId") as string;
  const currentFolderId = (formData.get("currentFolderId") as string) || null;
  requireConfig(slug);

  await deleteFolder(folderId, user);
  revalidatePath(`/items/${slug}`);
  redirect(currentFolderId ? `/items/${slug}?folder=${currentFolderId}` : `/items/${slug}`);
}

/** Called directly (not as a <form> action) from the drag-and-drop handlers. */
export async function moveItemToFolderAction(
  slug: string,
  traceItemId: string,
  folderId: string | null
): Promise<FolderFormState> {
  const user = await requireUser();
  requireConfig(slug);

  const result = await moveItemToFolder(traceItemId, folderId, user);
  if (!result.success) return { error: result.error };

  revalidatePath(`/items/${slug}`);
  return {};
}
