import { prisma } from "../prisma";

const VERTEX_ENDPOINT =
  process.env.VERTEX_ENDPOINT ??
  "https://axconnect.vertexsmb.com/vertex-ws/services/CalculateTax70";

const SELLER_COMPANY = process.env.VERTEX_COMPANY_CODE ?? "CallOne";

// Fixed seller address (Call One HQ)
const SELLER_PHYSICAL = {
  street1: "400 Imperial Blvd.",
  city: "Cape Canaveral",
  state: "FL",
  postalCode: "32920",
  country: "US",
};

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Parse a free-form address string like "123 Main St\nAustin, TX 78714-9114"
function parseAddressString(raw: string): VertexDestination {
  const lines = raw
    .trim()
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const street = lines[0];
  const lastLine = lines[lines.length - 1] ?? "";
  const match = lastLine.match(/^(.+?),?\s+([A-Z]{2})\s+(\S+)$/);
  if (match) {
    return {
      street,
      city: match[1].trim(),
      state: match[2],
      postalCode: match[3],
    };
  }
  return { street };
}

function buildLineItemXml({
  lineItemNumber,
  taxDate,
  locationCode,
  customerCode,
  destination,
  productCode,
  productClass,
  quantity,
  unitPrice,
}: {
  lineItemNumber: number;
  taxDate: string;
  locationCode?: string;
  customerCode?: string;
  destination: VertexDestination;
  productCode: string;
  productClass: string;
  quantity: number;
  unitPrice: number;
}) {
  const extendedPrice = (quantity * unitPrice).toFixed(2);
  const locationAttr = locationCode
    ? ` locationCode="${escapeXml(locationCode)}"`
    : "";
  return `        <urn:LineItem taxDate="${escapeXml(taxDate)}" lineItemNumber="${lineItemNumber}"${locationAttr}>
          <urn:Seller>
            <urn:Company>${escapeXml(SELLER_COMPANY)}</urn:Company>
            <urn:Division />
            <urn:Department />
            <urn:PhysicalOrigin>
              <urn:StreetAddress1>${escapeXml(SELLER_PHYSICAL.street1)}</urn:StreetAddress1>
              <urn:StreetAddress2 />
              <urn:City>${escapeXml(SELLER_PHYSICAL.city)}</urn:City>
              <urn:MainDivision>${escapeXml(SELLER_PHYSICAL.state)}</urn:MainDivision>
              <urn:SubDivision />
              <urn:PostalCode>${escapeXml(SELLER_PHYSICAL.postalCode)}</urn:PostalCode>
              <urn:Country>${escapeXml(SELLER_PHYSICAL.country)}</urn:Country>
            </urn:PhysicalOrigin>
          </urn:Seller>
          <urn:Customer>
            ${customerCode ? `<urn:CustomerCode>${escapeXml(customerCode)}</urn:CustomerCode>` : ""}
            <urn:Destination>
              <urn:StreetAddress1>${escapeXml(destination.street ?? "")}</urn:StreetAddress1>
              <urn:StreetAddress2 />
              <urn:City>${escapeXml(destination.city ?? "")}</urn:City>
              <urn:MainDivision>${escapeXml(destination.state ?? "")}</urn:MainDivision>
              <urn:SubDivision />
              <urn:PostalCode>${escapeXml(destination.postalCode ?? "")}</urn:PostalCode>
              <urn:Country>${escapeXml(destination.country ?? "US")}</urn:Country>
            </urn:Destination>
          </urn:Customer>
          <urn:Product productClass="${escapeXml(productClass)}">${escapeXml(productCode)}</urn:Product>
          <urn:Quantity>${quantity}</urn:Quantity>
          <urn:UnitPrice>${unitPrice.toFixed(2)}</urn:UnitPrice>
          <urn:ExtendedPrice>${extendedPrice}</urn:ExtendedPrice>
          <urn:FlexibleFields />
        </urn:LineItem>`;
}

function buildEnvelope({
  trustedId,
  documentNumber,
  documentDate,
  lineItemsXml,
}: {
  trustedId: string;
  documentNumber?: string;
  documentDate: string;
  lineItemsXml: string;
}) {
  const docNumAttr = documentNumber
    ? ` documentNumber="${escapeXml(documentNumber)}"`
    : "";
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:vertexinc:o-series:tps:7:0">
  <soapenv:Header />
  <soapenv:Body>
    <urn:VertexEnvelope>
      <urn:Login>
        <urn:TrustedId>${escapeXml(trustedId)}</urn:TrustedId>
      </urn:Login>
      <urn:QuotationRequest${docNumAttr} documentType="Invoice" documentDate="${escapeXml(documentDate)}" transactionType="SALE" returnAssistedParametersIndicator="true">
        <urn:Currency isoCurrencyCodeAlpha="USD" />
${lineItemsXml}
      </urn:QuotationRequest>
    </urn:VertexEnvelope>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function extractTaxFromResponse(xml: string): {
  totalTax: number;
  lineTaxes: { lineItemNumber: number; taxAmount: number }[];
} {
  const lineTaxes: { lineItemNumber: number; taxAmount: number }[] = [];
  const linePattern =
    /<(?:[\w]+:)?LineItem[^>]*lineItemNumber="(\d+)"[^>]*>([\s\S]*?)<\/(?:[\w]+:)?LineItem>/g;
  let match;
  while ((match = linePattern.exec(xml)) !== null) {
    const lineNum = parseInt(match[1], 10);
    const lineXml = match[2];
    const totalMatch = lineXml.match(
      /<(?:[\w]+:)?TotalTax[^>]*>([\d.]+)<\/(?:[\w]+:)?TotalTax>/,
    );
    const taxMatches = [
      ...lineXml.matchAll(/<(?:[\w]+:)?Tax[^>]*>([\d.]+)<\/(?:[\w]+:)?Tax>/g),
    ];
    const lineTotal = totalMatch
      ? parseFloat(totalMatch[1])
      : taxMatches.reduce((s, m) => s + parseFloat(m[1]), 0);
    lineTaxes.push({ lineItemNumber: lineNum, taxAmount: lineTotal });
  }

  const totalMatch = xml.match(
    /<(?:[\w]+:)?TotalTax[^>]*>([\d.]+)<\/(?:[\w]+:)?TotalTax>/,
  );
  const totalTax = totalMatch
    ? parseFloat(totalMatch[1])
    : lineTaxes.reduce((s, l) => s + l.taxAmount, 0);

  return { totalTax, lineTaxes };
}

// ─── Public types ────────────────────────────────────────────────────────────

export type VertexDestination = {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type VertexLineInput = {
  /** Auto-assigned as 10000, 20000, … if omitted */
  lineItemNumber?: number;
  productCode: string;
  /** Defaults to "TAXABLE" */
  productClass?: string;
  quantity: number;
  unitPrice: number;
};

export type VertexTaxInput = {
  documentNumber?: string;
  /** ISO date YYYY-MM-DD — defaults to today */
  documentDate?: string;
  customerCode?: string;
  /** Free-form multiline string or structured object */
  destination: VertexDestination | string;
  lines: VertexLineInput[];
};

export type VertexTaxResult = {
  totalTax: number;
  totalWithTax: number;
  lineTaxes: { lineItemNumber: number; taxAmount: number }[];
};

// ─── Main export ─────────────────────────────────────────────────────────────

export async function calculateVertexTax(
  input: VertexTaxInput,
): Promise<VertexTaxResult | null> {
  const trustedId = process.env.VERTEX_TRUSTED_ID;
  if (!trustedId) {
    console.error("calculateVertexTax: VERTEX_TRUSTED_ID env var not set");
    return null;
  }

  const documentDate =
    input.documentDate ?? new Date().toISOString().slice(0, 10);

  const destination: VertexDestination =
    typeof input.destination === "string"
      ? parseAddressString(input.destination)
      : input.destination;

  const lineItemsXml = input.lines
    .map((line, i) =>
      buildLineItemXml({
        lineItemNumber: line.lineItemNumber ?? (i + 1) * 10000,
        taxDate: documentDate,
        customerCode: input.customerCode,
        destination,
        productCode: line.productCode,
        productClass: line.productClass ?? "TAXABLE",
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      }),
    )
    .join("\n");

  const envelope = buildEnvelope({
    trustedId,
    documentNumber: input.documentNumber,
    documentDate,
    lineItemsXml,
  });

  // 👇 Log the request before sending
  const log = await prisma.vertexLog.create({
    data: {
      documentNumber: input.documentNumber ?? null,
      requestXml: envelope,
      success: false, // will update after response
    },
  });

  // console.log("calculateVertexTax: sending envelope\n", envelope);

  try {
    const res = await fetch(VERTEX_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '""',
      },
      body: envelope,
    });

    if (!res.ok) {
      console.error(
        "calculateVertexTax: HTTP error",
        res.status,
        await res.text(),
      );

      // 👇 Log failure
      await prisma.vertexLog.update({
        where: { id: log.id },
        data: {
          success: false,
          errorMessage: `HTTP ${res.status}`,
        },
      });
      return null;
    }

    const responseXml = await res.text();
    // console.log("calculateVertexTax: response\n", responseXml);

    const { totalTax, lineTaxes } = extractTaxFromResponse(responseXml);
    const totalAmount = input.lines.reduce(
      (s, l) => s + l.quantity * l.unitPrice,
      0,
    );

    // 👇 Log success
    await prisma.vertexLog.update({
      where: { id: log.id },
      data: {
        responseXml,
        success: true,
        totalTax,
      },
    });

    return { totalTax, totalWithTax: totalAmount + totalTax, lineTaxes };
  } catch (err) {
    console.error("calculateVertexTax: request failed", err);

    // 👇 Log exception
    await prisma.vertexLog.update({
      where: { id: log.id },
      data: {
        success: false,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });

    return null;
  }
}
