import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/m/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
