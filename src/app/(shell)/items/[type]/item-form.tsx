"use client";

import { useActionState, useRef, useState } from "react";
import type { FieldConfig } from "@/lib/domain/itemTypes";

export type ItemFormState = { error?: string };

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function FieldInput({ field, defaultValue }: { field: FieldConfig; defaultValue?: unknown }) {
  if (field.kind === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={field.key}
          name={field.key}
          type="checkbox"
          defaultChecked={Boolean(defaultValue)}
          className="h-4 w-4"
        />
        <label htmlFor={field.key} className="text-sm font-medium">
          {field.label}
        </label>
      </div>
    );
  }

  const label = (
    <label htmlFor={field.key} className="text-sm font-medium">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  );

  if (field.kind === "select") {
    return (
      <div>
        {label}
        <select
          id={field.key}
          name={field.key}
          required={field.required}
          defaultValue={(defaultValue as string) ?? ""}
          className={`${inputClass} bg-white`}
        >
          <option value="" disabled>
            Select…
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div>
        {label}
        <textarea
          id={field.key}
          name={field.key}
          required={field.required}
          defaultValue={(defaultValue as string) ?? ""}
          rows={4}
          className={inputClass}
        />
        {field.helpText && <p className="mt-1 text-xs text-neutral-500">{field.helpText}</p>}
      </div>
    );
  }

  // Note: field.kind === "url" intentionally renders as a plain text input,
  // not type="url" — the browser's native URL validation requires a full
  // scheme (https://...) and silently blocks submission otherwise, which is
  // exactly the "it won't let me save the link" bug this avoids. The scheme
  // is normalized server-side instead (see lib/domain/itemForm.ts).
  const inputType = field.kind === "date" ? "date" : field.kind === "number" ? "number" : "text";
  const value = field.kind === "date" ? toDateInputValue(defaultValue) : ((defaultValue as string | number) ?? "");

  return (
    <div>
      {label}
      <input
        id={field.key}
        name={field.key}
        type={inputType}
        inputMode={field.kind === "url" ? "url" : undefined}
        required={field.required}
        defaultValue={value}
        className={inputClass}
      />
      {field.helpText && <p className="mt-1 text-xs text-neutral-500">{field.helpText}</p>}
    </div>
  );
}

/** Repeatable name+link rows, submitted as same-named fields
 * (attachmentName[]/attachmentUrl[]) so the server can zip them by position. */
function AttachmentFields() {
  const [rowIds, setRowIds] = useState<number[]>([]);
  const nextId = useRef(0);

  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-sm font-medium">Attachments (optional)</p>
      <p className="mt-1 text-xs text-neutral-500">
        Reference links — Google Docs, etc. You can also add these later from the item&rsquo;s
        page.
      </p>

      {rowIds.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {rowIds.map((id) => (
            <div key={id} className="flex gap-2">
              <input name="attachmentName" placeholder="Name" className={inputClass} />
              <input name="attachmentUrl" placeholder="docs.google.com/…" className={inputClass} />
              <button
                type="button"
                onClick={() => setRowIds((rows) => rows.filter((r) => r !== id))}
                className="shrink-0 self-start text-xs text-neutral-500 underline-offset-2 hover:underline"
                aria-label="Remove attachment row"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setRowIds((rows) => [...rows, nextId.current++])}
        className="mt-3 text-sm underline-offset-2 hover:underline"
      >
        + Add attachment
      </button>
    </div>
  );
}

export function ItemForm({
  fields,
  action,
  defaultValues,
  submitLabel,
  allowAttachments = false,
}: {
  fields: FieldConfig[];
  action: (prevState: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  defaultValues?: Record<string, unknown>;
  submitLabel: string;
  allowAttachments?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      {fields.map((field) => (
        <FieldInput key={field.key} field={field} defaultValue={defaultValues?.[field.key]} />
      ))}

      {allowAttachments && <AttachmentFields />}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
