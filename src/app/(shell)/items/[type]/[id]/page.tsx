import Link from "next/link";
import { ArrowLeft, ExternalLink, GitBranch } from "lucide-react";
import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { getItemWithCurrentVersion } from "@/lib/server/repository/items";
import { requireUser } from "@/lib/auth/session";
import { formatFieldValue, statusBadgeClasses } from "@/lib/domain/formatField";
import { StatusSelectForm } from "./status-select-form";
import { LinksSection } from "./links-section";
import { SignaturesSection } from "./signatures-section";
import { AttachmentsSection } from "./attachments-section";

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
  const Icon = config.icon;
  const backHref = item.folderId ? `/items/${slug}?folder=${item.folderId}` : `/items/${slug}`;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 hover:underline dark:hover:text-neutral-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {config.pluralLabel}
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-xs text-neutral-500">{item.humanCode}</p>
            <h1 className="mt-1 text-2xl font-semibold">{item.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {config.label} · version {item.currentVersionNo} · created by{" "}
              {item.createdBy.fullName} on {item.createdAt.toLocaleDateString()}
            </p>
          </div>
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
          <Link
            href={`/matrix?view=table&focus=${item.id}`}
            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            <GitBranch className="h-3.5 w-3.5" />
            View in Trace Matrix
          </Link>
        </div>
      </div>

      <dl className="flex flex-col gap-4">
        {config.fields.map((field) => {
          const rawValue = version[field.key];
          return (
            <div key={field.key}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {field.label}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm">
                {field.kind === "url" && typeof rawValue === "string" && rawValue ? (
                  <a
                    href={rawValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {rawValue}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  formatFieldValue(field, rawValue)
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <AttachmentsSection slug={slug} traceItemId={item.id} />
      </div>

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
