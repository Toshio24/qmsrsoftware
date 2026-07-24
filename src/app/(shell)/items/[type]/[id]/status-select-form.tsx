"use client";

import { ItemStatus } from "@/generated/prisma/enums";
import { SIGNATURE_GATED_STATUSES } from "@/lib/domain/statusRules";
import { updateStatusAction } from "./actions";

export function StatusSelectForm({
  slug,
  traceItemId,
  currentStatus,
}: {
  slug: string;
  traceItemId: string;
  currentStatus: ItemStatus;
}) {
  const selectableStatuses = Object.values(ItemStatus).filter(
    (status) => !SIGNATURE_GATED_STATUSES.has(status) || status === currentStatus
  );

  return (
    <form action={updateStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="traceItemId" value={traceItemId} />
      <select
        name="status"
        defaultValue={currentStatus}
        disabled={SIGNATURE_GATED_STATUSES.has(currentStatus)}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900"
      >
        {selectableStatuses.map((status) => (
          <option key={status} value={status}>
            {status.replace("_", " ")}
          </option>
        ))}
      </select>
      {SIGNATURE_GATED_STATUSES.has(currentStatus) && (
        <span className="text-xs text-neutral-400">(use signatures below to change)</span>
      )}
    </form>
  );
}
