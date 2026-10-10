// ISO 14971 risk-estimation support: fixed severity/probability scales, a
// derived RPN, and a severity × probability acceptability matrix. Kept as a
// static domain config (like linkRules.ts/gapRules.ts) rather than an
// admin-editable setting — if that becomes a requirement later, this is the
// one place to replace with a DB-backed lookup.

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;
export type ProbabilityLevel = 1 | 2 | 3 | 4 | 5;
export type RiskAcceptability = "ACCEPTABLE" | "ALARP" | "UNACCEPTABLE";

export const SEVERITY_LEVELS: { value: SeverityLevel; label: string }[] = [
  { value: 1, label: "1 – Negligible" },
  { value: 2, label: "2 – Minor" },
  { value: 3, label: "3 – Serious" },
  { value: 4, label: "4 – Critical" },
  { value: 5, label: "5 – Catastrophic" },
];

export const PROBABILITY_LEVELS: { value: ProbabilityLevel; label: string }[] = [
  { value: 1, label: "1 – Improbable" },
  { value: 2, label: "2 – Remote" },
  { value: 3, label: "3 – Occasional" },
  { value: 4, label: "4 – Probable" },
  { value: 5, label: "5 – Frequent" },
];

export function computeRpn(
  severity: number | null | undefined,
  probability: number | null | undefined
): number | null {
  if (!severity || !probability) return null;
  return severity * probability;
}

/**
 * Acceptability matrix, indexed [severity - 1][probability - 1]. A fairly
 * standard medical-device risk matrix: low severity/probability combinations
 * are acceptable, the highest severity or highest probability combinations
 * are unacceptable outright, and the middle band is "as low as reasonably
 * practicable" (requires a documented benefit/risk judgment).
 */
const ACCEPTABILITY_MATRIX: RiskAcceptability[][] = [
  // severity 1 (Negligible)
  ["ACCEPTABLE", "ACCEPTABLE", "ACCEPTABLE", "ALARP", "ALARP"],
  // severity 2 (Minor)
  ["ACCEPTABLE", "ACCEPTABLE", "ALARP", "ALARP", "UNACCEPTABLE"],
  // severity 3 (Serious)
  ["ACCEPTABLE", "ALARP", "ALARP", "UNACCEPTABLE", "UNACCEPTABLE"],
  // severity 4 (Critical)
  ["ALARP", "ALARP", "UNACCEPTABLE", "UNACCEPTABLE", "UNACCEPTABLE"],
  // severity 5 (Catastrophic)
  ["ALARP", "UNACCEPTABLE", "UNACCEPTABLE", "UNACCEPTABLE", "UNACCEPTABLE"],
];

export function classifyRisk(
  severity: number | null | undefined,
  probability: number | null | undefined
): RiskAcceptability | null {
  if (!severity || !probability) return null;
  if (severity < 1 || severity > 5 || probability < 1 || probability > 5) return null;
  return ACCEPTABILITY_MATRIX[severity - 1][probability - 1];
}

export const ACCEPTABILITY_LABEL: Record<RiskAcceptability, string> = {
  ACCEPTABLE: "Acceptable",
  ALARP: "ALARP",
  UNACCEPTABLE: "Unacceptable",
};

export const ACCEPTABILITY_BADGE_CLASSES: Record<RiskAcceptability, string> = {
  ACCEPTABLE: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ALARP: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  UNACCEPTABLE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function levelLabel(
  levels: { value: number; label: string }[],
  value: number | null | undefined
): string {
  return levels.find((l) => l.value === value)?.label ?? "—";
}
