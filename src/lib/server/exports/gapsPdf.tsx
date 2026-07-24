import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { computeCoverageGaps, summarizeCoverage } from "@/lib/server/repository/gaps";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: 700 },
  sectionStat: { fontSize: 10 },
  gapRow: { flexDirection: "row", paddingVertical: 2 },
  gapCode: { width: 60, fontFamily: "Courier" },
});

export async function renderGapsPdf(): Promise<Buffer> {
  const results = await computeCoverageGaps();
  const overall = summarizeCoverage(results);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>QMS Coverage Gap Report</Text>
        <Text style={styles.subtitle}>
          Generated {new Date().toLocaleString()} · Overall coverage {overall.percent}% (
          {overall.covered}/{overall.total})
        </Text>

        {results.map(({ rule, total, gapItems }) => (
          <View style={styles.section} key={rule.label} wrap={false}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{rule.label}</Text>
              <Text style={styles.sectionStat}>
                {total - gapItems.length}/{total} covered
              </Text>
            </View>
            {total === 0 ? (
              <Text>No items of this type yet.</Text>
            ) : gapItems.length === 0 ? (
              <Text>All covered.</Text>
            ) : (
              gapItems.map((item) => (
                <View style={styles.gapRow} key={item.id}>
                  <Text style={styles.gapCode}>{item.humanCode}</Text>
                  <Text>{item.title}</Text>
                </View>
              ))
            )}
          </View>
        ))}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
