/**
 * Business Central API client.
 *
 * Required env vars:
 *   BC_TENANT_ID       – Azure AD tenant ID
 *   BC_CLIENT_ID       – App registration client ID
 *   BC_CLIENT_SECRET   – App registration client secret
 *   BC_ENVIRONMENT     – BC environment name (e.g. "Production")
 *   BC_COMPANY_ID      – BC company GUID
 */

const TOKEN_URL = `https://login.microsoftonline.com/${process.env.BC_TENANT_ID}/oauth2/v2.0/token`;
const BC_SCOPE = "https://api.businesscentral.dynamics.com/.default";
const BC_BASE = `https://api.businesscentral.dynamics.com/v2.0/${process.env.BC_TENANT_ID}/${process.env.BC_ENVIRONMENT}/api/v2.0`;

// In-process token cache
let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry - 60_000) return _token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.BC_CLIENT_ID!,
      client_secret: process.env.BC_CLIENT_SECRET!,
      scope: BC_SCOPE,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BC token fetch failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  _token = json.access_token;
  _tokenExpiry = Date.now() + json.expires_in * 1000;
  console.log("Fetched new BC token, expires in", json.expires_in, "seconds");
  return _token;
}

/** Fetch all pages of an OData collection into a flat array. */
export async function bcFetchAll<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const token = await getToken();
  const company = process.env.BC_COMPANY_ID;

  const searchParams = new URLSearchParams(params);
  let url: string | null = `${BC_BASE}/companies(${company})/${path}?${searchParams}`;
  const results: T[] = [];

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BC API error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as { value: T[]; "@odata.nextLink"?: string };
    results.push(...json.value);
    url = json["@odata.nextLink"] ?? null;
  }
  console.log(`Fetched ${results.length} items from BC /${path}`);
  console.debug("Sample item:", results[0]);
  return results;
}

// ── Typed BC entity shapes ───────────────────────────────────────────────────

export interface BcVendor {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  lastModifiedDateTime: string;
  balance: number | null;
}

export interface BcCustomer {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  balanceDue: number | null;
  lastModifiedDateTime: string;
}

export interface BcItem {
  id: string;
  number: string;
  displayName: string;
  description: string;
  unitCost: number;
  unitPrice: number;
  type: string;
  lastModifiedDateTime: string;
}
