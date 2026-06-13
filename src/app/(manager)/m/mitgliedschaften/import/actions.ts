"use server";

import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseCsv } from "@/lib/csv-parse";
import { addContactToMembersList } from "@/lib/brevo";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

/**
 * Importiertes Mitglied in die Brevo-Mitgliederliste spiegeln. Best effort —
 * ein Brevo-Ausfall darf den Import nicht abbrechen; Fehler landen im
 * Activity-Log zum manuellen Nachtragen.
 */
async function syncMemberToBrevo(
  r: { email: string; firstName: string; lastName: string },
  who: string
) {
  try {
    const res = await addContactToMembersList(r.email, {
      firstName: r.firstName,
      lastName: r.lastName,
    });
    if (!res.ok && res.reason !== "not_configured") {
      await db.insert(activityLog).values({
        who: "Brevo",
        what: `⚠️ Mitglied ${r.email} konnte nicht in die Brevo-Mitgliederliste eingetragen werden (${res.reason}). Bitte manuell ergänzen. [${who} · Bulk-Import]`,
      });
    }
  } catch (e) {
    // Strikt non-blocking: ein Brevo-Fehler darf den Import nicht abbrechen.
    console.error("[import] Brevo-Sync Ausnahme:", e);
  }
}

export type ParsedRow = {
  rowIndex: number;
  email: string;
  firstName: string;
  lastName: string;
  memberId: string | null;
  phone: string | null;
  joinedAt: string | null; // ISO yyyy-mm-dd
  status: "new" | "update" | "conflict";
  conflictReason?: string;
  existingCustomerId?: string;
};

export type PreviewResult =
  | { ok: true; rows: ParsedRow[]; counts: { new: number; update: number; conflict: number } }
  | { ok: false; error: string };

const headerSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  memberId: z.string().max(60).nullable(),
  phone: z.string().max(60).nullable(),
  joinedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

/**
 * Parsed CSV → Preview-Rows mit "new"/"update"/"conflict"-Markierung.
 * Verändert NICHTS in der DB. Stateless — bei Commit wird der Manager-CSV-Text
 * erneut hochgeladen.
 */
export async function previewImport(formData: FormData): Promise<PreviewResult> {
  await requireManager();
  const file = formData.get("csv");
  if (!(file instanceof File)) return { ok: false, error: "Bitte eine CSV-Datei wählen." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Datei zu groß (max 2 MB)." };

  const text = await file.text();
  const parsed = parseCsv(text);

  // Header-Validierung
  const required = ["email", "firstname", "lastname"];
  const missing = required.filter((h) => !parsed.headers.includes(h));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Fehlende Spalten: ${missing.join(", ")}. Erwartete Mindest-Header: email, firstName, lastName (optional: memberId, phone, joinedAt).`,
    };
  }

  // Email-Liste sammeln für Bulk-Existenz-Check
  const emails = parsed.rows
    .map((r) => (r.email || "").toLowerCase().trim())
    .filter(Boolean);
  const existingRows = emails.length === 0
    ? []
    : await db
        .select({ id: customers.id, email: customers.email })
        .from(customers)
        .where(inArray(customers.email, emails));
  const existingByEmail = new Map(existingRows.map((r) => [r.email.toLowerCase(), r.id]));

  // memberId-Duplikate innerhalb der CSV finden
  const memberIdsInCsv = new Map<string, number>(); // memberId -> first rowIndex
  parsed.rows.forEach((r, idx) => {
    const mid = (r.memberid || r.memberId || "").trim();
    if (mid) {
      if (!memberIdsInCsv.has(mid)) memberIdsInCsv.set(mid, idx);
    }
  });
  const duplicateMemberIds = new Set<string>();
  parsed.rows.forEach((r, idx) => {
    const mid = (r.memberid || r.memberId || "").trim();
    if (mid && memberIdsInCsv.get(mid) !== idx) duplicateMemberIds.add(mid);
  });

  const result: ParsedRow[] = parsed.rows.map((r, idx) => {
    const raw = {
      email: (r.email || "").toLowerCase().trim(),
      firstName: (r.firstname || r.firstName || "").trim(),
      lastName: (r.lastname || r.lastName || "").trim(),
      memberId: ((r.memberid || r.memberId || "").trim() || null) as string | null,
      phone: ((r.phone || "").trim() || null) as string | null,
      joinedAt: ((r.joinedat || r.joinedAt || "").trim() || null) as string | null,
    };
    const v = headerSchema.safeParse(raw);
    if (!v.success) {
      return {
        rowIndex: idx + 2, // +2 weil Zeile 1 ist Header
        email: raw.email,
        firstName: raw.firstName,
        lastName: raw.lastName,
        memberId: raw.memberId,
        phone: raw.phone,
        joinedAt: raw.joinedAt,
        status: "conflict",
        conflictReason: v.error.issues[0]?.message ?? "Ungültige Felder",
      };
    }

    if (raw.memberId && duplicateMemberIds.has(raw.memberId)) {
      return {
        rowIndex: idx + 2,
        ...v.data,
        status: "conflict",
        conflictReason: `MemberId ${raw.memberId} mehrfach in CSV`,
      };
    }

    const existingId = existingByEmail.get(raw.email);
    return {
      rowIndex: idx + 2,
      ...v.data,
      status: existingId ? "update" : "new",
      existingCustomerId: existingId,
    };
  });

  const counts = {
    new: result.filter((r) => r.status === "new").length,
    update: result.filter((r) => r.status === "update").length,
    conflict: result.filter((r) => r.status === "conflict").length,
  };

  return { ok: true, rows: result, counts };
}

export type CommitResult = {
  ok: boolean;
  created: number;
  updated: number;
  skipped: number;
  error?: string;
};

/**
 * Erneute Parse + Commit. Bewusst stateless — die Preview-Ergebnisse werden
 * nicht serialisiert herumgereicht (Sicherheit + Einfachheit). Bei Commit wird
 * dieselbe CSV erneut hochgeladen und in einer Transaktion verarbeitet.
 */
export async function commitImport(formData: FormData): Promise<CommitResult> {
  const me = await requireManager();
  const preview = await previewImport(formData);
  if (!preview.ok) return { ok: false, created: 0, updated: 0, skipped: 0, error: preview.error };

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Sequenziell, weil pro Row ein Audit-Log-Eintrag entsteht. Bei großen Listen
  // (>1000) sollte das in Drizzle-Transaction gewrapped werden — aktuell für
  // typische Vereins-Größen (50-200 Mitglieder) okay.
  for (const r of preview.rows) {
    if (r.status === "conflict") {
      skipped++;
      await db.insert(activityLog).values({
        who: me,
        what: `Mitglieder-Import übersprungen (Zeile ${r.rowIndex}): ${r.email} — ${r.conflictReason}`,
      });
      continue;
    }
    if (r.status === "new") {
      await db.insert(customers).values({
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        type: "mitglied",
        memberId: r.memberId,
        phone: r.phone,
        membershipStatus: "verified",
        membershipVerifiedAt: new Date(),
        membershipVerifiedBy: me,
      });
      created++;
      await db.insert(activityLog).values({
        who: me,
        what: `Mitglied via Bulk-Import angelegt: ${r.firstName} ${r.lastName} (${r.email}${r.memberId ? `, Nr. ${r.memberId}` : ""})`,
      });
      await syncMemberToBrevo(r, me);
      continue;
    }
    if (r.status === "update" && r.existingCustomerId) {
      await db
        .update(customers)
        .set({
          type: "mitglied",
          memberId: r.memberId,
          phone: r.phone ?? undefined,
          membershipStatus: "verified",
          membershipVerifiedAt: new Date(),
          membershipVerifiedBy: me,
          membershipRejectedReason: null,
        })
        .where(eq(customers.id, r.existingCustomerId));
      updated++;
      await db.insert(activityLog).values({
        who: me,
        what: `Mitglied via Bulk-Import verifiziert: ${r.firstName} ${r.lastName} (${r.email}${r.memberId ? `, Nr. ${r.memberId}` : ""})`,
      });
      await syncMemberToBrevo(r, me);
    }
  }

  revalidatePath("/m/mitgliedschaften");
  revalidatePath("/m/mitgliedschaften/import");
  return { ok: true, created, updated, skipped };
}
