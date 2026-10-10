import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getRiskRegisterRows } from "@/lib/server/repository/riskRegister";
import { ACCEPTABILITY_LABEL } from "@/lib/domain/riskMatrix";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 14 },
  headerRow: { flexDirection: "row", borderBottom: "1pt solid #333", paddingBottom: 3, marginBottom: 3 },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #ddd", paddingVertical: 3 },
  headerCell: { fontWeight: 700 },
  colCode: { width: "8%", fontFamily: "Courier" },
  colHazard: { width: "20%" },
  colHarm: { width: "14%" },
  colInitial: { width: "13%" },
  colResidual: { width: "13%" },
  colControls: { width: "17%" },
  colStatus: { width: "7%" },
});

export async function renderRiskRegisterPdf(product?: { id: string; name: string }): Promise<Buffer> {
  const rows = await getRiskRegisterRows(product?.id);

  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Risk Register{product ? ` — ${product.name}` : ""}</Text>
        <Text style={styles.subtitle}>
          Generated {new Date().toLocaleString()} · {rows.length} risk analyses (ISO 14971)
        </Text>

        <View style={styles.headerRow}>
          <Text style={[styles.colCode, styles.headerCell]}>Code</Text>
          <Text style={[styles.colHazard, styles.headerCell]}>Hazard / Situation</Text>
          <Text style={[styles.colHarm, styles.headerCell]}>Harm</Text>
          <Text style={[styles.colInitial, styles.headerCell]}>Initial (S/P/RPN/Verdict)</Text>
          <Text style={[styles.colResidual, styles.headerCell]}>Residual (S/P/RPN/Verdict)</Text>
          <Text style={[styles.colControls, styles.headerCell]}>Controls</Text>
          <Text style={[styles.colStatus, styles.headerCell]}>Status</Text>
        </View>

        {rows.map((row) => (
          <View style={styles.row} key={row.id} wrap={false}>
            <Text style={styles.colCode}>{row.humanCode}</Text>
            <Text style={styles.colHazard}>
              {row.hazard}
              {row.hazardousSituation ? ` — ${row.hazardousSituation}` : ""}
            </Text>
            <Text style={styles.colHarm}>{row.harm}</Text>
            <Text style={styles.colInitial}>
              {row.severityInitial ?? "—"}/{row.probabilityInitial ?? "—"}/{row.rpnInitial ?? "—"}
              {row.acceptabilityInitial ? ` — ${ACCEPTABILITY_LABEL[row.acceptabilityInitial]}` : ""}
            </Text>
            <Text style={styles.colResidual}>
              {row.severityResidual ?? "—"}/{row.probabilityResidual ?? "—"}/{row.rpnResidual ?? "—"}
              {row.acceptabilityResidual ? ` — ${ACCEPTABILITY_LABEL[row.acceptabilityResidual]}` : ""}
            </Text>
            <Text style={styles.colControls}>{row.controls.join(", ") || "—"}</Text>
            <Text style={styles.colStatus}>{row.status}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
