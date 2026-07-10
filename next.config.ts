import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy.
 *
 * Allows only ourselves plus the Clerk frontend API (auth UI, avatars) and
 * Cloudflare Turnstile (Clerk's bot protection). `unsafe-inline` for scripts
 * is required by Next.js hydration without a nonce-based setup; `unsafe-eval`
 * is enabled in development only (webpack/react-refresh).
 *
 * NOTE for production custom domains: when you switch Clerk to a production
 * instance (clerk.<your-domain>), add that origin to script-src/connect-src.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://img.clerk.com data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com https://api.stripe.com",
  "frame-src https://challenges.cloudflare.com https://*.clerk.accounts.dev https://js.stripe.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
