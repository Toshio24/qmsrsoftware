import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/generated/prisma/enums";
import { PlaceholderPage } from "@/components/placeholder-page";
import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_LOCKOUT_THRESHOLD,
  SESSION_ABSOLUTE_HOURS,
  SESSION_IDLE_TIMEOUT_MINUTES,
} from "@/lib/auth/constants";
import { getDatabaseStats, formatBytes } from "@/lib/server/repository/dbStats";
import { cn } from "@/lib/utils";

// Neon's current Free plan (Oct 2026): 1 GB/project, 20 GB/account total.
// Purely informational — bump this if you're on a paid plan, or remove the
// bar entirely once this is reading a non-Neon/production database.
const FREE_TIER_PROJECT_LIMIT_BYTES = 1 * 1024 * 1024 * 1024;

function usageBarClasses(percent: number): string {
  if (percent >= 80) return "bg-red-600 dark:bg-red-500";
  if (percent >= 50) return "bg-amber-500 dark:bg-amber-400";
  return "bg-green-600 dark:bg-green-500";
}

export default async function AdminSettingsPage() {
  await requireRole([UserRole.ADMIN]);

  const stats = await getDatabaseStats();
  const percentOfFreeTier = Math.min(100, (stats.totalBytes / FREE_TIER_PROJECT_LIMIT_BYTES) * 100);

  return (
    <div className="flex flex-col gap-6">
      <PlaceholderPage
        title="Settings"
        phase="a later hardening phase"
        description="Making these configurable in-app (rather than fixed constants) is deferred. Current values, set in lib/auth/constants.ts:"
      />
      <ul className="max-w-md list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-400">
        <li>Session absolute lifetime: {SESSION_ABSOLUTE_HOURS} hours</li>
        <li>Session idle timeout: {SESSION_IDLE_TIMEOUT_MINUTES} minutes</li>
        <li>
          Account lockout: {LOGIN_LOCKOUT_THRESHOLD} failed attempts locks for{" "}
          {LOGIN_LOCKOUT_MINUTES} minutes
        </li>
      </ul>

      <div className="max-w-md rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Database storage
        </h2>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-2xl font-semibold tabular-nums">{formatBytes(stats.totalBytes)}</span>
          <span className="text-xs text-neutral-500">of 1 GB (Neon free plan)</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className={cn("h-full rounded-full transition-[width]", usageBarClasses(percentOfFreeTier))}
            style={{ width: `${Math.max(2, percentOfFreeTier)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Assumes Neon&rsquo;s free plan (1 GB/project, 20 GB/account) — attachments and PDF
          snapshots are stored as external links, not in this database, so growth here is just
          record text and the audit trail.
        </p>

        {stats.tables.length > 0 && (
          <table className="mt-4 w-full text-left text-xs">
            <thead className="text-neutral-500">
              <tr>
                <th className="py-1 font-medium">Table</th>
                <th className="py-1 text-right font-medium">Rows</th>
                <th className="py-1 text-right font-medium">Size</th>
              </tr>
            </thead>
            <tbody>
              {stats.tables.map((t) => (
                <tr key={t.name} className="border-t border-neutral-100 dark:border-neutral-900">
                  <td className="py-1 font-mono text-neutral-600 dark:text-neutral-400">{t.name}</td>
                  <td className="py-1 text-right tabular-nums text-neutral-500">{t.rows}</td>
                  <td className="py-1 text-right tabular-nums text-neutral-500">{formatBytes(t.bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
