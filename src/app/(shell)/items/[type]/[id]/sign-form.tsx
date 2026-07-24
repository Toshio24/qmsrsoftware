"use client";

import { useActionState } from "react";
import type { SignFormState } from "./sign-actions";
import { ATTESTATION_TEXT } from "@/lib/domain/attestation";

export function SignForm({
  action,
  label,
  confirmLabel,
  buttonClassName,
}: {
  action: (prevState: SignFormState, formData: FormData) => Promise<SignFormState>;
  label: string;
  confirmLabel: string;
  buttonClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <summary className="cursor-pointer text-sm font-medium">{label}</summary>
      <form action={formAction} className="mt-3 flex max-w-sm flex-col gap-2">
        <p className="text-xs text-neutral-500">{ATTESTATION_TEXT}</p>
        <label className="text-sm font-medium">Confirm your password to sign</label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className={
            buttonClassName ??
            "self-start rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          }
        >
          {pending ? "Signing…" : confirmLabel}
        </button>
      </form>
    </details>
  );
}
