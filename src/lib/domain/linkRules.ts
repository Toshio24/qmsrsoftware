import { ItemType, LinkType } from "@/generated/prisma/enums";

export type LinkRule = {
  linkType: LinkType;
  label: string;
  /** "source [label] target", e.g. "Verification Test VERIFIES Design Output" */
  sourceTypes: ItemType[];
  targetTypes: ItemType[];
};

const ALL_TYPES = Object.values(ItemType);

/**
 * The full set of valid (linkType, sourceType, targetType) combinations.
 * Link creation always happens from the source item's detail page — to add
 * the same relationship from the other end, open the source item instead.
 * REFERENCES is a deliberate escape hatch allowing any type to reference any
 * other, for relationships not covered by a more specific type below.
 */
export const linkRules: LinkRule[] = [
  {
    linkType: LinkType.DERIVED_FROM,
    label: "is derived from",
    sourceTypes: [ItemType.DESIGN_INPUT, ItemType.RISK_ITEM],
    targetTypes: [ItemType.USER_NEED, ItemType.DESIGN_INPUT, ItemType.DESIGN_OUTPUT],
  },
  {
    linkType: LinkType.SATISFIES,
    label: "satisfies",
    sourceTypes: [ItemType.DESIGN_OUTPUT],
    targetTypes: [ItemType.DESIGN_INPUT],
  },
  {
    linkType: LinkType.VERIFIES,
    label: "verifies",
    sourceTypes: [ItemType.VERIFICATION_TEST],
    targetTypes: [ItemType.DESIGN_INPUT, ItemType.DESIGN_OUTPUT],
  },
  {
    linkType: LinkType.VALIDATES,
    label: "validates",
    sourceTypes: [ItemType.VALIDATION_TEST],
    targetTypes: [ItemType.USER_NEED, ItemType.DESIGN_OUTPUT],
  },
  {
    linkType: LinkType.MITIGATES,
    label: "mitigates",
    sourceTypes: [ItemType.RISK_CONTROL],
    targetTypes: [ItemType.RISK_ITEM],
  },
  {
    linkType: LinkType.IMPLEMENTS,
    label: "implements",
    sourceTypes: [ItemType.DESIGN_OUTPUT],
    targetTypes: [ItemType.RISK_CONTROL],
  },
  {
    linkType: LinkType.RESULTED_FROM,
    label: "resulted from",
    sourceTypes: [ItemType.CAPA],
    targetTypes: [
      ItemType.NONCONFORMANCE,
      ItemType.COMPLAINT,
      ItemType.INTERNAL_AUDIT,
      ItemType.SUPPLIER_AUDIT,
      ItemType.MANAGEMENT_REVIEW,
    ],
  },
  {
    linkType: LinkType.ADDRESSES,
    label: "addresses",
    sourceTypes: [ItemType.CAPA],
    targetTypes: [ItemType.RISK_ITEM, ItemType.NONCONFORMANCE, ItemType.COMPLAINT, ItemType.DESIGN_OUTPUT],
  },
  {
    linkType: LinkType.SUPPLIED_BY,
    label: "is supplied by",
    sourceTypes: [ItemType.DESIGN_OUTPUT, ItemType.EQUIPMENT],
    targetTypes: [ItemType.SUPPLIER],
  },
  {
    linkType: LinkType.TRAINED_ON,
    label: "trained on",
    sourceTypes: [ItemType.TRAINING_RECORD],
    targetTypes: [ItemType.CONTROLLED_DOCUMENT],
  },
  {
    linkType: LinkType.USED_EQUIPMENT,
    label: "used equipment",
    sourceTypes: [ItemType.VERIFICATION_TEST, ItemType.VALIDATION_TEST],
    targetTypes: [ItemType.EQUIPMENT],
  },
  {
    linkType: LinkType.REFERENCES,
    label: "references",
    sourceTypes: ALL_TYPES,
    targetTypes: ALL_TYPES,
  },
];

export function getLinkRulesForSourceType(sourceType: ItemType): LinkRule[] {
  return linkRules.filter((rule) => rule.sourceTypes.includes(sourceType));
}

export function isValidLink(linkType: LinkType, sourceType: ItemType, targetType: ItemType): boolean {
  const rule = linkRules.find((r) => r.linkType === linkType);
  if (!rule) return false;
  return rule.sourceTypes.includes(sourceType) && rule.targetTypes.includes(targetType);
}
