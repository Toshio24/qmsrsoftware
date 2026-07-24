import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { getItemWithCurrentVersion } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import { formatFieldValue, statusBadgeClasses } from "@/lib/domain/formatField";
import { StatusSelectForm } from "./status-select-form";
import { LinksSection } from "./links-section";
import { SignaturesSection } from "./signatures-section";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const viewer = await requireUser();
  const { type: slug, id } = await params;
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const result = await getItemWithCurrentVersion(config.type, id);
  if (!result || !result.version) notFound();
  const { item, version } = result;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-neutral-500">{item.humanCode}</p>
          <h1 className="mt-1 text-2xl font-semibold">{item.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {config.label} · version {item.currentVersionNo} · created by{" "}
            {item.createdBy.fullName} on {item.createdAt.toLocaleDateString()}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClasses(item.status)}`}>
          {item.status}
        </span>
      </div>

      <div className="flex items-center gap-4 border-y border-neutral-200 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Status:</span>
          <StatusSelectForm slug={slug} traceItemId={item.id} currentStatus={item.status} />
        </div>
        <div className="ml-auto flex gap-3 text-sm">
          <Link href={`/items/${slug}/${item.id}/edit`} className="underline-offset-2 hover:underline">
            Edit (new version)
          </Link>
          <Link href={`/items/${slug}/${item.id}/history`} className="underline-offset-2 hover:underline">
            History
          </Link>
        </div>
      </div>

      <dl className="flex flex-col gap-4">
        {config.fields.map((field) => (
          <div key={field.key}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {field.label}
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm">
              {formatFieldValue(field, version[field.key])}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <SignaturesSection
          slug={slug}
          traceItemId={item.id}
          itemType={config.type}
          status={item.status}
          viewerRole={viewer.role}
        />
      </div>

      <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <LinksSection slug={slug} traceItemId={item.id} itemType={config.type} />
      </div>
    </div>
  );
}
