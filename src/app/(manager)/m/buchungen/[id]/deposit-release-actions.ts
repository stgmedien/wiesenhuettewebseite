"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail/send";
import DepositReleaseRequestEmail from "@/lib/mail/templates/deposit-release-request";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import {
  DEPOSIT_RELEASE_METHOD,
  buildDepositReleaseUrl,
  completeDepositRelease,
  depositReturnReference,
} from "@/lib/deposit-release";

type Result = { ok: true; message: string } | { ok: false; error: string };

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!;
}

const managerName = (session: Awaited<ReturnType<typeof requireManager>>): string =>
  session.user?.name ?? session.user?.email ?? "Manager";

const revalidate = (bookingId: string) => {
  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/dashboard");
};

const findOpenRelease = async (bookingId: string) =>
  (
    await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.bookingId, bookingId),
          eq(payments.kind, "rueckerstattung"),
          eq(payments.status, "offen"),
          eq(payments.method, DEPOSIT_RELEASE_METHOD)
        )
      )
      .limit(1)
  )[0];

const releaseSchema = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  inspected: z.literal(true),
  note: z.string().trim().max(300).optional(),
});

/**
 * Schritt 1: Kaution zur Rückzahlung freigeben — legt die offene
 * Rückerstattungs-Zeile an und beauftragt die Vereinsfinanzen per Mail.
 * Ohne erreichbare Finanz-Adresse wird NICHT freigegeben, sonst stünde die
 * Buchung auf "freigegeben", ohne dass jemand davon weiß.
 */
export async function releaseDepositForRefund(raw: z.infer<typeof releaseSchema>): Promise<Result> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  const parsed = releaseSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Bitte Betrag prüfen und die Abnahme der Hütte bestätigen." };
  }
  const { bookingId, amountCents, note } = parsed.data;

  const financeTo = process.env.MAIL_FINANCE_TO;
  if (!financeTo) {
    return {
      ok: false,
      error: "Keine Finanz-Adresse hinterlegt (MAIL_FINANCE_TO) — Freigabe nicht verschickt.",
    };
  }

  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden." };
  if (b.status !== "abgereist") {
    return { ok: false, error: "Nur bei bereits abgereisten Buchungen möglich." };
  }
  if (b.stripePaymentIntentId) {
    return { ok: false, error: "Kartenbuchung — die Kaution geht automatisch über Stripe zurück." };
  }
  if (amountCents > b.paidCents) {
    return {
      ok: false,
      error: `Betrag höher als das, was der Gast bezahlt hat (${formatEuro(b.paidCents)}).`,
    };
  }
  const existing = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "rueckerstattung")))
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "Für diese Buchung ist die Kaution bereits freigegeben oder erstattet." };
  }

  const c = b.customerId
    ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
    : undefined;
  const guestName = c ? `${c.firstName} ${c.lastName}`.trim() : "—";

  // Letzter Zahlungseingang — hilft, die IBAN im Kontoauszug zu finden.
  const lastIncoming = (
    await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.bookingId, b.id),
          eq(payments.status, "erhalten"),
          ne(payments.kind, "rueckerstattung")
        )
      )
      .orderBy(desc(payments.receivedAt))
      .limit(1)
  )[0];
  const incomingHint = lastIncoming?.receivedAt
    ? `Letzter verbuchter Eingang: ${formatEuro(lastIncoming.amountCents)} am ${new Date(
        lastIncoming.receivedAt
      ).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}.`
    : undefined;

  const [row] = await db
    .insert(payments)
    .values({
      bookingId: b.id,
      kind: "rueckerstattung",
      status: "offen",
      amountCents,
      method: DEPOSIT_RELEASE_METHOD,
    })
    .returning({ id: payments.id });

  const who = managerName(session);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
  try {
    await sendMail({
      to: financeTo,
      subject: `Kaution freigegeben: ${formatEuro(amountCents)} an ${guestName} — ${b.bookingNumber}`,
      template: "deposit-release-request",
      bookingId: b.id,
      replyTo: session.user?.email ?? undefined,
      react: DepositReleaseRequestEmail({
        guestName,
        bookingNumber: b.bookingNumber,
        stayLabel: `${formatDateLong(b.arrival)} → ${formatDateLong(b.departure)}`,
        amountFormatted: formatEuro(amountCents),
        reference: depositReturnReference(b.bookingNumber),
        releasedBy: who,
        releasedAtFormatted: new Date().toLocaleString("de-DE", {
          timeZone: "Europe/Berlin",
          dateStyle: "medium",
          timeStyle: "short",
        }),
        note: note || undefined,
        incomingHint,
        confirmUrl: buildDepositReleaseUrl(baseUrl, row.id),
      }),
    });
  } catch (err) {
    // Ohne Mail keine Freigabe — Zeile wieder entfernen.
    console.error("[releaseDepositForRefund] Mail fehlgeschlagen:", err);
    await db.delete(payments).where(eq(payments.id, row.id));
    return { ok: false, error: "Mail an die Finanzen konnte nicht verschickt werden — nicht freigegeben." };
  }

  await db.insert(activityLog).values({
    who,
    what: `Kaution zur Rückzahlung freigegeben: ${formatEuro(amountCents)} — Auftrag an ${financeTo}${
      note ? ` (Hinweis: ${note})` : ""
    }`,
    bookingId: b.id,
  });

  revalidate(b.id);
  return { ok: true, message: `Freigegeben — Auftrag über ${formatEuro(amountCents)} ist raus.` };
}

/** Freigabe zurückziehen, solange die Überweisung nicht bestätigt ist. */
export async function withdrawDepositRelease(bookingId: string): Promise<Result> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  const open = await findOpenRelease(bookingId);
  if (!open) return { ok: false, error: "Keine offene Freigabe vorhanden." };

  const deleted = await db
    .delete(payments)
    .where(and(eq(payments.id, open.id), eq(payments.status, "offen")))
    .returning({ id: payments.id });
  if (deleted.length === 0) return { ok: false, error: "Die Überweisung wurde inzwischen bestätigt." };

  await db.insert(activityLog).values({
    who: managerName(session),
    what: `Kautions-Freigabe zurückgezogen: ${formatEuro(open.amountCents)} — der Link in der Auftragsmail ist damit ungültig`,
    bookingId,
  });
  revalidate(bookingId);
  return { ok: true, message: "Freigabe zurückgezogen. Bitte die Finanzen kurz informieren." };
}

/** Schritt 2 aus dem Backend heraus — falls die Bestätigung per Telefon/Mail kam. */
export async function markDepositReleaseTransferred(bookingId: string): Promise<Result> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  const open = await findOpenRelease(bookingId);
  if (!open) return { ok: false, error: "Keine offene Freigabe vorhanden." };

  const r = await completeDepositRelease(open.id, managerName(session));
  if (!r.ok) return r;
  revalidate(bookingId);
  return { ok: true, message: "Verbucht — der Gast hat die Mail zur Kaution bekommen." };
}
