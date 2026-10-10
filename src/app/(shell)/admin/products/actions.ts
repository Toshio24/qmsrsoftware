"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/generated/prisma/enums";
import { createProduct } from "@/lib/server/repository/products";

export type CreateProductState = { error?: string; success?: boolean };

export async function createProductAction(
  _prevState: CreateProductState,
  formData: FormData
): Promise<CreateProductState> {
  const admin = await requireRole([UserRole.ADMIN]);
  const name = formData.get("name") as string;

  const result = await createProduct(name, admin);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/products");
  // Every page that reads the current product is under the shell layout, so
  // the sidebar switcher picks up the new product right away too.
  revalidatePath("/", "layout");
  return { success: true };
}
