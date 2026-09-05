"use client";

import { useMemo, useState } from "react";
import type { FieldConfig } from "@/lib/domain/itemTypes";
import { formatFieldValue } from "@/lib/domain/formatField";

type CandidateItem = { id: string; humanCode: string; title: string; status: string };
type RuleOption = { linkType: string; label: string; targetTypes: string[] };

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

/**
 * Lets a user attach one trace link (e.g. "is derived from" a User Need)
 * while still filling out the create-item form, instead of only being able
 * to add it afterward from the item's own page. Renders as plain named
 * fields (linkType/targetItemId) inside the parent <form> — no submit of
 * its own — so createItemAction can create the link right after the item.
 */
export function LinkPickerFields({
  rules,
  candidateItemsByType,
  typeLabelByType,
  fieldsByType,
  previewByItemId,
}: {
  rules: RuleOption[];
  candidateItemsByType: Record<string, CandidateItem[]>;
  typeLabelByType: Record<string, string>;
  fieldsByType: Record<string, FieldConfig[]>;
  previewByItemId: Record<string, Record<string, unknown>>;
}) {
  const [linkType, setLinkType] = useState(rules[0]?.linkType ?? "");
  const [targetItemId, setTargetItemId] = useState("");
  const [expanded, setExpanded] = useState(false);

  const selectedRule = rules.find((r) => r.linkType === linkType);
  const targetOptions = useMemo(() => {
    if (!selectedRule) return [];
    return selectedRule.targetTypes.flatMap((t) =>
      (candidateItemsByType[t] ?? []).map((item) => ({
        ...item,
        typeLabel: typeLabelByType[t] ?? t,
        itemType: t,
      }))
    );
  }, [selectedRule, candidateItemsByType, typeLabelByType]);

  const selectedCandidate = targetOptions.find((item) => item.id === targetItemId);
  const preview = targetItemId ? previewByItemId[targetItemId] : undefined;
  const previewFields = selectedCandidate ? (fieldsByType[selectedCandidate.itemType] ?? []) : [];

  if (rules.length === 0) return null;

  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-sm font-medium">Link to another item (optional)</p>
      <p className="mt-1 text-xs text-neutral-500">
        e.g. link this to the User Need it&rsquo;s derived from. You can also add this — or more
        links — later from the item&rsquo;s page.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="text-sm font-medium">This item…</label>
          <select
            name="linkType"
            value={linkType}
            onChange={(e) => {
              setLinkType(e.target.value);
              setTargetItemId("");
              setExpanded(false);
            }}
            className={`${inputClass} bg-white`}
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
            value={targetItemId}
            onChange={(e) => {
              setTargetItemId(e.target.value);
              setExpanded(false);
            }}
            className={`${inputClass} bg-white`}
          >
            <option value="">— None —</option>
            {targetOptions.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.typeLabel}] {item.humanCode} — {item.title} ({item.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCandidate && preview && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            {expanded ? "▼" : "▶"} Preview {selectedCandidate.humanCode}
          </button>
          {expanded && (
            <dl className="mt-2 flex flex-col gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
              {previewFields.map((field) => (
                <div key={field.key}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {field.label}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-sm">
                    {formatFieldValue(field, preview[field.key])}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
