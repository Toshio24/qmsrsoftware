import { ExternalLink, Paperclip } from "lucide-react";
import { getAttachmentsForItem } from "@/lib/server/repository/attachments";
import { AddAttachmentForm } from "./add-attachment-form";
import { addAttachmentAction, removeAttachmentAction } from "./attachment-actions";

export async function AttachmentsSection({
  slug,
  traceItemId,
}: {
  slug: string;
  traceItemId: string;
}) {
  const attachments = await getAttachmentsForItem(traceItemId);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Attachments
      </h2>
      <p className="-mt-2 text-xs text-neutral-500">
        Reference links (Google Docs, etc.) for this item. For controlled documents, this is
        separate from the version&rsquo;s official Google Doc / PDF snapshot fields above.
      </p>

      {attachments.length === 0 ? (
        <p className="text-sm text-neutral-500">No attachments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <span className="truncate">{att.name}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                  <p className="text-xs text-neutral-500">
                    Added by {att.addedBy.fullName} · {att.addedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <form action={removeAttachmentAction}>
                <input type="hidden" name="attachmentId" value={att.id} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="traceItemId" value={traceItemId} />
                <button
                  type="submit"
                  className="shrink-0 text-xs text-neutral-500 underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <AddAttachmentForm action={addAttachmentAction.bind(null, slug, traceItemId)} />
    </div>
  );
}
