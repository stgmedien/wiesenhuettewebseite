import { restLeadDaysFor } from "@/lib/booking-kind";

// =============================================================
// Gemeinsame Berechnung für den Knopf "Restzahlung + Kaution + Kurtaxe per
// Überweisung erhalten": offener Betrag und Fälligkeit. Dieselbe Logik wie
// beim T-14/T-30-Einzug im daily-mail-jobs-Cron (offene Restzahlungs-Zeile
// bevorzugt, sonst subtotalCents − paidCents; Kaution/Kurtaxe nur, wenn
// noch nicht als erhalten verbucht).
// =============================================================

type PaymentLike = { kind: string; status: string; amountCents: number; method?: string | null };

type BookingLike = {
  arrival: string;
  subtotalCents: number;
  paidCents: number;
  depositCents: number;
  kurtaxeCents: number;
  source?: string | null;
  institution?: string | null;
  prepayPercent?: number | null;
  createdAt?: Date | null;
};

export type OpenFinalPayment = {
  restAlreadyReceived: boolean;
  /** Der Cron hat den Stripe-Einzug schon versucht (läuft oder ist gescheitert). */
  autoChargeAttempted: boolean;
  rentRemainderCents: number;
  kautionCents: number;
  kurtaxeCents: number;
  totalCents: number;
};

export function openFinalPayment(b: BookingLike, pmts: PaymentLike[]): OpenFinalPayment {
  const rest = pmts.filter((p) => p.kind === "restzahlung");
  const restAlreadyReceived = rest.some((p) => p.status === "erhalten");
  const autoChargeAttempted = rest.some((p) => p.method === "Stripe Off-Session attempt");
  const openRestRow = rest.find((p) => p.status === "offen");
  const rentRemainderCents = openRestRow
    ? openRestRow.amountCents
    : Math.max(0, b.subtotalCents - Math.min(b.paidCents, b.subtotalCents));
  const kautionCents = pmts.some((p) => p.kind === "kaution" && p.status === "erhalten")
    ? 0
    : b.depositCents;
  const kurtaxeCents = pmts.some((p) => p.kind === "kurtaxe" && p.status === "erhalten")
    ? 0
    : b.kurtaxeCents;
  return {
    restAlreadyReceived,
    autoChargeAttempted,
    rentRemainderCents,
    kautionCents,
    kurtaxeCents,
    totalCents: rentRemainderCents + kautionCents + kurtaxeCents,
  };
}

/** Fälligkeitstag der Restzahlung (YYYY-MM-DD): Anreise − 14 bzw. 30 Tage. */
export function restDueDateIso(b: BookingLike): string {
  const d = new Date(`${b.arrival}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - restLeadDaysFor(b));
  return d.toISOString().slice(0, 10);
}

/** Heutiges Datum in Berlin als YYYY-MM-DD. */
export function todayBerlinIso(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
}

/**
 * Vom Manager eingetragenes Überweisungsdatum (YYYY-MM-DD) → Zeitpunkt.
 * Mittags (12:00 UTC), damit die Anzeige in Berlin immer denselben Tag zeigt.
 * Leer → jetzt. Ungültig, in der Zukunft oder älter als 2 Jahre → Fehler.
 */
export function parseReceivedOn(value: string | null | undefined): Date | { error: string } {
  if (!value) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { error: "Ungültiges Überweisungsdatum." };
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return { error: "Ungültiges Überweisungsdatum." };
  if (value > todayBerlinIso()) return { error: "Das Überweisungsdatum liegt in der Zukunft." };
  const min = new Date();
  min.setUTCFullYear(min.getUTCFullYear() - 2);
  if (d < min) return { error: "Das Überweisungsdatum liegt mehr als zwei Jahre zurück." };
  return d;
}
