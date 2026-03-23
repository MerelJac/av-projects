import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 9, fontFamily: "Helvetica", color: "#111" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  companyTagline: { fontSize: 8, color: "#888", marginTop: 2 },
  poTitleBlock: { alignItems: "flex-end" },
  poTitle: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  poMeta: { fontSize: 8, color: "#888", marginTop: 3 },

  // Address block
  addressRow: { flexDirection: "row", marginBottom: 20, gap: 24 },
  addressBlock: { flex: 1 },
  addressLabel: { fontSize: 7, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  addressName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  addressText: { fontSize: 9, color: "#333", lineHeight: 1.4 },

  // Info row
  infoRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#E5E3DE",
    paddingVertical: 6,
    marginBottom: 16,
    gap: 0,
  },
  infoCell: { flex: 1 },
  infoLabel: { fontSize: 7, color: "#888", marginBottom: 2 },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    paddingBottom: 5,
    marginBottom: 2,
  },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0EEE9",
  },
  colItem: { width: 90 },
  colDesc: { flex: 1 },
  colUnit: { width: 30, textAlign: "center" },
  colQty: { width: 44, textAlign: "right" },
  colPrice: { width: 60, textAlign: "right" },
  colTotal: { width: 68, textAlign: "right", fontFamily: "Helvetica-Bold" },

  // Totals
  totalsBlock: { marginTop: 20, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", marginTop: 3 },
  totalLabel: { width: 100, textAlign: "right", color: "#555" },
  totalValue: { width: 68, textAlign: "right" },
  grandTotalLabel: { width: 100, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 10 },
  grandTotalValue: { width: 68, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 10 },
  divider: { borderTopWidth: 0.5, borderTopColor: "#111", marginTop: 4, marginBottom: 4, width: 168 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E3DE",
    paddingTop: 8,
    fontSize: 7,
    color: "#999",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

type POLine = {
  id: string;
  itemNumber: string;
  manufacturer: string | null;
  description: string | null;
  quantity: number;
  cost: number;
};

export function buildPOPDF({
  poNumber,
  createdAt,
  vendorName,
  vendorAddress,
  shipToAddress,
  billToAddress,
  shippingMethod,
  billingTerms,
  buyerName,
  vendorId,
  lines,
}: {
  poNumber: string;
  createdAt: Date;
  vendorName: string;
  vendorAddress: string | null;
  shipToAddress: string | null;
  billToAddress: string | null;
  shippingMethod: string | null;
  billingTerms: string | null;
  buyerName: string | null;
  vendorId: string;
  lines: POLine[];
}) {
  const subtotal = lines.reduce((s, l) => s + l.cost * l.quantity, 0);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Call One, Inc</Text>
            <Text style={styles.companyTagline}>Audio Visual Solutions</Text>
          </View>
          <View style={styles.poTitleBlock}>
            <Text style={styles.poTitle}>PURCHASE ORDER {poNumber}</Text>
            <Text style={styles.poMeta}>Date: {dateStr}</Text>
            <Text style={styles.poMeta}>Page: 1</Text>
          </View>
        </View>

        {/* Vendor / Ship To */}
        <View style={styles.addressRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Vendor:</Text>
            <Text style={styles.addressName}>{vendorName}</Text>
            {vendorAddress ? (
              <Text style={styles.addressText}>{vendorAddress}</Text>
            ) : null}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Ship To:</Text>
            {shipToAddress ? (
              <Text style={styles.addressText}>{shipToAddress}</Text>
            ) : (
              <Text style={styles.addressText}>—</Text>
            )}
          </View>
          {billToAddress ? (
            <View style={styles.addressBlock}>
              <Text style={styles.addressLabel}>Bill To:</Text>
              <Text style={styles.addressText}>{billToAddress}</Text>
            </View>
          ) : null}
        </View>

        {/* Info row */}
        <View style={styles.infoRow}>
          {shippingMethod ? (
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Ship Via</Text>
              <Text style={styles.infoValue}>{shippingMethod}</Text>
            </View>
          ) : null}
          {buyerName ? (
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Buyer</Text>
              <Text style={styles.infoValue}>{buyerName}</Text>
            </View>
          ) : null}
          {billingTerms ? (
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Billing Terms</Text>
              <Text style={styles.infoValue}>{billingTerms}</Text>
            </View>
          ) : null}
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Vendor ID</Text>
            <Text style={styles.infoValue}>{vendorId}</Text>
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colItem]}>Item No.</Text>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total Price</Text>
        </View>

        {lines.map((line) => (
          <View key={line.id} style={styles.row}>
            <Text style={styles.colItem}>{line.itemNumber}</Text>
            <View style={styles.colDesc}>
              {line.manufacturer ? (
                <Text style={{ fontSize: 8, color: "#555" }}>{line.manufacturer}</Text>
              ) : null}
              {line.description ? (
                <Text style={{ fontSize: 8 }}>{line.description}</Text>
              ) : null}
            </View>
            <Text style={styles.colUnit}>EA</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colPrice}>{fmt(line.cost)}</Text>
            <Text style={styles.colTotal}>{fmt(line.cost * line.quantity)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Sales Tax:</Text>
            <Text style={styles.totalValue}>0.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{fmt(subtotal)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Call One, Inc · Audio Visual Solutions</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
