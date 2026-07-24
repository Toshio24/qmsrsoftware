"use client";

import { useActionState } from "react";
import type { AddAttachmentFormState } from "./attachment-actions";

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export function AddAttachmentForm({
  action,
}: {
  action: (prevState: AddAttachmentFormState, formData: FormData) => Promise<AddAttachmentFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      key={state.success ? "reset" : "form"}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="text-sm font-medium">Name</label>
        <input
          name="name"
          required
          placeholder="e.g. Quality Manual (Google Doc)"
          className={inputClass}
        />
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium">Link</label>
        <input name="url" required placeholder="docs.google.com/…" className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {pending ? "Adding…" : "Add attachment"}
      </button>
      {state.error && <p className="text-sm text-red-600 sm:basis-full">{state.error}</p>}
    </form>
  );
}
