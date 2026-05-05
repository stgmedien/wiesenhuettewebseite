import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";
  const now = new Date();
  const paths = ["", "/huette", "/verein", "/esg", "/lage", "/kontakt", "/buchen", "/agb", "/datenschutz", "/impressum"];
  return paths.map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/buchen" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/buchen" ? 0.9 : 0.7,
  }));
}
