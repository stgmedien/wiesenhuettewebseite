import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bookings, customers, payments, invoices } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { formatEuro, cancellationFee } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import { CancelBookingButton } from "./CancelBookingButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BuchungDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  // Customer + Booking + Payments laden, mit Ownership-Check
  const linked = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  const customer = linked[0];
  if (!customer) notFound();

  const found = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.customerId, customer.id)))
    .limit(1);
  const booking = found[0];
  if (!booking) notFound();

  const bookingPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, booking.id))
    .orderBy(desc(payments.createdAt));

  const invRow = await db
    .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.bookingId, booking.id))
    .limit(1);
  const invoice = invRow[0];

  const fee = cancellationFee(booking.subtotalCents, booking.arrival);
  const canCancel =
    booking.status !== "storniert" &&
    booking.status !== "abgereist" &&
    booking.status !== "angereist";

  // Kautions-Countdown
  const departureDate = new Date(booking.departure);
  const refundDate = new Date(departureDate);
  refundDate.setDate(refundDate.getDate() + 14);
  const daysToRefund = Math.ceil((refundDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPostStay = new Date() > departureDate;

  return (
    <div className="container max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/konto"
        className="text-sm text-[var(--color-wh-deep-green)] hover:underline mb-4 inline-block"
      >
        ← Zurück zum Konto
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold">
            Buchung
          </p>
          <h1 className="font-heading text-3xl text-[var(--color-wh-deep-green)] font-mono">
            {booking.bookingNumber}
          </h1>
          <p className="text-[var(--color-wh-black)]/80 mt-1">
            {formatDateLong(booking.arrival)} – {formatDateLong(booking.departure)}
          </p>
          <p className="text-sm text-[var(--color-wh-black)]/60">
            {booking.persons} Personen · {booking.nights} Nächte
            {booking.purpose && ` · ${booking.purpose}`}
          </p>
        </div>
        <span className={statusPill(booking.status)}>{statusLabel(booking.status)}</span>
      </div>

      {/* Pricing-Aufschluesselung */}
      <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-6 mb-6">
        <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-4">
          Preisübersicht
        </h2>
        <dl className="space-y-2 text-sm">
          <Row label="Übernachtung" value={booking.accommodationCents} />
          <Row label="Energiepauschale" value={booking.energyFlatCents} />
          <Row label="Endreinigung (Pflicht)" value={booking.cleaningCents} />
          {booking.soloSurchargeCents > 0 && (
            <Row label="Aufschlag Allein-/Exklusivnutzung" value={booking.soloSurchargeCents} />
          )}
          {booking.minOccupancySurchargeCents > 0 && (
            <Row label="Aufschlag Mindestbelegung (15 Personen)" value={booking.minOccupancySurchargeCents} />
          )}
          {booking.extrasCents > 0 && <Row label="Extras" value={booking.extrasCents} />}
          <div className="border-t border-[var(--color-wh-winter-grey)]/30 pt-2 mt-2">
            <Row label="Zwischensumme" value={booking.subtotalCents} bold />
            <Row label="Kaution (separat)" value={booking.depositCents} muted />
          </div>
          <div className="border-t border-[var(--color-wh-winter-grey)]/30 pt-2 mt-2">
            <Row label="Bisher bezahlt" value={booking.paidCents} muted />
          </div>
        </dl>
      </section>

      {/* Zahlungen */}
      <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-6 mb-6">
        <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-4">Zahlungen</h2>
        {bookingPayments.length === 0 ? (
          <p className="text-sm text-[var(--color-wh-black)]/60">
            Noch keine Zahlungen erfasst.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {bookingPayments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border-b border-[var(--color-wh-winter-grey)]/20 pb-2 last:border-0"
              >
                <span>
                  <span className="font-medium capitalize">{p.kind}</span>
                  <span className="ml-2 text-xs text-[var(--color-wh-black)]/60">
                    {p.method ?? "—"}
                    {p.receivedAt && ` · ${new Date(p.receivedAt).toLocaleDateString("de-DE")}`}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-mono">{formatEuro(p.amountCents)}</span>
                  <span className={`ml-2 ${paymentStatusClass(p.status)}`}>{p.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Kautions-Countdown */}
      {isPostStay && booking.depositCents > 0 && booking.status !== "storniert" && (
        <section className="rounded-2xl bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] p-6 mb-6">
          <h2 className="font-heading text-lg text-[var(--color-wh-deep-green)] mb-2">
            Kautions-Erstattung
          </h2>
          {booking.depositHold ? (
            <p className="text-sm">
              Die Kautions-Erstattung wurde vom Wirt angehalten
              {booking.depositHoldReason && ` — Grund: ${booking.depositHoldReason}`}. Wir melden uns
              dazu separat.
            </p>
          ) : daysToRefund > 0 ? (
            <p className="text-sm">
              Wir erstatten Deine Kaution von <strong>{formatEuro(booking.depositCents)}</strong>{" "}
              automatisch <strong>am {refundDate.toLocaleDateString("de-DE")}</strong> (in{" "}
              {daysToRefund} Tagen).
            </p>
          ) : (
            <p className="text-sm">
              Die Kaution sollte bereits zurückerstattet sein. Falls Du nichts in Deinem Konto
              siehst, schreib uns kurz.
            </p>
          )}
        </section>
      )}

      {/* Aktionen */}
      <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-6 mb-6">
        <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-4">Aktionen</h2>
        <div className="flex flex-wrap gap-3">
          {invoice && (
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold no-underline hover:opacity-90"
            >
              Rechnung als PDF · {invoice.invoiceNumber}
            </a>
          )}
          <Link
            href={`/konto/buchungen/${booking.id}/rechnung`}
            className="rounded-full border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2.5 text-sm font-semibold no-underline hover:bg-[var(--color-wh-beige)]"
          >
            Quittung im Browser
          </Link>
          {booking.status === "abgereist" && (
            <Link
              href={`/buchen?repeat=${booking.id}`}
              className="rounded-full border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2.5 text-sm font-semibold no-underline hover:bg-[var(--color-wh-deep-green)] hover:text-white transition"
            >
              Erneut buchen
            </Link>
          )}
          {canCancel && (
            <CancelBookingButton
              bookingId={booking.id}
              bookingNumber={booking.bookingNumber}
              feePercent={fee.percent}
              feeCents={fee.feeCents}
              subtotalCents={booking.subtotalCents}
            />
          )}
        </div>
        {canCancel && (
          <p className="text-xs text-[var(--color-wh-black)]/60 mt-3">
            Bei Stornierung jetzt: <strong>{fee.percent}%</strong> Storno-Gebühr ={" "}
            <strong>{formatEuro(fee.feeCents)}</strong>. Erstattung:{" "}
            <strong>{formatEuro(booking.subtotalCents - fee.feeCents)}</strong> + volle Kaution.
          </p>
        )}
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
}) {
  const cls = bold ? "font-bold" : muted ? "text-[var(--color-wh-black)]/60" : "";
  return (
    <div className={`flex justify-between ${cls}`}>
      <dt>{label}</dt>
      <dd className="font-mono">{formatEuro(value)}</dd>
    </div>
  );
}

function statusLabel(s: string): string {
  return (
    {
      angefragt: "Angefragt",
      bestaetigt: "Bestätigt",
      bezahlt: "Bezahlt",
      angereist: "Angereist",
      abgereist: "Abgereist",
      storniert: "Storniert",
      wartung: "Wartung",
    }[s] ?? s
  );
}

function statusPill(status: string): string {
  const base = "px-3 py-1 rounded-full text-xs font-medium";
  if (status === "bezahlt" || status === "angereist" || status === "abgereist")
    return `${base} bg-emerald-50 border border-emerald-200 text-emerald-800`;
  if (status === "bestaetigt") return `${base} bg-blue-50 border border-blue-200 text-blue-800`;
  if (status === "storniert") return `${base} bg-red-50 border border-red-200 text-red-800`;
  return `${base} bg-amber-50 border border-amber-200 text-amber-800`;
}

function paymentStatusClass(s: string): string {
  if (s === "erhalten") return "text-emerald-700 text-xs font-medium";
  if (s === "fehlgeschlagen") return "text-red-600 text-xs font-medium";
  if (s === "erstattet") return "text-blue-600 text-xs font-medium";
  return "text-[var(--color-wh-black)]/60 text-xs";
}
