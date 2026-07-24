export function PlaceholderPage({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
      <div className="mt-4 inline-block rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-700">
        Coming in {phase}
      </div>
    </div>
  );
}
