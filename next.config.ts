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
};

export default nextConfig;
