import { cn } from "@/lib/utils";

function severityClasses(percent: number): string {
  if (percent >= 90) return "bg-green-600 dark:bg-green-500";
  if (percent >= 50) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-600 dark:bg-red-500";
}

/** A thin, severity-colored progress meter: green ≥90%, amber ≥50%, red below. */
export function CoverageMeter({ percent, className }: { percent: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={cn("h-full rounded-full transition-[width]", severityClasses(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-neutral-500">
        {clamped}%
      </span>
    </div>
  );
}
