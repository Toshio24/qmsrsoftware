export default function ItemListLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
        <div className="h-9 w-28 rounded-md bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="h-8 w-64 rounded bg-neutral-100 dark:bg-neutral-900" />
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-neutral-100 px-3 py-3 last:border-0 dark:border-neutral-900"
          >
            <div className="h-4 w-16 rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="h-4 w-64 flex-1 rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="h-5 w-16 rounded-full bg-neutral-100 dark:bg-neutral-900" />
          </div>
        ))}
      </div>
    </div>
  );
}
