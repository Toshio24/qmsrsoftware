import Link from "next/link";
import { getLinksForItem } from "@/lib/server/repository/links";
import { getCurrentVersionsForItems, listItemSummaries } from "@/lib/server/repository/items";
import { getLinkRulesForSourceType, linkRules } from "@/lib/domain/linkRules";
import { getItemTypeConfig, itemTypeByType } from "@/lib/domain/itemTypes";
import { formatFieldValue, statusBadgeClasses } from "@/lib/domain/formatField";
import type { ItemType } from "@/generated/prisma/enums";
import { AddLinkForm } from "./add-link-form";
import { addLinkAction, removeLinkAction } from "./link-actions";

function linkLabelFor(linkType: string) {
  return linkRules.find((r) => r.linkType === linkType)?.label ?? linkType.toLowerCase();
}

export async function LinksSection({
  slug,
  traceItemId,
  itemType,
}: {
  slug: string;
  traceItemId: string;
  itemType: ItemType;
}) {
  const [links, sourceRules] = await Promise.all([
    getLinksForItem(traceItemId),
    Promise.resolve(getLinkRulesForSourceType(itemType)),
  ]);

  const previewByItemId = await getCurrentVersionsForItems(
    links.map((link) => ({
      id: link.otherItem.id,
      itemType: link.otherItem.itemType,
      currentVersionNo: link.otherItem.currentVersionNo,
    }))
  );

  const targetTypesNeeded = Array.from(new Set(sourceRules.flatMap((r) => r.targetTypes)));
  const candidates =
    targetTypesNeeded.length > 0
      ? await listItemSummaries(targetTypesNeeded, traceItemId)
      : [];

  const candidateItemsByType: Record<
    string,
    { id: string; humanCode: string; title: string; status: string }[]
  > = {};
  for (const c of candidates) {
    (candidateItemsByType[c.itemType] ??= []).push(c);
  }

  const typeLabelByType: Record<string, string> = {};
  for (const [type, config] of itemTypeByType) {
    typeLabelByType[type] = config.label;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Trace links
      </h2>

      {links.length === 0 ? (
        <p className="text-sm text-neutral-500">No links yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => {
            const otherConfig = getItemTypeConfig(link.otherItem.itemType);
            const description =
              link.direction === "outgoing"
                ? `This item ${linkLabelFor(link.linkType)}`
                : `${link.otherItem.humanCode} ${linkLabelFor(link.linkType)} this item`;
            const preview = previewByItemId.get(link.otherItem.id);
            return (
              <li
                key={link.id}
                className="rounded-md border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <p className="text-neutral-500">{description}</p>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/items/${otherConfig.slug}/${link.otherItem.id}`}
                        className="font-medium hover:underline"
                      >
                        [{otherConfig.label}] {link.otherItem.humanCode} — {link.otherItem.title}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClasses(link.otherItem.status)}`}
                      >
                        {link.otherItem.status}
                      </span>
                    </div>
                  </div>
                  <form action={removeLinkAction}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="traceItemId" value={traceItemId} />
                    <button
                      type="submit"
                      className="text-xs text-neutral-500 underline-offset-2 hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </div>
                {preview && (
                  <details className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <summary className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                      Preview {link.otherItem.humanCode}
                    </summary>
                    <dl className="mt-2 flex flex-col gap-2">
                      {otherConfig.fields.map((field) => (
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
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AddLinkForm
        action={addLinkAction.bind(null, slug, traceItemId)}
        rules={sourceRules.map((r) => ({
          linkType: r.linkType,
          label: r.label,
          targetTypes: r.targetTypes,
        }))}
        candidateItemsByType={candidateItemsByType}
        typeLabelByType={typeLabelByType}
      />
    </div>
  );
}
