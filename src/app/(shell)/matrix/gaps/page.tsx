import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { computeCoverageGaps, summarizeCoverage } from "@/lib/server/repository/gaps";
import { getItemTypeConfig } from "@/lib/domain/itemTypes";
import { CoverageMeter } from "@/components/coverage-meter";

export default async function MatrixGapsPage() {
  await requireUser();

  const results = await computeCoverageGaps();
  const overall = summarizeCoverage(results);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Coverage Gaps</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Classic design-control checks — an item is &ldquo;covered&rdquo; if at least one
            active trace link of the required type points at it.{" "}
            <Link href="/matrix" className="underline-offset-2 hover:underline">
              Back to matrix
            </Link>
          </p>
        </div>
        <Link
          href="/exports"
          className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Export report
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Overall coverage</h2>
          <span className="text-sm font-semibold tabular-nums">
            {overall.covered}/{overall.total}
          </span>
        </div>
        <CoverageMeter percent={overall.percent} className="mt-2" />
      </div>

      {results.map(({ rule, total, gapItems }) => {
        const config = getItemTypeConfig(rule.itemType);
        const pctCovered = total === 0 ? 100 : Math.round(((total - gapItems.length) / total) * 100);
        return (
          <div
            key={`${rule.itemType}-${rule.requiredIncomingLinkType}`}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{rule.label}</h2>
              <span className="text-sm font-medium tabular-nums text-neutral-500">
                {total - gapItems.length}/{total}
              </span>
            </div>
            <CoverageMeter percent={pctCovered} className="mt-2" />

            {total === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No {config.pluralLabel.toLowerCase()} yet.</p>
            ) : gapItems.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">All {config.pluralLabel.toLowerCase()} covered.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {gapItems.map((item) => (
                  <li key={item.id} className="text-sm">
                    <Link
                      href={`/items/${config.slug}/${item.id}`}
                      className="font-mono text-xs text-neutral-500 hover:underline"
                    >
                      {item.humanCode}
                    </Link>{" "}
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
