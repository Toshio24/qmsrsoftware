import Image from "next/image";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth/session";

export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  if (user.forcePasswordReset) redirect("/change-password");

  return (
    <div className="flex min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={24} height={24} className="shrink-0" />
              <p className="font-semibold">QMS Trace Matrix</p>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {user.fullName} · {user.role}
            </p>
            <div className="mt-2">
              <LogoutButton />
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav role={user.role} />
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  );
}
