const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy. Next.js inlines bootstrap scripts and React uses
// inline styles, so 'unsafe-inline' is required without a nonce setup; dev mode
// additionally needs 'unsafe-eval' for hot reload. Everything else is locked
// to same-origin — the app makes no external requests from the browser
// (fonts are self-hosted by next/font, the WHO/Anthropic calls are server-side).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Health conversations must never leak via the Referer header.
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this folder so Next never infers a parent
  // directory (e.g. one containing a stray lockfile) as the root.
  turbopack: { root: import.meta.dirname },
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
