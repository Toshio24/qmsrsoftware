import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getCurrentProduct } from "@/lib/auth/currentProduct";
import { db } from "@/lib/server/db";
import { ItemStatus, ItemType, LinkType, UserRole } from "@/generated/prisma/enums";
import { computeCoverageGaps, summarizeCoverage } from "@/lib/server/repository/gaps";
import { listItemsWithCurrentVersion } from "@/lib/server/repository/items";
import { getEntityLabel, getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { classifyRisk } from "@/lib/domain/riskMatrix";
import { StatTile } from "@/components/stat-tile";
import { CoverageMeter } from "@/components/coverage-meter";

const QUICK_CREATE_SLUGS = ["design-plans", "user-needs", "risks", "capas", "nonconformances"];

export default async function DashboardPage() {
  const user = await requireUser();
  const product = await getCurrentProduct();
  // Counts combine the current product's scoped records with every shared
  // Quality Operations record (which is never tied to a product) — "what's
  // relevant to what you're looking at right now", same rule as the matrix.
  const scopeFilter = product ? { OR: [{ productId: product.id }, { productId: null }] } : {};

  const [statusCounts, totalItems, gapResults, recentActivity, effectivePlan, riskRows] =
    await Promise.all([
      db.traceItem.groupBy({ by: ["status"], where: scopeFilter, _count: { _all: true } }),
      db.traceItem.count({ where: scopeFilter }),
      computeCoverageGaps(product?.id),
      db.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 8 }),
      db.traceItem.findFirst({
        where: { itemType: ItemType.DESIGN_PLAN, status: ItemStatus.EFFECTIVE, productId: product?.id },
        select: { id: true },
      }),
      listItemsWithCurrentVersion(ItemType.RISK_ITEM, undefined, { productId: product?.id }),
    ]);

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s._count._all]));

  // Design Control vs Risk Management are reported separately — every gap
  // rule is one or the other (see gapRules.ts): MITIGATES is the one
  // risk-side check, everything else belongs to design control.
  const designControlGaps = gapResults.filter((r) => r.rule.requiredIncomingLinkType !== LinkType.MITIGATES);
  const riskGaps = gapResults.filter((r) => r.rule.requiredIncomingLinkType === LinkType.MITIGATES);
  const designControlCoverage = summarizeCoverage(designControlGaps);
  const designControlGapsWithIssues = designControlGaps.filter((r) => r.gapItems.length > 0);

  const riskAcceptability = riskRows
    .filter(({ item }) => item.status !== ItemStatus.RETIRED)
    .map(({ version }) =>
      classifyRisk(
        version?.severityInitial as number | null,
        version?.probabilityInitial as number | null
      )
    );
  const unacceptableCount = riskAcceptability.filter((a) => a === "UNACCEPTABLE").length;
  const alarpCount = riskAcceptability.filter((a) => a === "ALARP").length;
  const uncontrolledRisksGap = riskGaps[0];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Welcome back, {user.fullName.split(" ")[0]}</h1>
          {product && (
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
              {product.name}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Here&rsquo;s where things stand
          {product ? ` for ${product.name}` : ""} — Suppliers, CAPAs, and other Quality
          Operations records are shared across every product.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total items" value={totalItems} href="/matrix" />
        <StatTile
          label="Draft"
          value={countByStatus.get(ItemStatus.DRAFT) ?? 0}
          href="/matrix?view=table"
        />
        <StatTile
          label="In review"
          value={countByStatus.get(ItemStatus.IN_REVIEW) ?? 0}
          href="/matrix?view=table"
        />
        <StatTile
          label="Effective"
          value={countByStatus.get(ItemStatus.EFFECTIVE) ?? 0}
          href="/matrix?view=table"
        />
      </div>

      {!effectivePlan && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
          No <Link href="/items/design-plans" className="underline">Design &amp; Development Plan</Link>{" "}
          is effective yet for {product ? product.name : "this product"} — development
          isn&rsquo;t currently governed by an approved plan (ISO 13485 §7.3.2).
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Design Control coverage
            </h2>
            <Link href="/matrix/gaps" className="text-xs underline-offset-2 hover:underline">
              Full report →
            </Link>
          </div>
          <div className="mt-3">
            <CoverageMeter percent={designControlCoverage.percent} />
          </div>
          {designControlGapsWithIssues.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Every check is fully covered.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {designControlGapsWithIssues.slice(0, 4).map(({ rule, total, gapItems }) => (
                <li key={rule.label} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">{rule.label}</span>
                  <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
                    {total - gapItems.length}/{total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Risk Management
            </h2>
            <Link href="/items/risks" className="text-xs underline-offset-2 hover:underline">
              View risks →
            </Link>
          </div>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600 dark:text-neutral-400">Unacceptable (initial)</dt>
              <dd className="font-medium tabular-nums text-red-600 dark:text-red-400">
                {unacceptableCount}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600 dark:text-neutral-400">ALARP (initial)</dt>
              <dd className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
                {alarpCount}
              </dd>
            </div>
            {uncontrolledRisksGap && (
              <div className="flex items-center justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">{uncontrolledRisksGap.rule.label}</dt>
                <dd className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
                  {uncontrolledRisksGap.gapItems.length}
                </dd>
              </div>
            )}
          </dl>
          {unacceptableCount === 0 && alarpCount === 0 && (
            <p className="mt-3 text-sm text-neutral-500">No open ALARP or unacceptable risks.</p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Quick create
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_CREATE_SLUGS.map((slug) => {
              const config = getItemTypeConfigBySlug(slug);
              if (!config) return null;
              return (
                <Link
                  key={slug}
                  href={`/items/${slug}/new`}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
                >
                  + {config.label}
                </Link>
              );
            })}
          </div>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Recent activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">Nothing recorded yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {recentActivity.map((entry) => (
                <li key={entry.id.toString()} className="text-sm">
                  <span className="text-neutral-400">{entry.timestamp.toLocaleString()}</span>{" "}
                  <span className="font-medium">{entry.actorUsernameSnapshot}</span>{" "}
                  <span className="text-neutral-500">
                    {entry.action.toLowerCase().replace("_", " ")} {getEntityLabel(entry.entityType)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(
            [UserRole.ADMIN, UserRole.QA, UserRole.AUDITOR_READONLY] as UserRole[]
          ).includes(user.role) && (
            <Link
              href="/audit-log"
              className="mt-3 inline-block text-xs underline-offset-2 hover:underline"
            >
              View full audit log →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
