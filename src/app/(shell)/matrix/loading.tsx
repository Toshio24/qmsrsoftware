export default function MatrixLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      </div>
      <div className="h-9 w-56 rounded bg-neutral-100 dark:bg-neutral-900" />
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-neutral-100 px-3 py-3 last:border-0 dark:border-neutral-900"
          >
            <div className="h-4 w-14 rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="h-4 w-48 rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="h-4 w-32 flex-1 rounded bg-neutral-100 dark:bg-neutral-900" />
          </div>
        ))}
      </div>
    </div>
  );
}
