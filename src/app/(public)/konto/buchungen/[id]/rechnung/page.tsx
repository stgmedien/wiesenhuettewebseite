import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bookings, customers, payments } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

// Diese Seite ist als Print-/PDF-Quittung gestaltet — Browser-Druck als PDF speichern.
export default async function QuittungPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

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
    .orderBy(asc(payments.createdAt));

  const totalReceived = bookingPayments
    .filter((p) => p.status === "erhalten")
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="bg-white print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 18mm 16mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print bg-[var(--color-wh-cream)] py-3 px-6 flex items-center justify-between sticky top-0 z-10 border-b border-[var(--color-wh-stone)]/40">
        <a
          href={`/konto/buchungen/${booking.id}`}
          className="text-sm text-[var(--color-wh-forest)] hover:underline"
        >
          ← Zurück
        </a>
        <PrintButton />
      </div>

      <div className="max-w-[760px] mx-auto px-12 py-12 text-[14px] text-[#111] leading-relaxed font-serif">
        {/* Kopf */}
        <header className="flex items-start justify-between mb-12 pb-6 border-b-2 border-[var(--color-wh-forest)]">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-wh-forest)] mb-1">
              Wiesenhütte
            </h1>
            <p className="text-xs text-[#555]">Skifreunde Gütersloh e.V.</p>
            <p className="text-xs text-[#555]">Wiesenhütte 1, 59955 Winterberg-Langewiese</p>
            <p className="text-xs text-[#555]">hello@wiesenhütte.com</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-[#555]">Buchungsbestätigung</p>
            <p className="font-mono text-lg font-bold">{booking.bookingNumber}</p>
            <p className="text-xs text-[#555] mt-1">
              Ausgestellt am {new Date().toLocaleDateString("de-DE")}
            </p>
          </div>
        </header>

        {/* Empfänger */}
        <section className="mb-10">
          <p className="text-xs uppercase tracking-wider text-[#555] mb-1">Empfänger</p>
          <p className="font-bold">
            {customer.firstName} {customer.lastName}
          </p>
          {customer.company && <p>{customer.company}</p>}
          {customer.street && <p>{customer.street}</p>}
          {(customer.zip || customer.city) && (
            <p>
              {customer.zip} {customer.city}
            </p>
          )}
          <p className="text-[#555]">{customer.email}</p>
        </section>

        {/* Aufenthalts-Daten */}
        <section className="mb-8 grid grid-cols-3 gap-4 bg-[var(--color-wh-cream)] p-5 rounded">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#555]">Anreise</p>
            <p className="font-bold">{formatDateLong(booking.arrival)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#555]">Abreise</p>
            <p className="font-bold">{formatDateLong(booking.departure)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#555]">Belegung</p>
            <p className="font-bold">
              {booking.persons} Personen · {booking.nights} Nächte
            </p>
          </div>
        </section>

        {/* Positionen */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-[#111]">
              <th className="text-left py-2 text-xs uppercase tracking-wider">Position</th>
              <th className="text-right py-2 text-xs uppercase tracking-wider">Betrag</th>
            </tr>
          </thead>
          <tbody>
            <Line label="Übernachtung" cents={booking.accommodationCents} />
            <Line label="Energiepauschale" cents={booking.energyFlatCents} />
            <Line label="Endreinigung (Pflicht)" cents={booking.cleaningCents} />
            {booking.soloSurchargeCents > 0 && (
              <Line label="Aufschlag Allein-/Exklusivnutzung" cents={booking.soloSurchargeCents} />
            )}
            {booking.extrasCents > 0 && <Line label="Extras" cents={booking.extrasCents} />}
            <tr className="border-t-2 border-[#111] font-bold">
              <td className="py-3">Zwischensumme</td>
              <td className="py-3 text-right font-mono">{formatEuro(booking.subtotalCents)}</td>
            </tr>
            <tr className="text-[#555]">
              <td className="py-2 text-xs">Kaution (separat, Erstattung 14 Tage nach Abreise)</td>
              <td className="py-2 text-right font-mono text-xs">
                {formatEuro(booking.depositCents)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Zahlungen */}
        {bookingPayments.length > 0 && (
          <section className="mb-8">
            <p className="text-xs uppercase tracking-wider text-[#555] mb-2">Zahlungen</p>
            <table className="w-full text-xs border-collapse">
              <tbody>
                {bookingPayments.map((p) => (
                  <tr key={p.id} className="border-b border-[#ddd] last:border-0">
                    <td className="py-1 capitalize">{p.kind}</td>
                    <td className="py-1 text-[#555]">{p.method ?? "—"}</td>
                    <td className="py-1 text-[#555]">
                      {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString("de-DE") : "offen"}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {p.status === "erhalten" ? "+" : ""}
                      {formatEuro(p.amountCents)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#111] font-bold">
                  <td colSpan={3} className="py-2">
                    Erhalten
                  </td>
                  <td className="py-2 text-right font-mono">{formatEuro(totalReceived)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Hinweise */}
        <section className="text-xs text-[#555] border-t border-[#ddd] pt-4">
          <p className="mb-2">
            <strong>Hinweis Kurtaxe:</strong> Die Kurtaxe Hochsauerland wird seit Mai 2026 nicht
            mehr über die Wiesenhütte abgerechnet. Du erhältst nach Buchung eine separate E-Mail
            mit dem Link zum offiziellen Kurtaxen-Portal.
          </p>
          <p className="mb-2">
            <strong>Stornierungs­bedingungen:</strong> &gt; 30 Tage 0% / 29–14 Tage 30% / 13–7
            Tage 60% / &lt; 7 Tage 90% (auf Zwischensumme).
          </p>
          <p>
            <strong>Aufbewahrung:</strong> Diese Quittung dient als steuerlicher Beleg. Bitte
            aufbewahren.
          </p>
        </section>
      </div>
    </div>
  );
}

function Line({ label, cents }: { label: string; cents: number }) {
  return (
    <tr className="border-b border-[#ddd]">
      <td className="py-2">{label}</td>
      <td className="py-2 text-right font-mono">{formatEuro(cents)}</td>
    </tr>
  );
}
