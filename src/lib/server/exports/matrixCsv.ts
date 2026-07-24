import "server-only";
import { stringify } from "csv-stringify/sync";
import { getMatrixItems, getMatrixLinks } from "@/lib/server/repository/matrix";
import { getItemTypeConfig } from "@/lib/domain/itemTypes";

function pushTo(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export async function buildMatrixCsv(): Promise<string> {
  const [items, links] = await Promise.all([getMatrixItems(), getMatrixLinks()]);

  const outgoingByItem = new Map<string, string[]>();
  const incomingByItem = new Map<string, string[]>();
  for (const link of links) {
    pushTo(outgoingByItem, link.sourceItemId, `${link.linkType}:${link.targetItem.humanCode}`);
    pushTo(incomingByItem, link.targetItemId, `${link.linkType}:${link.sourceItem.humanCode}`);
  }

  const rows = items.map((item) => {
    const config = getItemTypeConfig(item.itemType);
    return {
      Code: item.humanCode,
      Type: config.label,
      Title: item.title,
      Status: item.status,
      Version: item.currentVersionNo,
      "Outgoing Links": (outgoingByItem.get(item.id) ?? []).join("; "),
      "Incoming Links": (incomingByItem.get(item.id) ?? []).join("; "),
      "Created At": item.createdAt.toISOString(),
    };
  });

  return stringify(rows, { header: true });
}
