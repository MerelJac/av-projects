import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  companyTagline: { fontSize: 9, color: "#888", marginTop: 3 },
  invoiceLabel: { fontSize: 9, color: "#888", textAlign: "right" },
  invoiceNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 2,
  },
  addressBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 32,
    marginBottom: 24,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E3DE",
    paddingTop: 12,
  },
  billToBlock: { marginBottom: 28 },
  billToLabel: {
    fontSize: 8,
    color: "#888",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  billToName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  billToDetail: { fontSize: 9, color: "#555", marginTop: 2 },
  metaGrid: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 24,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E3DE",
    paddingTop: 12,
  },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 8,
    color: "#888",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
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
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#111",
    marginTop: 4,
    marginBottom: 4,
    width: 156,
  },
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
  percentBlock: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  percentText: { fontSize: 10, color: "#555" },
  notesBlock: { marginTop: 24 },
  notesLabel: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E3DE",
    paddingBottom: 4,
  },
  notesText: { fontSize: 9, color: "#333", lineHeight: 1.6 },
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
});

type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  isBundleTotal: boolean;
};

const BILLING_TERMS_LABELS: Record<string, string> = {
  NET30: "Net 30",
  PROGRESS: "Progress Billing",
  PREPAID: "Prepaid",
};

const fmt = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function formatDate(d: Date | null | string | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function buildInvoicePDF({
  invoiceNumber,
  customerName,
  customerEmail,
  customerPhone,
  billToAddress,
  billingTerms,
  chargeType,
  chargePercent,
  lines,
  amount,
  issuedAt,
  dueDate,
  notes,
}: {
  invoiceNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  billToAddress: string | null;
  billingTerms: "NET30" | "PROGRESS" | "PREPAID" | null;
  chargeType: "LINE_ITEMS" | "PERCENTAGE";
  chargePercent: number | null;
  lines: InvoiceLine[];
  amount: number | null;
  issuedAt: Date | null;
  dueDate: Date | null;
  notes: string | null;
}) {
  const total = amount ?? 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src="public/c1-hd-logo.png" style={{ width: 120 }} />
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
            <Text style={[styles.invoiceLabel, { marginTop: 4 }]}>
              {formatDate(issuedAt)}
            </Text>
          </View>
        </View>

        {/* Call One To */}
        <View style={styles.billToBlock}>
          {customerName && (
            <Text style={styles.billToDetail}>Call One, Inc.</Text>
          )}
          {customerEmail && (
            <Text style={styles.billToDetail}>PO Box 9002</Text>
          )}
          {customerPhone && (
            <Text style={styles.billToDetail}>Cape Canaveral, FL 32920</Text>
          )}
          {billToAddress && <Text style={styles.billToDetail}>US</Text>}
        </View>

        <View style={styles.addressBlock}>
          {/* Bill To */}
          <View style={styles.billToBlock}>
            <Text style={styles.billToLabel}>Bill To</Text>
            {customerName && (
              <Text style={styles.billToName}>{customerName}</Text>
            )}
            {customerEmail && (
              <Text style={styles.billToDetail}>{customerEmail}</Text>
            )}
            {customerPhone && (
              <Text style={styles.billToDetail}>{customerPhone}</Text>
            )}
            {billToAddress && (
              <Text style={styles.billToDetail}>{billToAddress}</Text>
            )}
          </View>

          {/* ship To */}
          <View style={styles.billToBlock}>
            <Text style={styles.billToLabel}>Ship To</Text>
            {customerName && (
              <Text style={styles.billToName}>{customerName}</Text>
            )}
            {customerEmail && (
              <Text style={styles.billToDetail}>{customerEmail}</Text>
            )}
            {customerPhone && (
              <Text style={styles.billToDetail}>{customerPhone}</Text>
            )}
            {billToAddress && (
              <Text style={styles.billToDetail}>{billToAddress}</Text>
            )}
          </View>
        </View>


        {/* Meta grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Invoice Date</Text>
            <Text style={styles.metaValue}>{formatDate(issuedAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{formatDate(dueDate)}</Text>
          </View>
          {billingTerms && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Terms</Text>
              <Text style={styles.metaValue}>
                {BILLING_TERMS_LABELS[billingTerms] ?? billingTerms}
              </Text>
            </View>
          )}
        </View>

        {/* Line items */}
        {lines.length > 0 && (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDesc]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>
                Unit Price
              </Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>
                Total
              </Text>
            </View>
            {lines.map((line) => (
              <View key={line.id} style={styles.row}>
                <Text style={styles.colDesc}>
                  {line.description}
                  {line.isBundleTotal ? "  (bundle)" : ""}
                </Text>
                <Text style={styles.colQty}>{line.quantity}</Text>
                <Text style={styles.colPrice}>{fmt(line.price)}</Text>
                <Text style={styles.colTotal}>
                  {fmt(line.price * line.quantity)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Percentage charge */}
        {chargeType === "PERCENTAGE" && chargePercent && (
          <View style={styles.percentBlock}>
            <Text style={styles.percentText}>
              {chargePercent}% of quoted amount
            </Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalBlock}>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>
            Thank you for your business. Please reference the invoice number
            when making payment.
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
