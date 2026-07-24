import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import { ItemStatus, UserRole } from "@/generated/prisma/enums";
import { computeCoverageGaps, summarizeCoverage } from "@/lib/server/repository/gaps";
import { getEntityLabel, getItemTypeConfigBySlug } from "@/lib/domain/itemTypes";
import { StatTile } from "@/components/stat-tile";
import { CoverageMeter } from "@/components/coverage-meter";

const QUICK_CREATE_SLUGS = ["user-needs", "risks", "capas", "nonconformances", "documents"];

export default async function DashboardPage() {
  const user = await requireUser();

  const [statusCounts, totalItems, gapResults, recentActivity] = await Promise.all([
    db.traceItem.groupBy({ by: ["status"], _count: { _all: true } }),
    db.traceItem.count(),
    computeCoverageGaps(),
    db.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 8 }),
  ]);

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s._count._all]));
  const overall = summarizeCoverage(gapResults);
  const gapsWithIssues = gapResults.filter((r) => r.gapItems.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-neutral-500">Here&rsquo;s where things stand.</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Design-control coverage
            </h2>
            <Link href="/matrix/gaps" className="text-xs underline-offset-2 hover:underline">
              Full report →
            </Link>
          </div>
          <div className="mt-3">
            <CoverageMeter percent={overall.percent} />
          </div>
          {gapsWithIssues.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Every check is fully covered.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {gapsWithIssues.slice(0, 4).map(({ rule, total, gapItems }) => (
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
