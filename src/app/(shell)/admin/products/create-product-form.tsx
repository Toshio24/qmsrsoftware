"use client";

import { useActionState } from "react";
import { createProductAction, type CreateProductState } from "./actions";

const initialState: CreateProductState = {};

export function CreateProductForm() {
  const [state, formAction, pending] = useActionState(createProductAction, initialState);

  return (
    <form
      action={formAction}
      key={state.success ? "reset" : "form"}
      className="flex max-w-md flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div>
        <label htmlFor="name" className="text-sm font-medium">
          New product name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. ENT"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Gives this device its own Design Control and Risk Management records, separate
          from every other product.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Product created.</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {pending ? "Creating…" : "Create product"}
      </button>
    </form>
  );
}
