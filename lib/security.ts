// Defense-in-depth origin check for the API routes.
//
// Browsers always attach an Origin header to cross-site POSTs, so if one is
// present and doesn't match the host serving the app, another website is
// trying to spend our Anthropic tokens through a visitor's browser — reject.
// Requests without an Origin header (curl, scripts) are allowed through:
// they can forge any header anyway, and per-IP rate limiting is the shield
// against those.
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  // Behind Vercel's proxy the public hostname is in x-forwarded-host.
  const rawHost =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!rawHost) return false;
  const host = rawHost.split(",")[0]!.trim();

  try {
    return new URL(origin).host === host;
  } catch {
    // Unparseable or "null" origin (sandboxed frames etc.) — not our page.
    return false;
  }
}
