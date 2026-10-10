"use client";

import { switchProductAction } from "@/app/(shell)/product-actions";

export function ProductSwitcher({
  products,
  currentProductId,
}: {
  products: { id: string; name: string }[];
  currentProductId: string | null;
}) {
  if (products.length === 0) return null;

  return (
    <form action={switchProductAction} className="mt-2">
      <label htmlFor="productId" className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
        Viewing product
      </label>
      <select
        id="productId"
        name="productId"
        defaultValue={currentProductId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-medium dark:border-neutral-700 dark:bg-neutral-900"
      >
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </form>
  );
}
