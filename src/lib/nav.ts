import {
  Download,
  GitBranch,
  LayoutDashboard,
  ScrollText,
  Settings,
  Target,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@/generated/prisma/enums";
import { itemTypeRegistry } from "@/lib/domain/itemTypes";

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

// The registry is defined in design-control order first, then the newer
// quality-operations modules — split the nav on that same boundary.
const DESIGN_CONTROL_TYPE_COUNT = 8;

const designControlItems: NavItem[] = itemTypeRegistry
  .slice(0, DESIGN_CONTROL_TYPE_COUNT)
  .map((config) => ({ label: config.pluralLabel, href: `/items/${config.slug}`, icon: config.icon }));

const qualityOpsItems: NavItem[] = itemTypeRegistry
  .slice(DESIGN_CONTROL_TYPE_COUNT)
  .map((config) => ({ label: config.pluralLabel, href: `/items/${config.slug}`, icon: config.icon }));

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Design & Risk",
    items: designControlItems,
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
      { label: "Settings", href: "/admin/settings", icon: Settings, roles: [UserRole.ADMIN] },
    ],
  },
  {
    title: "Reports",
    items: [{ label: "Exports", href: "/exports", icon: Download }],
  },
];
