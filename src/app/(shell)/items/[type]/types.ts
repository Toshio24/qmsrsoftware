import type { listItemsWithCurrentVersion } from "@/lib/server/repository/items";

export type ItemRow = Awaited<ReturnType<typeof listItemsWithCurrentVersion>>[number];
