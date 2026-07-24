import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getMatrixItems, getMatrixLinks } from "@/lib/server/repository/matrix";
import { getItemTypeConfig } from "@/lib/domain/itemTypes";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 16 },
  headerRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #333",
    paddingBottom: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #ddd",
    paddingVertical: 3,
  },
  headerCell: { fontWeight: 700 },
  colCode: { width: "10%" },
  colType: { width: "16%" },
  colTitle: { width: "34%" },
  colStatus: { width: "10%" },
  colLinks: { width: "30%" },
});

function pushTo(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export async function renderMatrixPdf(): Promise<Buffer> {
  const [items, links] = await Promise.all([getMatrixItems(), getMatrixLinks()]);

  const linksByItem = new Map<string, string[]>();
  for (const link of links) {
    pushTo(linksByItem, link.sourceItemId, `${link.linkType} → ${link.targetItem.humanCode}`);
  }

  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>QMS Trace Matrix</Text>
        <Text style={styles.subtitle}>Generated {new Date().toLocaleString()} · {items.length} items</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.colCode, styles.headerCell]}>Code</Text>
          <Text style={[styles.colType, styles.headerCell]}>Type</Text>
          <Text style={[styles.colTitle, styles.headerCell]}>Title</Text>
          <Text style={[styles.colStatus, styles.headerCell]}>Status</Text>
          <Text style={[styles.colLinks, styles.headerCell]}>Outgoing Links</Text>
        </View>

        {items.map((item) => {
          const config = getItemTypeConfig(item.itemType);
          return (
            <View style={styles.row} key={item.id} wrap={false}>
              <Text style={styles.colCode}>{item.humanCode}</Text>
              <Text style={styles.colType}>{config.label}</Text>
              <Text style={styles.colTitle}>{item.title}</Text>
              <Text style={styles.colStatus}>{item.status}</Text>
              <Text style={styles.colLinks}>{(linksByItem.get(item.id) ?? []).join(", ")}</Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
