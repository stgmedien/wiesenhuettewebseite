import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "em", "u", "s", "del", "ins", "code",
  "ul", "ol", "li",
  "blockquote",
  "a",
  "img", "figure", "figcaption", "picture", "source",
  "table", "thead", "tbody", "tr", "th", "td",
  "pre",
  "iframe", // for YouTube/Vimeo
  "div", "span",
];

const ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "srcset", "sizes", "alt", "loading", "decoding",
  "title",
  "width", "height",
  "class", "style",
  "id",
  "data-align",
  "frameborder", "allow", "allowfullscreen", // iframe
];

const ALLOW_IFRAME_HOSTS = [
  "youtube.com", "www.youtube.com", "youtube-nocookie.com",
  "player.vimeo.com",
];

/**
 * Sanitize user-supplied HTML before storing it in the DB or rendering it.
 * Strips <script>, on*-attributes, javascript:-URLs, and unwanted tags.
 * Allows a curated set of tags and attributes appropriate for blog content.
 */
export const sanitizeBlogHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[/#])/i,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    USE_PROFILES: { html: true },
    // Block iframes from foreign hosts via post-process below.
  });
};

/**
 * Post-process to ensure iframes only point to allowed video hosts.
 * Run after sanitizeBlogHtml.
 */
export const restrictIframes = (html: string): string => {
  return html.replace(/<iframe\b([^>]*)>/gi, (full, attrs) => {
    const srcMatch = String(attrs).match(/src=["']([^"']+)["']/i);
    if (!srcMatch) return "";
    try {
      const url = new URL(srcMatch[1]);
      const allowed = ALLOW_IFRAME_HOSTS.some((h) => url.hostname.endsWith(h));
      return allowed ? full : "";
    } catch {
      return "";
    }
  });
};

export const sanitizeAndRestrict = (html: string): string =>
  restrictIframes(sanitizeBlogHtml(html));
