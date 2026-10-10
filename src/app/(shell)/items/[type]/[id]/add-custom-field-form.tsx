"use client";

import { useActionState } from "react";
import type { AddCustomFieldFormState } from "./custom-field-actions";

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export function AddCustomFieldForm({
  action,
}: {
  action: (prevState: AddCustomFieldFormState, formData: FormData) => Promise<AddCustomFieldFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      key={state.success ? "reset" : "form"}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="text-sm font-medium">Label</label>
        <input name="label" required placeholder="e.g. Date" className={inputClass} />
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium">Value</label>
        <input name="value" required placeholder="e.g. 10/10/2026" className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {pending ? "Adding…" : "Add field"}
      </button>
      {state.error && <p className="text-sm text-red-600 sm:basis-full">{state.error}</p>}
    </form>
  );
}
