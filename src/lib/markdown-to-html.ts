/**
 * Sehr leichter Markdown → HTML-Konverter für Bulk-Mails.
 *
 * Unterstützt:
 *   - **bold**, *italic*
 *   - [link](url)
 *   - # H2, ## H3 (am Zeilenanfang)
 *   - Listen mit "- " oder "* "
 *   - Leerzeile → <p>-Trennung
 *
 * Filter (Anti-XSS):
 *   - HTML-Eingabe wird escapet, BEVOR Markdown-Substitution stattfindet
 *   - Link-URLs werden auf http(s):// oder mailto: beschränkt
 *
 * Ausreichend für unsere Bulk-Mails (kein TipTap-Editor).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(u: string): string | null {
  const trimmed = u.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  return null;
}

function inline(text: string): string {
  // Reihenfolge wichtig: bold vor italic
  let out = escapeHtml(text);
  // [text](url) → <a>
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const safe = safeUrl(url);
    if (!safe) return label;
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return out;
}

const blockStyle = "font-family: Inter, system-ui, sans-serif; font-size: 16px; line-height: 1.55; color: #111111; margin: 0 0 14px 0;";
const h2Style = "font-family: 'Bricolage Grotesque', system-ui, sans-serif; font-size: 22px; font-weight: 700; color: #2F4A35; margin: 24px 0 8px 0;";
const h3Style = "font-family: 'Bricolage Grotesque', system-ui, sans-serif; font-size: 18px; font-weight: 700; color: #2F4A35; margin: 20px 0 8px 0;";
const ulStyle = "margin: 0 0 14px 0; padding-left: 22px;";

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let inList = false;
  let paragraphBuf: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    const joined = paragraphBuf.join(" ").trim();
    if (joined) out.push(`<p style="${blockStyle}">${inline(joined)}</p>`);
    paragraphBuf = [];
  };

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushParagraph();
      closeList();
      out.push(`<h3 style="${h3Style}">${inline(line.slice(3))}</h3>`);
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      closeList();
      out.push(`<h2 style="${h2Style}">${inline(line.slice(2))}</h2>`);
      continue;
    }
    if (/^[-*] /.test(line)) {
      flushParagraph();
      if (!inList) {
        out.push(`<ul style="${ulStyle}">`);
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*] /, ""))}</li>`);
      continue;
    }
    if (line === "") {
      flushParagraph();
      closeList();
      continue;
    }
    closeList();
    paragraphBuf.push(line);
  }
  flushParagraph();
  closeList();

  return out.join("\n");
}
