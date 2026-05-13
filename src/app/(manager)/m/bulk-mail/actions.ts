"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bulkMailCampaigns,
  bulkMailSends,
  activityLog,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail/send";
import BulkMailWrapper from "@/lib/mail/templates/bulk-mail-wrapper";
import { markdownToHtml } from "@/lib/markdown-to-html";
import {
  resolveAudience,
  buildOptOutToken,
  type AudienceKey,
} from "@/lib/bulk-mail-audience";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(20).max(20000),
  audience: z.enum(["all_customers", "verified_members", "recent_guests", "upcoming_guests"]),
});

export async function createCampaign(formData: FormData) {
  const me = await requireManager();
  const parsed = createSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    audience: formData.get("audience"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const d = parsed.data;
  const recipients = await resolveAudience(d.audience);

  const inserted = await db
    .insert(bulkMailCampaigns)
    .values({
      subject: d.subject,
      body: d.body,
      audience: d.audience,
      createdBy: me,
      status: "draft",
      totalRecipients: recipients.length,
    })
    .returning({ id: bulkMailCampaigns.id });

  await db.insert(activityLog).values({
    who: me,
    what: `Bulk-Mail-Kampagne angelegt: "${d.subject}" (${recipients.length} Empfänger geplant)`,
  });

  revalidatePath("/m/bulk-mail");
  return { ok: true as const, id: inserted[0].id };
}

export async function sendCampaign(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const campaign = (
    await db.select().from(bulkMailCampaigns).where(eq(bulkMailCampaigns.id, id)).limit(1)
  )[0];
  if (!campaign) return { ok: false as const, error: "Kampagne nicht gefunden." };
  if (campaign.status !== "draft") {
    return { ok: false as const, error: "Kampagne wurde schon versendet." };
  }

  await db
    .update(bulkMailCampaigns)
    .set({ status: "sending" })
    .where(eq(bulkMailCampaigns.id, id));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const recipients = await resolveAudience(campaign.audience as AudienceKey);

  const bodyHtml = markdownToHtml(campaign.body);
  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    const optOutToken = buildOptOutToken(r.customerId);
    const optOutUrl = `${baseUrl}/opt-out?id=${encodeURIComponent(r.customerId)}&t=${optOutToken}`;
    try {
      await sendMail({
        to: r.email,
        subject: campaign.subject,
        template: `bulk_${id.slice(0, 8)}`,
        react: BulkMailWrapper({
          subject: campaign.subject,
          bodyHtml,
          firstName: r.firstName,
          optOutUrl,
        }),
      });
      await db.insert(bulkMailSends).values({
        campaignId: id,
        customerId: r.customerId,
        email: r.email,
        status: "sent",
      });
      sent++;
    } catch (err) {
      await db.insert(bulkMailSends).values({
        campaignId: id,
        customerId: r.customerId,
        email: r.email,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "unknown",
      });
      failed++;
    }
  }

  await db
    .update(bulkMailCampaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      totalSent: sent,
      totalFailed: failed,
    })
    .where(eq(bulkMailCampaigns.id, id));

  await db.insert(activityLog).values({
    who: me,
    what: `Bulk-Mail "${campaign.subject}" versandt: ${sent} ok, ${failed} fehlgeschlagen (von ${recipients.length})`,
  });

  revalidatePath("/m/bulk-mail");
  revalidatePath(`/m/bulk-mail/${id}`);
  return { ok: true as const, sent, failed };
}

export async function deleteCampaign(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const rows = await db.select().from(bulkMailCampaigns).where(eq(bulkMailCampaigns.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const };
  await db.delete(bulkMailCampaigns).where(eq(bulkMailCampaigns.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `Bulk-Mail-Kampagne gelöscht: "${rows[0].subject}"`,
  });
  revalidatePath("/m/bulk-mail");
  return { ok: true as const };
}
