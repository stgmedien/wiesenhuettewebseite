import { db } from "@/lib/db";
import { bookings, customers, payments } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import { findPriceMismatches } from "@/lib/price-consistency";

/**
 * Zahlungs-Konsistenzprüfung — Ergänzung zu price-consistency.ts, das nur die
 * Preisfelder untereinander vergleicht. Anlass (10/2026): mehrere Fälle, in
 * denen Geld offen war, das System es aber nicht (richtig) angefordert hat,
 * ohne dass es jemandem auffiel:
 *  - Zahlungsaufforderung über 1,37 € statt 1.371,50 € (Tippfehler im Restbetrag)
 *  - Überweiser, deren Erinnerung Kaution + Kurtaxe nicht enthielt
 *  - Restzahlungs-Zeilen, die fälschlich auf "erhalten" stehen — der T-14-Cron
 *    überspringt die Abbuchung dann komplett
 *  - manuell angelegte Buchungen ganz ohne Zahlungsanforderung
 *
 * Meldet nur, korrigiert NICHTS. Reine Funktion checkPaymentConsistency() ist
 * bewusst von der DB getrennt, damit sie sich mit Beispielwerten prüfen lässt.
 */

/** Vorab angelegte Restzahlungs-Zeile des Kartenablaufs (siehe buchen/actions.ts). */
export const AUTO_T14_METHOD = "Stripe Off-Session (auto T-14)";
/** Zeile eines fehlgeschlagenen/unbestätigten T-14-Einzugs (siehe daily-mail-jobs). */
export const OFF_SESSION_ATTEMPT_METHOD = "Stripe Off-Session attempt";

/** Ab so vielen Tagen vor Anreise gilt ein Befund als dringend. */
export const URGENT_DAYS_BEFORE_ARRIVAL = 21;

export type ConsistencyBooking = {
  status: string;
  paymentMode: string;
  arrival: string; // YYYY-MM-DD
  subtotalCents: number;
  depositCents: number;
  kurtaxeCents: number;
  paidCents: number;
};

export type ConsistencyPayment = {
  kind: string;
  status: string;
  amountCents: number;
  method: string | null;
};

export type BookingIssue = {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  issues: string[];
  /** Anreise in höchstens URGENT_DAYS_BEFORE_ARRIVAL Tagen (oder schon vorbei). */
  urgent: boolean;
};

const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round(
    (new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) /
      86_400_000
  );

export function checkPaymentConsistency(
  b: ConsistencyBooking,
  rows: ConsistencyPayment[],
  todayIso: string
): { issues: string[]; urgent: boolean } {
  const issues: string[] = [];
  const dueCents = b.subtotalCents + b.depositCents + b.kurtaxeCents;
  const openCents = dueCents - b.paidCents;
  const income = rows.filter((r) => r.kind !== "rueckerstattung");
  const received = income.filter((r) => r.status === "erhalten");
  const openRows = income.filter((r) => r.status === "offen");

  // 1) Überzahlung
  if (openCents < 0) {
    issues.push(
      `Überzahlt: bezahlt ${formatEuro(b.paidCents)}, fällig gesamt ${formatEuro(dueCents)} — ${formatEuro(-openCents)} zu viel.`
    );
  }

  // 2) "Erhalten"-Zeilen passen nicht zum bezahlten Betrag. Erstattungen
  //    können paidCents bereits gemindert haben — beide Lesarten gelten.
  if (rows.length > 0) {
    const receivedSum = received.reduce((s, r) => s + r.amountCents, 0);
    const refundSum = rows
      .filter((r) => r.kind === "rueckerstattung")
      .reduce((s, r) => s + r.amountCents, 0);
    if (receivedSum !== b.paidCents && receivedSum - refundSum !== b.paidCents) {
      issues.push(
        `Als „erhalten“ verbuchte Zahlungen (${formatEuro(receivedSum)}) passen nicht zum bezahlten Betrag (${formatEuro(b.paidCents)}) — bei Kartenbuchungen kann dadurch die automatische Abbuchung ausfallen.`
      );
    }
  }

  if (openCents > 0) {
    const failedAttempt = rows.some(
      (r) =>
        r.method === OFF_SESSION_ATTEMPT_METHOD &&
        (r.status === "offen" || r.status === "fehlgeschlagen")
    );
    if (failedAttempt) {
      // 3) Automatischer Einzug ist gescheitert.
      issues.push(
        `Automatische Abbuchung fehlgeschlagen oder nicht bestätigt — ${formatEuro(openCents)} offen.`
      );
    } else if (openRows.length === 0) {
      // 4) Geld offen, aber nichts fordert es an. Das ist bei von Hand
      //    geführten Buchungen normal (manuell angelegt, per Überweisung
      //    bezahlt, vom Vorstand bestätigt) und deshalb KEIN Fehler — es
      //    wird erst kurz vor der Anreise als Erinnerung gemeldet, falls dann
      //    noch Geld fehlt. Kaputte automatische Pläne fängt Prüfung 2 ab.
      //    Schulgruppen mit Zahlungsaufschub haben ihren eigenen Ablauf.
      if (
        b.paymentMode !== "school_deferred" &&
        daysBetween(todayIso, b.arrival) <= URGENT_DAYS_BEFORE_ARRIVAL
      ) {
        issues.push(
          `Anreise in Kürze: noch ${formatEuro(openCents)} offen, aber keine Zahlungsanforderung hinterlegt — bitte von Hand anfordern.`
        );
      }
    } else {
      // 5) Geplante Zahlungen ≠ offener Betrag. Die vorab angelegte
      //    Restzahlungs-Zeile des Kartenablaufs enthält nur die Rest-Miete;
      //    Kaution und Kurtaxe kommen beim T-14-Einzug dazu, sofern sie noch
      //    nicht als erhalten verbucht sind.
      let plannedCents = openRows.reduce((s, r) => s + r.amountCents, 0);
      if (openRows.some((r) => r.method === AUTO_T14_METHOD)) {
        const hasOwnRow = (kind: string) => income.some((r) => r.kind === kind && r.status !== "fehlgeschlagen");
        if (!hasOwnRow("kaution")) plannedCents += b.depositCents;
        if (!hasOwnRow("kurtaxe")) plannedCents += b.kurtaxeCents;
      }
      if (plannedCents !== openCents) {
        issues.push(
          `Geplante Zahlungen (${formatEuro(plannedCents)}) weichen vom offenen Betrag (${formatEuro(openCents)}) ab.`
        );
      }
    }
  }

  const urgent =
    issues.length > 0 && daysBetween(todayIso, b.arrival) <= URGENT_DAYS_BEFORE_ARRIVAL;
  return { issues, urgent };
}

/** Prüft alle aktiven Buchungen (ohne Sperrzeiten, Stornos, Abgereiste). */
export async function findPaymentIssues(): Promise<BookingIssue[]> {
  const relevant = await db
    .select()
    .from(bookings)
    .where(inArray(bookings.status, ["angefragt", "bestaetigt", "bezahlt", "angereist"]));
  if (relevant.length === 0) return [];

  const allRows = await db
    .select({
      bookingId: payments.bookingId,
      kind: payments.kind,
      status: payments.status,
      amountCents: payments.amountCents,
      method: payments.method,
    })
    .from(payments)
    .where(
      inArray(
        payments.bookingId,
        relevant.map((b) => b.id)
      )
    );
  const rowsByBooking = new Map<string, ConsistencyPayment[]>();
  for (const r of allRows) {
    const list = rowsByBooking.get(r.bookingId) ?? [];
    list.push(r);
    rowsByBooking.set(r.bookingId, list);
  }

  const todayIso = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
  const raw: { b: (typeof relevant)[number]; issues: string[]; urgent: boolean }[] = [];
  for (const b of relevant) {
    const { issues, urgent } = checkPaymentConsistency(b, rowsByBooking.get(b.id) ?? [], todayIso);
    if (issues.length > 0) raw.push({ b, issues, urgent });
  }
  if (raw.length === 0) return [];

  const customerIds = [...new Set(raw.map((m) => m.b.customerId).filter((v): v is string => Boolean(v)))];
  const customerRows =
    customerIds.length > 0
      ? await db.select().from(customers).where(inArray(customers.id, customerIds))
      : [];
  const customerById = new Map(customerRows.map((c) => [c.id, c]));

  return raw
    .sort((x, y) => x.b.arrival.localeCompare(y.b.arrival))
    .map(({ b, issues, urgent }) => {
      const c = b.customerId ? customerById.get(b.customerId) : undefined;
      return {
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        guestName: `${c ? `${c.firstName} ${c.lastName}`.trim() : "—"} · Anreise ${formatDateLong(b.arrival)}`,
        issues,
        urgent,
      };
    });
}

/**
 * Preis- UND Zahlungsbefunde je Buchung zusammengeführt — von Cron
 * (Mail-Digest) und Dashboard-Widget genutzt, damit beide dasselbe zeigen.
 */
export async function findBookingIssues(): Promise<BookingIssue[]> {
  const [price, payment] = await Promise.all([findPriceMismatches(), findPaymentIssues()]);
  const merged = new Map<string, BookingIssue>();
  for (const p of payment) merged.set(p.bookingId, { ...p, issues: [...p.issues] });
  for (const m of price) {
    const existing = merged.get(m.bookingId);
    if (existing) existing.issues.unshift(...m.issues);
    else merged.set(m.bookingId, { ...m, urgent: false });
  }
  return [...merged.values()];
}
