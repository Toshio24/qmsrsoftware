import { ListPlus } from "lucide-react";
import { getCustomFieldsForItem } from "@/lib/server/repository/customFields";
import { AddCustomFieldForm } from "./add-custom-field-form";
import { addCustomFieldAction, removeCustomFieldAction } from "./custom-field-actions";

export async function CustomFieldsSection({
  slug,
  traceItemId,
}: {
  slug: string;
  traceItemId: string;
}) {
  const customFields = await getCustomFieldsForItem(traceItemId);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Additional fields
      </h2>
      <p className="-mt-2 text-xs text-neutral-500">
        Anything this record&rsquo;s standard fields don&rsquo;t already cover.
      </p>

      {customFields.length === 0 ? (
        <p className="text-sm text-neutral-500">No additional fields yet.</p>
      ) : (
        <dl className="flex flex-col gap-2">
          {customFields.map((field) => (
            <div
              key={field.id}
              className="flex items-start justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <div className="flex min-w-0 items-start gap-2">
                <ListPlus className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0">
                  <dt className="font-medium">{field.label}</dt>
                  <dd className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                    {field.value}
                  </dd>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Added by {field.addedBy.fullName} · {field.addedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <form action={removeCustomFieldAction}>
                <input type="hidden" name="customFieldId" value={field.id} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="traceItemId" value={traceItemId} />
                <button
                  type="submit"
                  className="shrink-0 text-xs text-neutral-500 underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </dl>
      )}

      <AddCustomFieldForm action={addCustomFieldAction.bind(null, slug, traceItemId)} />
    </div>
  );
}
