/**
 * Lightweight HTML metadata extraction without external deps.
 * Replaces cheerio for the import-html use case (Turbopack chokes on
 * cheerio's dep graph at runtime, so we avoid it altogether).
 *
 * Not a full parser — just regex extraction of common <head> bits and
 * the <body> contents. Good enough for ingesting authoring tool exports
 * and Markdown→HTML output from common pipelines.
 */

const decode = (s: string): string =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");

const matchAttr = (raw: string, attr: string): string | null => {
  // Looks for attr="..." or attr='...'
  const re = new RegExp(`${attr}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const m = raw.match(re);
  if (!m) return null;
  return decode(m[2] ?? m[3] ?? "").trim();
};

const findMeta = (html: string, name: string): string | null => {
  // <meta name="..." content="..."> or <meta property="..." content="...">
  const re = new RegExp(
    `<meta\\b[^>]*?(?:name|property)\\s*=\\s*["']${name}["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  if (!m) return null;
  return matchAttr(m[0], "content");
};

export type ParsedHtml = {
  title: string | null;
  description: string | null;
  ogImage: string | null;
  whSlug: string | null;
  whCover: string | null;
  bodyHtml: string;
};

export const parseHtmlForImport = (raw: string): ParsedHtml => {
  // Title
  const titleMatch = raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const fromTitle = titleMatch ? decode(titleMatch[1].trim()) : null;
  const h1Match = raw.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const fromH1 = h1Match ? decode(h1Match[1].replace(/<[^>]+>/g, "").trim()) : null;
  const whTitle = findMeta(raw, "wh:title");
  const title = whTitle || fromTitle || fromH1;

  const description =
    findMeta(raw, "description") ||
    findMeta(raw, "og:description") ||
    findMeta(raw, "wh:excerpt");

  const ogImage = findMeta(raw, "og:image") || findMeta(raw, "wh:cover");
  const whSlug = findMeta(raw, "wh:slug");
  const whCover = findMeta(raw, "wh:cover");

  // Body: extract content between <body> tags if present, else use the entire input
  const bodyMatch = raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : raw;

  return {
    title: title?.trim() || null,
    description: description?.trim() || null,
    ogImage: ogImage?.trim() || null,
    whSlug: whSlug?.trim() || null,
    whCover: whCover?.trim() || null,
    bodyHtml,
  };
};
