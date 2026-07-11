// Server-only WHO ICD-11 client. Credentials are read from env and never reach
// the browser. Uses OAuth2 client-credentials; the access token is cached in
// memory until shortly before it expires.

const TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token";
const SEARCH_URL = "https://id.who.int/icd/release/11/2024-01/mms/search";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const id = process.env.WHO_ICD_CLIENT_ID;
  const secret = process.env.WHO_ICD_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("WHO ICD credentials are not configured.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "icdapi_access",
    client_id: id,
    client_secret: secret,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`WHO auth failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    // refresh a minute early to avoid edge-of-expiry failures
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export interface IcdResult {
  code: string;
  title: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

// Search ICD-11 for a term; returns up to 8 official entries (code + title).
export async function searchIcd(query: string): Promise<IcdResult[]> {
  const token = await getToken();
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&flatResults=true`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "API-Version": "v2",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`WHO search failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as {
    destinationEntities?: Array<{ theCode?: string; title?: string }>;
  };

  const entities = Array.isArray(data.destinationEntities)
    ? data.destinationEntities
    : [];

  return entities
    .slice(0, 8)
    .map((e) => ({ code: e.theCode ?? "", title: stripTags(e.title ?? "") }))
    .filter((r) => r.title.length > 0);
}
