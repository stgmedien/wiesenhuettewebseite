import { db } from "@/lib/db";
import { mailTemplates, mailTemplateVersions } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";

/**
 * Variable-Substitution mit {{name}}-Syntax. Sicher gegen HTML-Injection
 * (escaped die Werte). Unbekannte Variablen werden als leerer String ersetzt.
 */
export const substituteVars = (
  template: string,
  vars: Record<string, string | number | undefined | null>
): string => {
  return template.replace(/\{\{([\w]+)\}\}/g, (_match, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
};

/**
 * Kleiner Markdown -> HTML-Konverter, ausreichend fuer Mail-Templates.
 * Unterstuetzt: Headings (#-####), bold (**), italic (*), Links [text](url),
 * Listen (- ...), Absaetze, Zeilenumbrueche.
 */
export const mdToHtml = (md: string): string => {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Block by block (split on blank lines)
  const blocks = md.replace(/\r\n/g, "\n").split(/\n\n+/);
  const out: string[] = [];

  for (const blockRaw of blocks) {
    const block = blockRaw.trim();
    if (!block) continue;

    // Heading
    const heading = block.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = inline(escapeHtml(heading[2]));
      out.push(`<h${level} style="font-family:Inter,sans-serif;color:#2F4A35;margin:16px 0 8px 0;">${text}</h${level}>`);
      continue;
    }

    // List
    if (block.split("\n").every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = block
        .split("\n")
        .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
        .map((l) => `<li style="margin:4px 0;">${inline(escapeHtml(l))}</li>`)
        .join("");
      out.push(`<ul style="font-family:Inter,sans-serif;font-size:15px;line-height:1.5;padding-left:20px;margin:8px 0;">${items}</ul>`);
      continue;
    }

    // Paragraph
    const paragraph = block.split("\n").map((l) => inline(escapeHtml(l))).join("<br/>");
    out.push(`<p style="font-family:Inter,sans-serif;font-size:15px;line-height:1.55;margin:8px 0;color:#111;">${paragraph}</p>`);
  }

  return out.join("\n");

  function inline(s: string): string {
    return s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" style="color:#2F4A35;">$1</a>'
      );
  }
};

/**
 * Holt die aktive Version eines Templates per key. Liefert null, wenn das
 * Template nicht angelegt ist oder keine aktive Version hat.
 */
export const getActiveTemplate = async (
  key: string
): Promise<{ subject: string; bodyMd: string; bodyHtml: string } | null> => {
  const t = await db
    .select()
    .from(mailTemplates)
    .where(eq(mailTemplates.key, key))
    .limit(1);
  if (!t[0] || !t[0].activeVersionId) return null;
  const v = await db
    .select()
    .from(mailTemplateVersions)
    .where(eq(mailTemplateVersions.id, t[0].activeVersionId))
    .limit(1);
  if (!v[0]) return null;
  return {
    subject: v[0].subject,
    bodyMd: v[0].bodyMd,
    bodyHtml: mdToHtml(v[0].bodyMd),
  };
};

/**
 * Rendert ein Template mit Variablen (subject + bodyHtml + bodyMd).
 */
export const renderMailTemplate = async (
  key: string,
  vars: Record<string, string | number | undefined | null>
): Promise<{ subject: string; html: string; text: string } | null> => {
  const t = await getActiveTemplate(key);
  if (!t) return null;
  const subject = substituteVars(t.subject, vars);
  const md = substituteVars(t.bodyMd, vars);
  const html = wrapHtml(mdToHtml(md));
  const text = md;
  return { subject, html, text };
};

const wrapHtml = (inner: string): string => `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/></head>
<body style="background:#F7F7F2;padding:32px 0;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:20px;">
    <p style="font-family:Inter,sans-serif;font-size:11px;color:#2F4A35;letter-spacing:0.16em;text-transform:uppercase;margin:0 0 12px;">
      Wiesenhütte
    </p>
    ${inner}
    <hr style="border:0;border-top:1px solid #C8CEC4;margin:28px 0 12px;"/>
    <p style="font-family:Inter,sans-serif;font-size:11px;color:#5b5b56;margin:0;">
      Skifreunde Gütersloh e.V. · hello@wiesenhütte.com · www.wiesenhütte.com
    </p>
  </div>
</body>
</html>`;

export const listTemplates = async () => {
  return await db.select().from(mailTemplates).orderBy(asc(mailTemplates.key));
};

export const listVersions = async (templateId: string) => {
  return await db
    .select()
    .from(mailTemplateVersions)
    .where(eq(mailTemplateVersions.templateId, templateId))
    .orderBy(desc(mailTemplateVersions.version));
};
