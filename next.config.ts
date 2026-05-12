import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pakete, die Node-only oder native-deps haben und nicht in den Edge/Turbopack-Bundle
  // sollen (sonst "Failed to load external module" beim Aufruf einer Server-Action).
  serverExternalPackages: [
    "cheerio",
    "isomorphic-dompurify",
    "jsdom",
    "@vercel/blob",
    "postgres",
    "drizzle-orm",
    "nodemailer",
    "@react-email/render",
    "@react-email/components",
  ],
  images: {
    remotePatterns: [
      // Vercel Blob – fuer Cover-Bilder und im Editor hochgeladene Bilder
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
  },
  // Permanent-Redirects fuer umbenannte Routen (SEO + alte Bookmarks)
  async redirects() {
    return [
      { source: "/esg", destination: "/schulprojekt", permanent: true },
      { source: "/esg/:path*", destination: "/schulprojekt/:path*", permanent: true },
    ];
  },
  // Security-Response-Headers: gegen XSS, Clickjacking, Sniffing, Referer-Leaks etc.
  // CSP ist die wichtigste Defense-Layer — Vorsicht bei Inline-Scripts/Styles
  // (TipTap-Editor, React-Email, Inline-onload in next/image).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://q.stripe.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com https://q.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
