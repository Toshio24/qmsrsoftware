import "server-only";
import { getMatrixItems, getMatrixLinks } from "./matrix";
import { gapRules, type GapRule } from "@/lib/domain/gapRules";

export type GapResult = {
  rule: GapRule;
  total: number;
  gapItems: { id: string; humanCode: string; title: string }[];
};

export async function computeCoverageGaps(): Promise<GapResult[]> {
  const [allItems, allLinks] = await Promise.all([getMatrixItems(), getMatrixLinks()]);

  const coverageKey = (targetId: string, linkType: string) => `${targetId}:${linkType}`;
  const covered = new Set(allLinks.map((l) => coverageKey(l.targetItemId, l.linkType)));

  return gapRules.map((rule) => {
    const candidates = allItems.filter((i) => i.itemType === rule.itemType);
    const gapItems = candidates.filter(
      (i) => !covered.has(coverageKey(i.id, rule.requiredIncomingLinkType))
    );
    return { rule, total: candidates.length, gapItems };
  });
}

/** Overall coverage percentage across every rule (equally weighted by item, not by rule). */
export function summarizeCoverage(results: GapResult[]): { percent: number; covered: number; total: number } {
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const gaps = results.reduce((sum, r) => sum + r.gapItems.length, 0);
  const covered = total - gaps;
  return { percent: total === 0 ? 100 : Math.round((covered / total) * 100), covered, total };
}
