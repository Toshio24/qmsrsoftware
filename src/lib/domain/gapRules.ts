import { ItemType, LinkType } from "@/generated/prisma/enums";

export type GapRule = {
  itemType: ItemType;
  requiredIncomingLinkType: LinkType;
  label: string;
};

/**
 * Classic design-control coverage checks: an item of `itemType` is "covered"
 * if at least one active TraceLink of `requiredIncomingLinkType` points at
 * it. Curated to the core V-model chain for now — broader gap rules for the
 * newer QMS modules (CAPA/NCR/etc.) can be added the same way later.
 */
export const gapRules: GapRule[] = [
  {
    itemType: ItemType.USER_NEED,
    requiredIncomingLinkType: LinkType.DERIVED_FROM,
    label: "User needs with no design input derived from them",
  },
  {
    itemType: ItemType.DESIGN_INPUT,
    requiredIncomingLinkType: LinkType.SATISFIES,
    label: "Design inputs with no design output satisfying them",
  },
  {
    itemType: ItemType.DESIGN_OUTPUT,
    requiredIncomingLinkType: LinkType.VERIFIES,
    label: "Design outputs with no linked verification test",
  },
  {
    itemType: ItemType.DESIGN_OUTPUT,
    requiredIncomingLinkType: LinkType.VALIDATES,
    label: "Design outputs with no linked validation test",
  },
  {
    itemType: ItemType.RISK_ITEM,
    requiredIncomingLinkType: LinkType.MITIGATES,
    label: "Risks with no mitigating control",
  },
];
