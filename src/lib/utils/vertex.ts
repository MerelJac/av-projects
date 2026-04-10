const VERTEX_ENDPOINT =
  process.env.VERTEX_ENDPOINT ??
  "https://axconnect.vertexsmb.com/vertex-ws/services/CalculateTax70";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSoapEnvelope({
  trustedId,
  companyCode,
  amount,
  street,
  city,
  state,
  postalCode,
  country = "USA",
  documentNumber,
}: {
  trustedId: string;
  companyCode: string;
  amount: number;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  documentNumber?: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:urn="urn:vertexinc:o-series:tps:7:0">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:VertexEnvelope>
      <urn:Login>
        <urn:TrustedId>${escapeXml(trustedId)}</urn:TrustedId>
      </urn:Login>
      <urn:SaleRequest${documentNumber ? ` documentNumber="${escapeXml(documentNumber)}"` : ""} transactionType="SALE">
        <urn:Seller>
          <urn:Company>${escapeXml(companyCode)}</urn:Company>
        </urn:Seller>
        <urn:Customer>
          <urn:Destination>
            ${street ? `<urn:StreetAddress1>${escapeXml(street)}</urn:StreetAddress1>` : ""}
            ${city ? `<urn:City>${escapeXml(city)}</urn:City>` : ""}
            ${state ? `<urn:MainDivision>${escapeXml(state)}</urn:MainDivision>` : ""}
            ${postalCode ? `<urn:PostalCode>${escapeXml(postalCode)}</urn:PostalCode>` : ""}
            <urn:Country>${escapeXml(country)}</urn:Country>
          </urn:Destination>
        </urn:Customer>
        <urn:LineItem lineItemNumber="1">
          <urn:ExtendedPrice>${amount.toFixed(2)}</urn:ExtendedPrice>
        </urn:LineItem>
      </urn:SaleRequest>
    </urn:VertexEnvelope>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Parse a free-form address string like:
//   "123 Main St\nLos Angeles, CA 90210"
function parseAddressString(raw: string): {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
} {
  const lines = raw.trim().split(/\n/).map((l) => l.trim()).filter(Boolean);
  const street = lines[0];
  const lastLine = lines[lines.length - 1] ?? "";
  const match = lastLine.match(/^(.+?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return { street, city: match[1].trim(), state: match[2], postalCode: match[3] };
  }
  return { street };
}

function extractTotalTax(xml: string): number {
  // Try TotalTax element first
  const totalMatch = xml.match(/<(?:[\w]+:)?TotalTax[^>]*>([\d.]+)<\/(?:[\w]+:)?TotalTax>/);
  if (totalMatch) return parseFloat(totalMatch[1]);
  // Fallback: sum individual Tax elements
  const taxMatches = [...xml.matchAll(/<(?:[\w]+:)?Tax[^>]*>([\d.]+)<\/(?:[\w]+:)?Tax>/g)];
  return taxMatches.reduce((sum, m) => sum + parseFloat(m[1]), 0);
}

export async function calculateVertexTax({
  address,
  amount,
  documentNumber,
}: {
  address:
    | string
    | { street?: string; city?: string; state?: string; postalCode?: string; country?: string };
  amount: number;
  documentNumber?: string;
}): Promise<{ taxAmount: number; totalWithTax: number } | null> {
  const trustedId = process.env.VERTEX_TRUSTED_ID;
  const companyCode = process.env.VERTEX_COMPANY_CODE ?? "CallOne";

  if (!trustedId) {
    console.error("calculateVertexTax: VERTEX_TRUSTED_ID env var not set");
    return null;
  }

  const parsed =
    typeof address === "string" ? parseAddressString(address) : address;

  const soapBody = buildSoapEnvelope({
    trustedId,
    companyCode,
    amount,
    documentNumber,
    ...parsed,
  });

  try {
    const res = await fetch(VERTEX_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '""',
      },
      body: soapBody,
    });

    if (!res.ok) {
      console.error("calculateVertexTax: HTTP error", res.status, await res.text());
      return null;
    }

    const responseXml = await res.text();
    const taxAmount = extractTotalTax(responseXml);
    return { taxAmount, totalWithTax: amount + taxAmount };
  } catch (err) {
    console.error("calculateVertexTax: request failed", err);
    return null;
  }
}
