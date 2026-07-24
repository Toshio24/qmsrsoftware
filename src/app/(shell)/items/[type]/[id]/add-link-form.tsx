"use client";

import { useActionState, useMemo, useState } from "react";
import type { AddLinkFormState } from "./link-actions";

type CandidateItem = { id: string; humanCode: string; title: string; status: string };
type RuleOption = { linkType: string; label: string; targetTypes: string[] };

export function AddLinkForm({
  action,
  rules,
  candidateItemsByType,
  typeLabelByType,
}: {
  action: (prevState: AddLinkFormState, formData: FormData) => Promise<AddLinkFormState>;
  rules: RuleOption[];
  candidateItemsByType: Record<string, CandidateItem[]>;
  typeLabelByType: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [linkType, setLinkType] = useState(rules[0]?.linkType ?? "");

  const selectedRule = rules.find((r) => r.linkType === linkType);
  const targetOptions = useMemo(() => {
    if (!selectedRule) return [];
    return selectedRule.targetTypes.flatMap((t) =>
      (candidateItemsByType[t] ?? []).map((item) => ({
        ...item,
        typeLabel: typeLabelByType[t] ?? t,
      }))
    );
  }, [selectedRule, candidateItemsByType, typeLabelByType]);

  if (rules.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No outgoing relationship types are defined starting from this item type.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="text-sm font-medium">This item…</label>
        <select
          name="linkType"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          {rules.map((r) => (
            <option key={r.linkType} value={r.linkType}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium">Target item</label>
        <select
          name="targetItemId"
          required
          defaultValue=""
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="" disabled>
            Select…
          </option>
          {targetOptions.map((item) => (
            <option key={item.id} value={item.id}>
              [{item.typeLabel}] {item.humanCode} — {item.title} ({item.status})
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {pending ? "Linking…" : "Add link"}
      </button>
      {state.error && <p className="text-sm text-red-600 sm:basis-full">{state.error}</p>}
    </form>
  );
}
