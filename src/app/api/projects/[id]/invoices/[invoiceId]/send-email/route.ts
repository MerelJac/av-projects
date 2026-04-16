import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildInvoicePDF } from "@/app/components/team/invoices/InvoicePDF";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { getToken } from "next-auth/jwt";

const FINANCE_EMAIL = "finance@calloneonline.com";
const BCC_EMAIL = "mjacobs@calloneonline.com";

const ses = new SESClient({
  region: process.env.SES_REGION!,
  credentials: {
    accessKeyId: process.env.SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
  },
});

function buildMimeEmail({
  from,
  to,
  bcc,
  subject,
  htmlBody,
  pdfBuffer,
  pdfFilename,
}: {
  from: string;
  to: string;
  bcc: string;
  subject: string;
  htmlBody: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}): string {
  const boundary = `----=_Boundary_${Date.now()}`;
  const pdfBase64 = pdfBuffer.toString("base64");

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Bcc: ${bcc}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    htmlBody,
    "",
    `--${boundary}`,
    "Content-Type: application/pdf",
    `Content-Disposition: attachment; filename="${pdfFilename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    // Split base64 into 76-char lines per MIME spec
    pdfBase64.match(/.{1,76}/g)?.join("\n") ?? pdfBase64,
    "",
    `--${boundary}--`,
  ].join("\r\n");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { id: projectId, invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: { orderBy: { id: "asc" } },
      project: { include: { customer: true } },
    },
  });

  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoiceNumber = invoice.invoiceNumber ?? invoice.id.toUpperCase();
  const customerLabel = invoice.customerName ?? invoice.project.customer.name;

  const buffer = await renderToBuffer(
    buildInvoicePDF({
      invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      billToAddress: invoice.billToAddress,
      shipToAddress: invoice.shipToAddress,
      billingTerms: invoice.billingTerms as
        | "NET45"
        | "NET15"
        | "NET30"
        | "PROGRESS"
        | "PREPAID"
        | null,
      chargeType: invoice.chargeType as "LINE_ITEMS" | "PERCENTAGE",
      chargePercent: invoice.chargePercent,
      lines: invoice.lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        price: l.price,
        taxAmount: l.taxAmount,
        isBundleTotal: l.isBundleTotal,
      })),
      amount: invoice.amount,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      taxAmount: invoice.taxAmount,
    }),
  );

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const htmlBody = `
<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">Invoice #${invoiceNumber}</p>
  <p style="color: #888; margin-top: 0;">Call One, Inc &mdash; Audio Visual Solutions</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 8px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Bill To</td>
      <td style="padding: 8px 0; font-weight: bold;">${customerLabel}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</td>
      <td style="padding: 8px 0; font-weight: bold; font-size: 18px;">$${fmt(invoice.amount ?? 0)}</td>
    </tr>
    ${
      invoice.dueDate
        ? `
    <tr>
      <td style="padding: 8px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</td>
      <td style="padding: 8px 0;">${new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td>
    </tr>`
        : ""
    }
  </table>

  <p style="color: #555;">Please find the invoice attached as a PDF. Reference invoice number <strong>#${invoiceNumber}</strong> when processing payment.</p>

  <hr style="border: none; border-top: 1px solid #E5E3DE; margin: 24px 0;" />
  <p style="font-size: 12px; color: #999;">Call One, Inc &bull; Audio Visual Solutions</p>
</body>
</html>`;

  const pdfFilename = `invoice-${invoiceNumber}.pdf`;
  const subject = `Invoice #${invoiceNumber} — ${customerLabel}`;
  const from = process.env.SES_FROM_ADDRESS!;

  const rawMessage = buildMimeEmail({
    from,
    to: FINANCE_EMAIL,
    bcc: BCC_EMAIL,
    subject,
    htmlBody,
    pdfBuffer: Buffer.from(buffer),
    pdfFilename,
  });

  await ses.send(
    new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage) },
    }),
  );

  // Mark invoice as PENDING if it's still DRAFT
  if (invoice.status === "DRAFT") {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PENDING", issuedAt: invoice.issuedAt ?? new Date() },
    });
  }

  // create note of email send

  const token = await getToken({
    req: _req,
    secret: process.env.NEXTAUTH_SECRET!,
  });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const note = await prisma.note.create({
    data: {
      documentType: "INVOICE",
      documentId: invoiceId,
      content: " Invoice sent to finance",
      userId: token.id as string,
    },
    include: { user: { include: { profile: true } } },
  });

  console.log(
    `📓 Note created for invoice ${invoiceNumber} email send: ${note.id}`,
  );

  console.log(`✅ Invoice ${invoiceNumber} sent to ${FINANCE_EMAIL}`);
  return NextResponse.json({ ok: true });
}
