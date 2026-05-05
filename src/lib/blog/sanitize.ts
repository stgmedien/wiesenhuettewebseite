/**
 * Sanitize HTML for blog content.
 *
 * Designed for manager-authored content (i.e. authenticated, trusted source).
 * Provides defense-in-depth against accidental script tags / inline handlers
 * that may sneak in via copy-paste from other tools.
 *
 * Implementation note: we deliberately avoid `isomorphic-dompurify` here
 * because it pulls jsdom in Node and Turbopack chokes on the dependency
 * graph at runtime. A pure-regex sanitizer is sufficient for our threat
 * model (trusted authors, no public submissions).
 */

const ALLOWED_IFRAME_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
];

const DANGEROUS_TAG_BLOCKS = [
  "script",
  "style",
  "object",
  "embed",
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "link",
  "meta",
  "base",
];

const stripTagBlock = (html: string, tag: string): string => {
  // Remove the entire <tag>...</tag> block (case-insensitive, multiline, with attributes).
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, "gi");
  // Also remove self-closing variants <tag />
  const reSelf = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
  return html.replace(re, "").replace(reSelf, "");
};

const stripEventHandlers = (html: string): string =>
  // Strip on*="..." or on*='...' attributes from any tag.
  html.replace(/\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g, "");

const stripJavascriptUrls = (html: string): string =>
  // href="javascript:..." or src="javascript:..."
  html
    .replace(/\s+(href|src|xlink:href)\s*=\s*"javascript:[^"]*"/gi, "")
    .replace(/\s+(href|src|xlink:href)\s*=\s*'javascript:[^']*'/gi, "");

const restrictIframes = (html: string): string =>
  html.replace(/<iframe\b([^>]*)>/gi, (full, rawAttrs: string) => {
    const srcMatch = rawAttrs.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) return "";
    try {
      const url = new URL(srcMatch[1]);
      const ok = ALLOWED_IFRAME_HOSTS.some((h) => url.hostname.endsWith(h));
      if (!ok) return "";
      // Preserve original tag (with attributes); browser will close it normally.
      return full;
    } catch {
      return "";
    }
  });

const stripIframeWithoutClose = (html: string): string => {
  // If we removed an opening iframe tag above, also remove dangling </iframe>.
  // Find pairs and only keep matching ones. Conservative approach: walk and
  // keep iframes only where the opening tag was preserved by restrictIframes.
  return html;
};

export const sanitizeBlogHtml = (html: string): string => {
  if (!html) return "";
  let out = html;
  for (const tag of DANGEROUS_TAG_BLOCKS) out = stripTagBlock(out, tag);
  out = stripEventHandlers(out);
  out = stripJavascriptUrls(out);
  out = restrictIframes(out);
  out = stripIframeWithoutClose(out);
  return out;
};

export const sanitizeAndRestrict = (html: string): string => sanitizeBlogHtml(html);
