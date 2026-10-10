import "server-only";
import { cookies } from "next/headers";
import { getDefaultProduct, getProduct, listProducts } from "@/lib/server/repository/products";

export const PRODUCT_COOKIE_NAME = "qms_current_product";

/**
 * Which product (device) the current browser is viewing — a per-browser UI
 * preference, not an auth concern, so this is a plain cookie read/write
 * rather than anything tied to the Session DB row (see lib/auth/session.ts).
 * Falls back to the oldest product if the cookie is unset or stale (e.g. it
 * was never set, or — defensively — pointed at a product that's gone).
 */
export async function getCurrentProductId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(PRODUCT_COOKIE_NAME)?.value;
  if (cookieValue) {
    const product = await getProduct(cookieValue);
    if (product) return product.id;
  }
  const fallback = await getDefaultProduct();
  return fallback?.id ?? null;
}

export async function getCurrentProduct() {
  const id = await getCurrentProductId();
  if (!id) return null;
  return getProduct(id);
}

export async function setCurrentProductId(productId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PRODUCT_COOKIE_NAME, productId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // No expiry — persists like a long-lived preference until changed again.
    maxAge: 60 * 60 * 24 * 365,
  });
}

export { listProducts };
