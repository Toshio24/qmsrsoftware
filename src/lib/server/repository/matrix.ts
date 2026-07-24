import "server-only";
import { db } from "@/lib/server/db";
import { getAllActiveLinks } from "./links";
import { ItemType } from "@/generated/prisma/enums";

export async function getMatrixItems(typeFilter?: ItemType) {
  return db.traceItem.findMany({
    where: typeFilter ? { itemType: typeFilter } : undefined,
    orderBy: { humanCode: "asc" },
  });
}

export function getMatrixLinks() {
  return getAllActiveLinks();
}

function addEdge(adjacency: Map<string, Set<string>>, a: string, b: string) {
  if (!adjacency.has(a)) adjacency.set(a, new Set());
  adjacency.get(a)!.add(b);
}

/** All items reachable from `focusId` by following active links in either
 * direction — the item's full upstream/downstream trace chain. */
export function computeConnectedIds(
  focusId: string,
  links: { sourceItemId: string; targetItemId: string }[]
): Set<string> {
  const adjacency = new Map<string, Set<string>>();
  for (const link of links) {
    addEdge(adjacency, link.sourceItemId, link.targetItemId);
    addEdge(adjacency, link.targetItemId, link.sourceItemId);
  }

  const visited = new Set<string>([focusId]);
  const queue = [focusId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited;
}
