"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { UserRole } from "@/generated/prisma/enums";

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6 p-4">
      {navSections.map((section) => {
        const items = section.items.filter(
          (item) => !item.roles || item.roles.includes(role)
        );
        if (items.length === 0) return null;

        return (
          <div key={section.title}>
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {section.title}
            </p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
