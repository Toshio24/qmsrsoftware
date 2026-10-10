import "server-only";
import { stringify } from "csv-stringify/sync";
import { getRiskRegisterRows } from "@/lib/server/repository/riskRegister";
import { ACCEPTABILITY_LABEL } from "@/lib/domain/riskMatrix";

export async function buildRiskRegisterCsv(productId?: string): Promise<string> {
  const rows = await getRiskRegisterRows(productId);

  const csvRows = rows.map((row) => ({
    Code: row.humanCode,
    Hazard: row.hazard,
    "Hazardous Situation": row.hazardousSituation,
    Harm: row.harm,
    "Severity (Initial)": row.severityInitial ?? "",
    "Probability (Initial)": row.probabilityInitial ?? "",
    "RPN (Initial)": row.rpnInitial ?? "",
    "Acceptability (Initial)": row.acceptabilityInitial ? ACCEPTABILITY_LABEL[row.acceptabilityInitial] : "",
    "Severity (Residual)": row.severityResidual ?? "",
    "Probability (Residual)": row.probabilityResidual ?? "",
    "RPN (Residual)": row.rpnResidual ?? "",
    "Acceptability (Residual)": row.acceptabilityResidual
      ? ACCEPTABILITY_LABEL[row.acceptabilityResidual]
      : "",
    "Mitigating Controls": row.controls.join("; "),
    Status: row.status,
  }));

  return stringify(csvRows, { header: true });
}
