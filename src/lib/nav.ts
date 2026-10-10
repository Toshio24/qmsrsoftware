import {
  Boxes,
  Download,
  GitBranch,
  LayoutDashboard,
  ScrollText,
  Settings,
  Target,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { ItemType, UserRole } from "@/generated/prisma/enums";
import { DESIGN_CONTROL_TYPES, RISK_MANAGEMENT_TYPES, itemTypeRegistry } from "@/lib/domain/itemTypes";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

function navItemsFor(types: ItemType[]): NavItem[] {
  return itemTypeRegistry
    .filter((config) => types.includes(config.type))
    .map((config) => ({ label: config.pluralLabel, href: `/items/${config.slug}`, icon: config.icon }));
}

const designControlItems = navItemsFor(DESIGN_CONTROL_TYPES);
const riskManagementItems = navItemsFor(RISK_MANAGEMENT_TYPES);
const coveredTypes = new Set([...DESIGN_CONTROL_TYPES, ...RISK_MANAGEMENT_TYPES]);
const qualityOpsItems = itemTypeRegistry
  .filter((config) => !coveredTypes.has(config.type))
  .map((config) => ({ label: config.pluralLabel, href: `/items/${config.slug}`, icon: config.icon }));

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Design Control",
    items: designControlItems,
  },
  {
    title: "Risk Management",
    items: riskManagementItems,
  },
  {
    title: "Quality Operations",
    items: qualityOpsItems,
  },
  {
    title: "Traceability",
    items: [
      { label: "Trace matrix", href: "/matrix", icon: GitBranch },
      { label: "Coverage gaps", href: "/matrix/gaps", icon: Target },
    ],
  },
  {
    title: "Compliance",
    items: [
      {
        label: "Audit log",
        href: "/audit-log",
        icon: ScrollText,
        roles: [UserRole.ADMIN, UserRole.QA, UserRole.AUDITOR_READONLY],
      },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Users", href: "/admin/users", icon: UsersIcon, roles: [UserRole.ADMIN] },
      { label: "Products", href: "/admin/products", icon: Boxes, roles: [UserRole.ADMIN] },
      { label: "Settings", href: "/admin/settings", icon: Settings, roles: [UserRole.ADMIN] },
    ],
  },
  {
    title: "Reports",
    items: [{ label: "Exports", href: "/exports", icon: Download }],
  },
];
