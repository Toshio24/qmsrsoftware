import Link from "next/link";
import { cn } from "@/lib/utils";

const baseClasses = "block rounded-lg border border-neutral-200 p-4 dark:border-neutral-800";

export function StatTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseClasses, "transition-colors hover:border-neutral-400 dark:hover:border-neutral-600")}
      >
        {inner}
      </Link>
    );
  }
  return <div className={baseClasses}>{inner}</div>;
}
