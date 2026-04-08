import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ReportTable, { Column } from "../bc/ReportTable";

const COLUMNS: Column[] = [
  { key: "salesRep", label: "Sales Rep" },
  { key: "documentType", label: "Document Type" },
  { key: "documentNo", label: "Document No" },
  { key: "postingDate", label: "Posting Date" },
  { key: "customerNo", label: "Customer No" },
  { key: "customerName", label: "Customer Name" },
  { key: "divisionCode", label: "Division Code" },
  { key: "mfgCode", label: "Manufacturer Code" },
  { key: "itemNo", label: "Item No" },
  { key: "itemDesc", label: "Item Desc" },
  { key: "quantity", label: "Quantity" },
  { key: "salesAmount", label: "Sales Amount", type: "currency" },
  { key: "cost", label: "Cost", type: "currency" },
  { key: "mpvCost", label: "MPV Cost", type: "currency" },
  { key: "profitAmount", label: "Profit Amount", type: "currency" },
  { key: "profitPercent", label: "Profit %" },
  { key: "billToAddress", label: "Bill To Address" },
  { key: "billToCity", label: "Bill To City" },
  { key: "billToState", label: "Bill To State" },
  { key: "billToZip", label: "Bill To Zip" },
  { key: "shipToAddress", label: "Ship To Address" },
  { key: "shipToCity", label: "Ship To City" },
  { key: "shipToState", label: "Ship To State" },
  { key: "shipToZip", label: "Ship To Zip" },
  { key: "systemCreatedAtLine", label: "System Created At Line" },
  { key: "systemCreatedAtHeader", label: "System Created At Header" },
];

export default async function InvoiceLinesReportPage() {
  const invoices = await prisma.invoice.findMany({
    where: { status: { notIn: ["DRAFT", "VOID"] } },
    include: {
      project: {
        include: {
          salesperson: true,
          customer: true,
        },
      },
      lines: {
        include: { item: true },
      },
    },
    orderBy: { issuedAt: "desc" },
  });

  const rows: Record<string, unknown>[] = [];

  for (const invoice of invoices) {
    const customer = invoice.project.customer;
    const salesperson = invoice.project.salesperson;
    const postingDate = invoice.issuedAt
      ? new Date(invoice.issuedAt).toLocaleDateString("en-US")
      : null;
    const headerCreatedAt = new Date(invoice.createdAt).toISOString();

    for (const line of invoice.lines) {
      const salesAmount = line.price * line.quantity;
      const unitCost = line.item?.cost ?? null;
      const cost = unitCost != null ? unitCost * line.quantity : null;
      const profitAmount = cost != null ? salesAmount - cost : null;
      const profitPercent =
        profitAmount != null && salesAmount !== 0
          ? `${((profitAmount / salesAmount) * 100).toFixed(1)}%`
          : null;

      rows.push({
        salesRep: salesperson?.name ?? null,
        documentType: "Invoice",
        documentNo: invoice.invoiceNumber ?? invoice.id.slice(0, 8).toUpperCase(),
        postingDate,
        customerNo: customer.bcId ?? customer.id.slice(0, 8).toUpperCase(),
        customerName: invoice.customerName ?? customer.name,
        divisionCode: null,
        mfgCode: line.item?.manufacturer ?? null,
        itemNo: line.item?.itemNumber ?? null,
        itemDesc: line.description,
        quantity: line.quantity,
        salesAmount,
        cost,
        mpvCost: null,
        profitAmount,
        profitPercent,
        billToAddress: invoice.billToAddress ?? null,
        billToCity: null,
        billToState: null,
        billToZip: null,
        shipToAddress: invoice.shipToAddress ?? null,
        shipToCity: null,
        shipToState: null,
        shipToZip: null,
        systemCreatedAtLine: null,
        systemCreatedAtHeader: headerCreatedAt,
      });
    }
  }

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              POS - Invoice Lines
            </h1>
            <p className="text-xs text-[#999] mt-0.5">
              One row per invoice line — all non-draft invoices
            </p>
          </div>
        </div>

        <ReportTable
          title="POS - Invoice Lines"
          columns={COLUMNS}
          rows={rows}
          filename="invoice-lines.csv"
        />
      </div>
    </div>
  );
}
