import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { htmlToPdfElements } from "@/lib/utils/htmlToPdf";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  companyTagline: { fontSize: 9, color: "#888", marginTop: 3 },
  quoteLabel: { fontSize: 9, color: "#888", textAlign: "right" },
  quoteNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 2,
  },
  customerBlock: { marginBottom: 28 },
  customerLabel: {
    fontSize: 8,
    color: "#888",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  customerName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E3DE",
    paddingBottom: 5,
    marginBottom: 2,
  },
  tableHeaderText: { fontSize: 8, color: "#888", fontFamily: "Helvetica-Bold" },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0EEE9",
  },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: "right" },
  colPrice: { width: 64, textAlign: "right" },
  colTotal: { width: 72, textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalBlock: { marginTop: 24, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", gap: 24, marginTop: 4 },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    width: 80,
    textAlign: "right",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    width: 72,
    textAlign: "right",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#111",
    marginTop: 4,
    marginBottom: 4,
    width: 156,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E3DE",
    paddingTop: 10,
    fontSize: 8,
    color: "#999",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bundleHeader: {
    backgroundColor: "#F7F6F3",
    padding: "5 8",
    marginBottom: 2,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bundleTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#444" },
  textSection: { marginTop: 28 },
  textSectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E3DE",
    paddingBottom: 4,
  },
  textSectionBody: { fontSize: 9, lineHeight: 1.6, color: "#333" },
  quoteTypeLabel: { fontSize: 8, color: "#888", textAlign: "right" as const, marginTop: 2 },
});

type Line = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  bundleId: string | null;
};
type Bundle = { id: string; name: string; showToCustomer: boolean };

export function buildQuotePDF({
  quoteNumber,
  customerName,
  isDirect,
  isChangeOrder,
  lines,
  bundles,
  createdAt,
  terms,
  scopeOfWork,
  termsAndConditions,
  clientResponsibilities,
}: {
  quoteNumber: string;
  customerName: string;
  isDirect?: boolean;
  isChangeOrder?: boolean;
  lines: Line[];
  bundles: Bundle[];
  createdAt: Date;
  terms?: string;
  scopeOfWork?: string;
  termsAndConditions?: string;
  clientResponsibilities?: string;
}) {
  const visibleBundles = bundles.filter((b) => b.showToCustomer);
  const unbundledLines = lines.filter((l) => !l.bundleId);
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const fmt = (n: number) =>
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Call One, Inc</Text>
            <Text style={styles.companyTagline}>Audio Visual Solutions</Text>
          </View>
          <View>
            <Text style={styles.quoteLabel}>{isChangeOrder ? "CHANGE ORDER" : isDirect ? "DIRECT SALE" : "PROPOSAL"}</Text>
            <Text style={styles.quoteNumber}>#{quoteNumber}</Text>
            <Text style={[styles.quoteLabel, { marginTop: 4 }]}>
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.customerBlock}>
          <Text style={styles.customerLabel}>Prepared for</Text>
          <Text style={styles.customerName}>{customerName}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>
            Unit Price
          </Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        {bundles.map((bundle) => {
          const bundleLines = lines.filter((l) => l.bundleId === bundle.id);
          const bundleTotal = bundleLines.reduce(
            (s, l) => s + l.price * l.quantity,
            0,
          );
          return (
            <View key={bundle.id}>
              <View style={styles.bundleHeader}>
                <Text style={styles.bundleTitle}>{bundle.name}</Text>
                <Text style={styles.bundleTitle}>{fmt(bundleTotal)}</Text>
              </View>
              {bundle.showToCustomer &&
                bundleLines.map((line) => (
                  <View key={line.id} style={styles.row}>
                    <Text style={styles.colDesc}>{line.description}</Text>
                    <Text style={styles.colQty}>{line.quantity}</Text>
                    <Text style={styles.colPrice}>{fmt(line.price)}</Text>
                    <Text style={styles.colTotal}>
                      {fmt(line.price * line.quantity)}
                    </Text>
                  </View>
                ))}
            </View>
          );
        })}
        <View style={styles.totalBlock}>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{fmt(subtotal)}</Text>
          </View>
        </View>

        {[
          { label: "Scope of Work", text: scopeOfWork },
          { label: "Terms & Conditions", text: termsAndConditions },
          { label: "Client Responsibilities", text: clientResponsibilities },
        ].filter(({ text }) => !!text).map(({ label, text }) => (
          <View key={label} style={styles.textSection}>
            <Text style={styles.textSectionLabel}>{label}</Text>
            <View style={styles.textSectionBody}>{htmlToPdfElements(text ?? "")}</View>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>
            {terms ??
              "Thank you for your business. Shipping is not included in this quote. This quote is valid for 30 days."}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
