"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addContactToMembersList } from "@/lib/brevo";

/**
 * Neues/verifiziertes Mitglied in die Brevo-Mitgliederliste spiegeln.
 * Best effort — ein Brevo-Ausfall darf die Verifizierung nie blockieren;
 * Fehler landen im Activity-Log zum manuellen Nachtragen.
 */
async function syncMemberToBrevo(
  c: { email: string; firstName: string | null; lastName: string | null },
  who: string
) {
  try {
    const res = await addContactToMembersList(c.email, {
      firstName: c.firstName,
      lastName: c.lastName,
    });
    if (!res.ok && res.reason !== "not_configured") {
      await db.insert(activityLog).values({
        who: "Brevo",
        what: `⚠️ Mitglied ${c.email} konnte nicht in die Brevo-Mitgliederliste eingetragen werden (${res.reason}). Bitte manuell ergänzen. [${who}]`,
      });
    }
    return res.ok;
  } catch (e) {
    // Strikt non-blocking: die Verifizierung darf an Brevo nie scheitern.
    console.error("[mitgliedschaften] Brevo-Sync Ausnahme:", e);
    return false;
  }
}

const idSchema = z.string().uuid();

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    throw new Error("Nicht autorisiert.");
  }
  return session!.user!.email!;
}

export async function approveMembership(formData: FormData) {
  const me = await requireManager();
  const id = idSchema.parse(formData.get("id"));
  const memberId = (formData.get("memberId") ?? "").toString().trim() || null;

  const [updated] = await db
    .update(customers)
    .set({
      membershipStatus: "verified",
      type: "mitglied",
      membershipVerifiedAt: new Date(),
      membershipVerifiedBy: me,
      membershipRejectedReason: null,
      ...(memberId ? { memberId } : {}),
    })
    .where(eq(customers.id, id))
    .returning({
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
    });

  // Keine Zeile getroffen → ID existiert nicht. Keine falsche Erfolgsmeldung.
  if (!updated) {
    await db.insert(activityLog).values({
      who: me,
      what: `Mitgliedschaft NICHT verifiziert — customer=${id} nicht gefunden.`,
    });
    revalidatePath("/m/mitgliedschaften");
    return;
  }

  const brevoOk = await syncMemberToBrevo(updated, me);

  await db.insert(activityLog).values({
    who: me,
    what: `Mitgliedschaft bestätigt: customer=${id}${memberId ? ` (Mitgliedsnr. ${memberId})` : ""}${brevoOk ? " + Brevo-Mitgliederliste" : ""}`,
  });

  revalidatePath("/m/mitgliedschaften");
}

export async function rejectMembership(formData: FormData) {
  const me = await requireManager();
  const id = idSchema.parse(formData.get("id"));
  const reason = (formData.get("reason") ?? "").toString().trim() || null;

  await db
    .update(customers)
    .set({
      membershipStatus: "rejected",
      type: "privat",
      membershipVerifiedAt: null,
      membershipVerifiedBy: me,
      membershipRejectedReason: reason,
      memberId: null,
    })
    .where(eq(customers.id, id));

  await db.insert(activityLog).values({
    who: me,
    what: `Mitgliedschaft abgelehnt: customer=${id}${reason ? ` (Grund: ${reason})` : ""}`,
  });

  revalidatePath("/m/mitgliedschaften");
}
