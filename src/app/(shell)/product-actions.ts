"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { setCurrentProductId } from "@/lib/auth/currentProduct";
import { getProduct } from "@/lib/server/repository/products";

export async function switchProductAction(formData: FormData) {
  await requireUser();
  const productId = formData.get("productId") as string;

  const product = await getProduct(productId);
  if (!product) return;

  await setCurrentProductId(product.id);
  // Every Design Control / Risk Management page reads the current product,
  // so the whole shell needs to re-render with the new scope, not just the
  // page the switcher happened to be submitted from.
  revalidatePath("/", "layout");
}
