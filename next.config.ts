import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * Nautilus runs entirely in the browser and talks straight to the AI provider
 * the user configured, so `connect-src` has to allow those four hosts and
 * nothing else. Locking the policy down matters more than usual here: API keys
 * live in localStorage, so a single injected script would be enough to steal
 * them.
 *
 * `unsafe-inline`/`unsafe-eval` in script-src are required by the Next.js dev
 * runtime; they are dropped in production builds below.
 */
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://github.com",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://api.openai.com",
    "https://generativelanguage.googleapis.com",
    "https://api.anthropic.com",
    "https://api.groq.com",
    isDev ? "ws: http://localhost:*" : "",
  ]
    .filter(Boolean)
    .join(" "),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
