"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { mailTemplates, mailTemplateVersions, activityLog } from "@/lib/db/schema";
import { eq, desc, max } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const createSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_-]+$/i, "Nur a–z, 0–9, _, -"),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  variables: z.string().max(2000).optional().nullable(),
});

export async function createTemplate(formData: FormData) {
  const me = await requireManager();
  const parsed = createSchema.safeParse({
    key: formData.get("key"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    variables: formData.get("variables") || null,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const variableList = (parsed.data.variables ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((name) => ({ name, description: "" }));

  await db.insert(mailTemplates).values({
    key: parsed.data.key.toLowerCase(),
    name: parsed.data.name,
    description: parsed.data.description,
    variables: variableList,
  });
  await db.insert(activityLog).values({
    who: me,
    what: `Mail-Template angelegt: ${parsed.data.key}`,
  });
  revalidatePath("/m/mail-templates");
  return { ok: true as const };
}

const newVersionSchema = z.object({
  templateId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  bodyMd: z.string().min(1).max(50000),
  changeNote: z.string().max(500).optional().nullable(),
  setActive: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function saveTemplateVersion(formData: FormData) {
  const me = await requireManager();
  const parsed = newVersionSchema.safeParse({
    templateId: formData.get("templateId"),
    subject: formData.get("subject"),
    bodyMd: formData.get("bodyMd"),
    changeNote: formData.get("changeNote") || null,
    setActive: formData.get("setActive"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  // Naechste Versionsnummer ermitteln
  const last = await db
    .select({ v: max(mailTemplateVersions.version) })
    .from(mailTemplateVersions)
    .where(eq(mailTemplateVersions.templateId, parsed.data.templateId));
  const nextVersion = (last[0]?.v ?? 0) + 1;

  const inserted = await db
    .insert(mailTemplateVersions)
    .values({
      templateId: parsed.data.templateId,
      version: nextVersion,
      subject: parsed.data.subject,
      bodyMd: parsed.data.bodyMd,
      changeNote: parsed.data.changeNote,
      createdBy: me,
    })
    .returning({ id: mailTemplateVersions.id });

  if (parsed.data.setActive) {
    await db
      .update(mailTemplates)
      .set({ activeVersionId: inserted[0].id, updatedAt: new Date() })
      .where(eq(mailTemplates.id, parsed.data.templateId));
  }

  await db.insert(activityLog).values({
    who: me,
    what: `Mail-Template Version ${nextVersion} gespeichert${
      parsed.data.setActive ? " + aktiviert" : ""
    } (template ${parsed.data.templateId})`,
  });
  revalidatePath(`/m/mail-templates/${parsed.data.templateId}`);
  revalidatePath("/m/mail-templates");
  return { ok: true as const, version: nextVersion };
}

export async function activateVersion(formData: FormData) {
  const me = await requireManager();
  const templateId = z.string().uuid().parse(formData.get("templateId"));
  const versionId = z.string().uuid().parse(formData.get("versionId"));
  await db
    .update(mailTemplates)
    .set({ activeVersionId: versionId, updatedAt: new Date() })
    .where(eq(mailTemplates.id, templateId));
  await db.insert(activityLog).values({
    who: me,
    what: `Mail-Template aktive Version geaendert (template ${templateId} -> version ${versionId})`,
  });
  revalidatePath(`/m/mail-templates/${templateId}`);
  return { ok: true as const };
}
