export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div>
        <div className="h-7 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-2 h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="mt-2 h-7 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="mt-4 h-2 w-full rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="h-4 w-full rounded bg-neutral-100 dark:bg-neutral-900" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
