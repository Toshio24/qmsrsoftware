import "server-only";
import { stringify } from "csv-stringify/sync";
import { computeCoverageGaps } from "@/lib/server/repository/gaps";

export async function buildGapsCsv(): Promise<string> {
  const results = await computeCoverageGaps();

  const rows = results.map(({ rule, total, gapItems }) => ({
    Rule: rule.label,
    Total: total,
    Covered: total - gapItems.length,
    "Gap Count": gapItems.length,
    "Gap Item Codes": gapItems.map((i) => i.humanCode).join("; "),
  }));

  return stringify(rows, { header: true });
}
