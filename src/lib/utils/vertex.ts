const VERTEX_ENDPOINT =
  process.env.VERTEX_ENDPOINT ??
  "https://axconnect.vertexsmb.com/vertex-ws/services/CalculateTax70";

const SELLER_COMPANY = process.env.VERTEX_COMPANY_CODE ?? "CallOne";
const SELLER_LOCATION_CODE = "C1 HQ";

// Fixed seller addresses (Call One HQ)
const SELLER_PHYSICAL = {
  street1: "400 Imperial Blvd.",
  city: "Cape Canaveral",
  state: "FL",
  postalCode: "32920",
  country: "US",
};

const SELLER_ADMIN = {
  street1: "400 IMPERIAL BLVD",
  city: "CAPE CANAVERAL",
  state: "FL",
  postalCode: "32920-4213",
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
    return { street, city: match[1].trim(), state: match[2], postalCode: match[3] };
  }
  return { street };
}

function buildLineItemXml({
  lineItemNumber,
  taxDate,
  customerCode,
  destination,
  productCode,
  productClass,
  quantity,
  unitPrice,
}: {
  lineItemNumber: number;
  taxDate: string;
  customerCode?: string;
  destination: VertexDestination;
  productCode: string;
  productClass: string;
  quantity: number;
  unitPrice: number;
}) {
  const extendedPrice = (quantity * unitPrice).toFixed(2);
  return `        <LineItem taxDate="${escapeXml(taxDate)}" lineItemNumber="${lineItemNumber}" locationCode="${escapeXml(SELLER_LOCATION_CODE)}">
          <Seller>
            <Company>${escapeXml(SELLER_COMPANY)}</Company>
            <Division />
            <Department />
            <PhysicalOrigin>
              <StreetAddress1>${escapeXml(SELLER_PHYSICAL.street1)}</StreetAddress1>
              <StreetAddress2 />
              <City>${escapeXml(SELLER_PHYSICAL.city)}</City>
              <MainDivision>${escapeXml(SELLER_PHYSICAL.state)}</MainDivision>
              <SubDivision />
              <PostalCode>${escapeXml(SELLER_PHYSICAL.postalCode)}</PostalCode>
              <Country>${escapeXml(SELLER_PHYSICAL.country)}</Country>
            </PhysicalOrigin>
            <AdministrativeOrigin>
              <StreetAddress1>${escapeXml(SELLER_ADMIN.street1)}</StreetAddress1>
              <StreetAddress2 />
              <City>${escapeXml(SELLER_ADMIN.city)}</City>
              <MainDivision>${escapeXml(SELLER_ADMIN.state)}</MainDivision>
              <SubDivision />
              <PostalCode>${escapeXml(SELLER_ADMIN.postalCode)}</PostalCode>
              <Country>${escapeXml(SELLER_ADMIN.country)}</Country>
            </AdministrativeOrigin>
          </Seller>
          <Customer>
            ${customerCode ? `<CustomerCode>${escapeXml(customerCode)}</CustomerCode>` : ""}
            <Destination>
              <StreetAddress1>${escapeXml(destination.street ?? "")}</StreetAddress1>
              <StreetAddress2 />
              <City>${escapeXml(destination.city ?? "")}</City>
              <MainDivision>${escapeXml(destination.state ?? "")}</MainDivision>
              <SubDivision />
              <PostalCode>${escapeXml(destination.postalCode ?? "")}</PostalCode>
              <Country>${escapeXml(destination.country ?? "US")}</Country>
            </Destination>
          </Customer>
          <Product productClass="${escapeXml(productClass)}">${escapeXml(productCode)}</Product>
          <Quantity>${quantity}</Quantity>
          <UnitPrice>${unitPrice.toFixed(2)}</UnitPrice>
          <ExtendedPrice>${extendedPrice}</ExtendedPrice>
          <FlexibleFields />
        </LineItem>`;
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
  const docNumAttr = documentNumber ? ` documentNumber="${escapeXml(documentNumber)}"` : "";
  return `<?xml version="1.0" encoding="utf-8"?>
<Envelope>
  <Header />
  <Body>
    <VertexEnvelope>
      <Login>
        <TrustedId>${escapeXml(trustedId)}</TrustedId>
      </Login>
      <QuotationRequest${docNumAttr} documentType="Invoice" documentDate="${escapeXml(documentDate)}" transactionType="SALE" returnAssistedParametersIndicator="true">
        <Currency isoCurrencyCodeAlpha="USD" />
${lineItemsXml}
      </QuotationRequest>
    </VertexEnvelope>
  </Body>
</Envelope>`;
}

function extractTaxFromResponse(xml: string): {
  totalTax: number;
  lineTaxes: { lineItemNumber: number; taxAmount: number }[];
} {
  const lineTaxes: { lineItemNumber: number; taxAmount: number }[] = [];
  const linePattern = /<LineItem[^>]*lineItemNumber="(\d+)"[^>]*>([\s\S]*?)<\/LineItem>/g;
  let match;
  while ((match = linePattern.exec(xml)) !== null) {
    const lineNum = parseInt(match[1], 10);
    const lineXml = match[2];
    const totalMatch = lineXml.match(/<TotalTax[^>]*>([\d.]+)<\/TotalTax>/);
    const taxMatches = [...lineXml.matchAll(/<Tax[^>]*>([\d.]+)<\/Tax>/g)];
    const lineTotal = totalMatch
      ? parseFloat(totalMatch[1])
      : taxMatches.reduce((s, m) => s + parseFloat(m[1]), 0);
    lineTaxes.push({ lineItemNumber: lineNum, taxAmount: lineTotal });
  }

  const totalMatch = xml.match(/<TotalTax[^>]*>([\d.]+)<\/TotalTax>/);
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
      console.error("calculateVertexTax: HTTP error", res.status, await res.text());
      return null;
    }

    const responseXml = await res.text();
    const { totalTax, lineTaxes } = extractTaxFromResponse(responseXml);
    const totalAmount = input.lines.reduce(
      (s, l) => s + l.quantity * l.unitPrice,
      0,
    );

    return { totalTax, totalWithTax: totalAmount + totalTax, lineTaxes };
  } catch (err) {
    console.error("calculateVertexTax: request failed", err);
    return null;
  }
}
