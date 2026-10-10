"use client";

import { useState, useTransition } from "react";
import { switchProductAction } from "@/app/(shell)/product-actions";

export function ProductSwitcher({
  products,
  currentProductId,
}: {
  products: { id: string; name: string }[];
  currentProductId: string | null;
}) {
  const [value, setValue] = useState(currentProductId ?? "");
  // Tracks the last currentProductId we've synced `value` from, so a change
  // in the server's truth (e.g. a switch confirmed, or a product created
  // elsewhere also revalidating this layout) can be picked up during render
  // — React's sanctioned way to adjust state from a prop change, without an
  // Effect and the extra render cascade/flicker that would cause.
  const [syncedProductId, setSyncedProductId] = useState(currentProductId);
  if (currentProductId !== syncedProductId) {
    setSyncedProductId(currentProductId);
    setValue(currentProductId ?? "");
  }
  const [isPending, startTransition] = useTransition();

  if (products.length === 0) return null;

  return (
    <div className="mt-2">
      <label
        htmlFor="productId"
        className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400"
      >
        Viewing product
      </label>
      {/* Deliberately controlled (value, not defaultValue): a plain
       * uncontrolled <form action={...}> select gets its selection silently
       * reset back to its original mount-time value once the action
       * completes — React 19 resets uncontrolled form fields after a
       * successful form action, same as a native form.reset(). Calling the
       * action directly from onChange, with local state driving `value`,
       * sidesteps that reset entirely. */}
      <select
        id="productId"
        value={value}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          startTransition(() => {
            switchProductAction(next);
          });
        }}
        className="mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-medium disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900"
      >
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </div>
  );
}
