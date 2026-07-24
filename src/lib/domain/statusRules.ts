import { ItemStatus } from "@/generated/prisma/enums";

/** These transitions require an e-signature (see lib/server/repository/signatures.ts)
 * and can't be set through the plain status control. */
export const SIGNATURE_GATED_STATUSES: ReadonlySet<ItemStatus> = new Set([
  ItemStatus.APPROVED,
  ItemStatus.EFFECTIVE,
  ItemStatus.REJECTED,
]);
