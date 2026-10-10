import "server-only";
import { stringify } from "csv-stringify/sync";
import { computeCoverageGaps } from "@/lib/server/repository/gaps";

export async function buildGapsCsv(productId?: string): Promise<string> {
  const results = await computeCoverageGaps(productId);

  const rows = results.map(({ rule, total, gapItems }) => ({
    Rule: rule.label,
    Total: total,
    Covered: total - gapItems.length,
    "Gap Count": gapItems.length,
    "Gap Item Codes": gapItems.map((i) => i.humanCode).join("; "),
  }));

  return stringify(rows, { header: true });
}
