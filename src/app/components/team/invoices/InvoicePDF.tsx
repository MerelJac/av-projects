import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { buildAddress } from "@/lib/utils/helpers";

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
  billToBlock: { flex: 1 },
  billToLabel: {
    fontSize: 8,
    color: "#888",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  billToName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
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
  colQty: { width: 36, textAlign: "right" },
  colPrice: { width: 60, textAlign: "right" },
  colTax: { width: 56, textAlign: "right" },
  colTotal: { width: 68, textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalsBlock: { marginTop: 20, alignItems: "flex-end" },
  totalsTable: { width: 200 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: 9, color: "#666" },
  totalsValue: { fontSize: 9, color: "#111" },
  totalsDivider: {
    borderTopWidth: 0.5,
    borderTopColor: "#E5E3DE",
    marginVertical: 4,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
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
  taxAmount: number | null;
  isBundleTotal: boolean;
};

const BILLING_TERMS_LABELS: Record<string, string> = {
  NET15: "Net 15",
  NET30: "Net 30",
  DUE_UPON_RECEIPT: "Due Upon Receipt",
  NET45: "Net 45",
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
  billToContact,
  billToAddress,
  billToAddress2,
  billToCity,
  billToState,
  billToZipcode,
  billToCountry,
  shipToContact,
  shipToAddress,
  shipToAddress2,
  shipToCity,
  shipToState,
  shipToZipcode,
  shipToCountry,
  billingTerms,
  chargeType,
  chargePercent,
  lines,
  amount,
  taxAmount,
  issuedAt,
  dueDate,
  notes,
}: {
  invoiceNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  billToContact: string | null;
  billToAddress: string | null;
  billToAddress2?: string | null;
  billToCity?: string | null;
  billToState?: string | null;
  billToZipcode?: string | null;
  billToCountry?: string | null;
  shipToContact: string | null;

  shipToAddress: string | null;
  shipToAddress2?: string | null;
  shipToCity?: string | null;
  shipToState?: string | null;
  shipToZipcode?: string | null;
  shipToCountry?: string | null;
  billingTerms:
    | "NET45"
    | "NET15"
    | "NET30"
    | "DUE_UPON_RECEIPT"
    | "PROGRESS"
    | "PREPAID"
    | null;
  chargeType: "LINE_ITEMS" | "PERCENTAGE";
  chargePercent: number | null;
  lines: InvoiceLine[];
  amount: number | null;
  taxAmount: number | null;
  issuedAt: Date | null;
  dueDate: Date | null;
  notes: string | null;
}) {
  const billToFormatted = buildAddress({
    address1: billToAddress,
    address2: billToAddress2,
    city: billToCity,
    state: billToState,
    zipCode: billToZipcode,
    country: billToCountry,
  });
  const shipToFormatted = buildAddress({
    address1: shipToAddress,
    address2: shipToAddress2,
    city: shipToCity,
    state: shipToState,
    zipCode: shipToZipcode,
    country: shipToCountry,
  });

  const total = amount ?? 0;
  const subtotal = taxAmount != null ? total - taxAmount : total;
  const hasTax = taxAmount != null && taxAmount > 0;
  const hasLineTax = lines.some((l) => l.taxAmount != null);

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

        {/* Seller block */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.billToDetail, { fontFamily: "Helvetica-Bold" }]}>
            Call One, Inc.
          </Text>
          <Text style={styles.billToDetail}>PO Box 9002</Text>
          <Text style={styles.billToDetail}>Cape Canaveral, FL 32920</Text>
          <Text style={styles.billToDetail}>US</Text>
        </View>

        {/* Address block — Bill To + Ship To side by side */}
        <View style={styles.addressBlock}>
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
            {billToContact && (
              <Text style={styles.billToDetail}>{billToContact}</Text>
            )}
            {billToFormatted && (
              <Text style={styles.billToDetail}>{billToFormatted}</Text>
            )}
          </View>

          {shipToFormatted && (
            <View style={styles.billToBlock}>
              <Text style={styles.billToLabel}>Ship To</Text>
               {shipToContact && (
              <Text style={styles.billToDetail}>{shipToContact}</Text>
            )}
              <Text style={styles.billToDetail}>{shipToFormatted}</Text>
            </View>
          )}
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
              {hasLineTax && (
                <Text style={[styles.tableHeaderText, styles.colTax]}>Tax</Text>
              )}
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
                {hasLineTax && (
                  <Text style={styles.colTax}>
                    {line.taxAmount != null ? fmt(line.taxAmount) : "—"}
                  </Text>
                )}
                <Text style={styles.colTotal}>
                  {fmt(line.price * line.quantity + line.taxAmount!)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Percentage charge */}
        {chargeType === "PERCENTAGE" && chargePercent != null && (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDesc]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>
                Total
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.colDesc}>
                Progress billing — {chargePercent}% of proposal total
              </Text>
              <Text style={styles.colQty}>{chargePercent}%</Text>
              <Text style={styles.colTotal}>{fmt(total)}</Text>
            </View>
          </>
        )}
        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsTable}>
            {hasTax && (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Tax</Text>
                  <Text style={styles.totalsValue}>{fmt(taxAmount!)}</Text>
                </View>
              </>
            )}
            <View style={styles.totalsDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
            </View>
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
