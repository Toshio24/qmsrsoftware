import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { listVersionHistory } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import { formatFieldValue } from "@/lib/domain/formatField";

export default async function ItemHistoryPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  await requireUser();
  const { type: slug, id } = await params;
  const config = getItemTypeConfigBySlug(slug);
  if (!config) notFound();

  const versions = await listVersionHistory(config.type, id);
  if (versions.length === 0) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Version history — {config.label}</h1>

      {versions.map((version) => (
        <div
          key={version.id}
          className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <p className="text-sm font-medium">
            Version {version.versionNumber} — {(version.createdBy as { fullName: string }).fullName}
            {" · "}
            {version.createdAt.toLocaleString()}
          </p>
          <dl className="mt-3 flex flex-col gap-2">
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
        </div>
      ))}
    </div>
  );
}
