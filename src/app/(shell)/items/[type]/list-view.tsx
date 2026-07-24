import Link from "next/link";
import type { ItemTypeConfig } from "@/lib/domain/itemTypes";

export function EmptyState({ config }: { config: ItemTypeConfig }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
      No {config.pluralLabel.toLowerCase()} yet.{" "}
      <Link href={`/items/${config.slug}/new`} className="underline">
        Create the first one
      </Link>
      .
    </div>
  );
}
