import type { FieldConfig } from "./itemTypes";

export function formatFieldValue(field: FieldConfig, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (field.kind) {
    case "boolean":
      return value ? "Yes" : "No";
    case "date": {
      const d = value instanceof Date ? value : new Date(value as string);
      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
    }
    case "select": {
      const opt = field.options?.find((o) => o.value === value);
      return opt?.label ?? String(value);
    }
    default:
      return String(value);
  }
}

export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    case "IN_REVIEW":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "APPROVED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "EFFECTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "REJECTED":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "RETIRED":
    case "OBSOLETE":
      return "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  }
}
