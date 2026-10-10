import Link from "next/link";
import { ArrowLeft, ExternalLink, GitBranch } from "lucide-react";
import { notFound } from "next/navigation";
import { getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { getItemWithCurrentVersion } from "@/lib/server/repository/items";
import { getProduct } from "@/lib/server/repository/products";
import { requireUser } from "@/lib/auth/session";
import { formatFieldValue, statusBadgeClasses } from "@/lib/domain/formatField";
import { toEditableHtml } from "@/lib/domain/richText";
import { ItemType } from "@/generated/prisma/enums";
import { StatusSelectForm } from "./status-select-form";
import { LinksSection } from "./links-section";
import { SignaturesSection } from "./signatures-section";
import { AttachmentsSection } from "./attachments-section";
import { CustomFieldsSection } from "./custom-fields-section";
import { RISK_SCORE_FIELD_KEYS, RiskAssessmentPanel } from "./risk-assessment-panel";

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
  const product = item.productId ? await getProduct(item.productId) : null;

  // Risk Analysis shows severity/probability/RPN in the dedicated
  // RiskAssessmentPanel below instead of the generic field list.
  const detailFields =
    config.type === ItemType.RISK_ITEM
      ? config.fields.filter((field) => !(RISK_SCORE_FIELD_KEYS as readonly string[]).includes(field.key))
      : config.fields;

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
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-neutral-500">{item.humanCode}</p>
              {product && (
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
                  {product.name}
                </span>
              )}
            </div>
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

      {config.type === ItemType.RISK_ITEM && <RiskAssessmentPanel version={version} />}

      <dl className="flex flex-col gap-4">
        {detailFields.map((field) => {
          const rawValue = version[field.key];
          return (
            <div key={field.key}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {field.label}
              </dt>
              <dd className="mt-0.5 text-sm">
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
                ) : field.kind === "textarea" ? (
                  rawValue ? (
                    // Rich content (tables, lists, etc.) — see richText.ts.
                    // The HTML here only ever came from RichTextEditor's own
                    // schema-constrained output or the legacy-plain-text
                    // escaping path, never from arbitrary user-supplied raw
                    // markup, so this is safe to render as-is.
                    <div
                      className="rich-content"
                      dangerouslySetInnerHTML={{ __html: toEditableHtml(rawValue) }}
                    />
                  ) : (
                    "—"
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{formatFieldValue(field, rawValue)}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <CustomFieldsSection slug={slug} traceItemId={item.id} />
      </div>

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
        <LinksSection slug={slug} traceItemId={item.id} itemType={config.type} productId={item.productId} />
      </div>
    </div>
  );
}
