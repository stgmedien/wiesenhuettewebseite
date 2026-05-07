import { db } from "@/lib/db";
import { mailTemplates, mailTemplateVersions } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { substituteVars, mdToHtml, wrapEmailHtml } from "@/lib/mail-render";

export { substituteVars, mdToHtml };

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
  const html = wrapEmailHtml(mdToHtml(md), subject);
  const text = md;
  return { subject, html, text };
};

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
