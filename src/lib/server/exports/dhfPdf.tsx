import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getDhfSections } from "@/lib/server/repository/dhf";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  headerRow: { flexDirection: "row", borderBottom: "1pt solid #333", paddingBottom: 3, marginBottom: 3 },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #ddd", paddingVertical: 2 },
  headerCell: { fontWeight: 700 },
  colCode: { width: "15%", fontFamily: "Courier" },
  colTitle: { width: "55%" },
  colStatus: { width: "15%" },
  colVersion: { width: "15%" },
});

export async function renderDhfPdf(product?: { id: string; name: string }): Promise<Buffer> {
  const sections = await getDhfSections(product?.id);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Design History File{product ? ` — ${product.name}` : ""}</Text>
        <Text style={styles.subtitle}>
          Generated {new Date().toLocaleString()} — compiled per ISO 13485 §4.2.3 / §7.3
        </Text>

        {sections.map((section) => (
          <View style={styles.section} key={section.itemType} wrap={false}>
            <Text style={styles.sectionTitle}>
              {section.label} ({section.items.length})
            </Text>
            {section.items.length === 0 ? (
              <Text>None recorded yet.</Text>
            ) : (
              <>
                <View style={styles.headerRow}>
                  <Text style={[styles.colCode, styles.headerCell]}>Code</Text>
                  <Text style={[styles.colTitle, styles.headerCell]}>Title</Text>
                  <Text style={[styles.colStatus, styles.headerCell]}>Status</Text>
                  <Text style={[styles.colVersion, styles.headerCell]}>Version</Text>
                </View>
                {section.items.map((item) => (
                  <View style={styles.row} key={item.id}>
                    <Text style={styles.colCode}>{item.humanCode}</Text>
                    <Text style={styles.colTitle}>{item.title}</Text>
                    <Text style={styles.colStatus}>{item.status}</Text>
                    <Text style={styles.colVersion}>{item.versionNumber}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        ))}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
