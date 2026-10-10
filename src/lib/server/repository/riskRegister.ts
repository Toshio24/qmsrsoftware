import "server-only";
import { db } from "@/lib/server/db";
import { ItemType, LinkStatus, LinkType } from "@/generated/prisma/enums";
import { listItemsWithCurrentVersion } from "./items";
import { classifyRisk, type RiskAcceptability } from "@/lib/domain/riskMatrix";
import { stripHtmlToText } from "@/lib/domain/richText";

export type RiskRegisterRow = {
  id: string;
  humanCode: string;
  title: string;
  status: string;
  hazard: string;
  hazardousSituation: string;
  harm: string;
  severityInitial: number | null;
  probabilityInitial: number | null;
  rpnInitial: number | null;
  acceptabilityInitial: RiskAcceptability | null;
  severityResidual: number | null;
  probabilityResidual: number | null;
  rpnResidual: number | null;
  acceptabilityResidual: RiskAcceptability | null;
  controls: string[];
};

/** Every Risk Analysis (including retired, for a complete record), with its
 * initial/residual acceptability verdicts and the human codes of any active
 * mitigating Risk Controls — the data behind the Risk Register export. A
 * risk management file is inherently per-device, so `productId` restricts
 * this to one product. */
export async function getRiskRegisterRows(productId?: string): Promise<RiskRegisterRow[]> {
  const rows = await listItemsWithCurrentVersion(ItemType.RISK_ITEM, undefined, {
    includeRetired: true,
    productId,
  });
  const riskIds = rows.map(({ item }) => item.id);

  const mitigatingLinks = riskIds.length
    ? await db.traceLink.findMany({
        where: {
          targetItemId: { in: riskIds },
          linkType: LinkType.MITIGATES,
          status: LinkStatus.ACTIVE,
        },
        include: { sourceItem: true },
      })
    : [];
  const controlsByRiskId = new Map<string, string[]>();
  for (const link of mitigatingLinks) {
    const list = controlsByRiskId.get(link.targetItemId);
    if (list) list.push(link.sourceItem.humanCode);
    else controlsByRiskId.set(link.targetItemId, [link.sourceItem.humanCode]);
  }

  return rows.map(({ item, version }) => {
    const severityInitial = (version?.severityInitial as number | null) ?? null;
    const probabilityInitial = (version?.probabilityInitial as number | null) ?? null;
    const severityResidual = (version?.severityResidual as number | null) ?? null;
    const probabilityResidual = (version?.probabilityResidual as number | null) ?? null;

    return {
      id: item.id,
      humanCode: item.humanCode,
      title: item.title,
      status: item.status,
      hazard: (version?.hazard as string | undefined) ?? "",
      // hazardousSituation is a "textarea" field — stores rich HTML now
      // (see richText.ts); this export is plain PDF/CSV text, not HTML.
      hazardousSituation: stripHtmlToText(version?.hazardousSituation),
      harm: (version?.harm as string | undefined) ?? "",
      severityInitial,
      probabilityInitial,
      rpnInitial: (version?.rpnInitial as number | null | undefined) ?? null,
      acceptabilityInitial: classifyRisk(severityInitial, probabilityInitial),
      severityResidual,
      probabilityResidual,
      rpnResidual: (version?.rpnResidual as number | null | undefined) ?? null,
      acceptabilityResidual: classifyRisk(severityResidual, probabilityResidual),
      controls: controlsByRiskId.get(item.id) ?? [],
    };
  });
}
