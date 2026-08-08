import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Download,
  Info,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { formatEuro, nightsBetween } from "@/lib/pricing";
import { formatDateLong, toLocalIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Euer Angebot · Wiesenhütte",
  description:
    "Unverbindliches Angebot für einen Aufenthalt in der Wiesenhütte — mit eingefrorener Preis-Kalkulation.",
  // Token-Seiten gehören nicht in den Google-Index
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

// Personen-Zusammenfassung, z. B. "20 Erwachsene · 4 Lehrkräfte"
const describePersons = (o: {
  adults: number;
  children: number;
  pupils: number;
  teachers: number;
}): string =>
  [
    o.adults > 0 && `${o.adults} Erwachsene`,
    o.children > 0 && `${o.children} Kinder (4–15 J.)`,
    o.pupils > 0 && `${o.pupils} Schüler`,
    o.teachers > 0 && `${o.teachers} Lehrkräfte`,
  ]
    .filter(Boolean)
    .join(" · ");

export default async function AngebotTokenPage({ params }: Props) {
  const { token } = await params;
  // Token-Format: 48 Hex-Zeichen (randomBytes(24)) — alles andere ist kein Angebot
  if (!/^[a-f0-9]{48}$/.test(token)) notFound();

  // Views atomar hochzählen und Angebot im selben Statement laden
  const rows = await db
    .update(offers)
    .set({ views: sql`${offers.views} + 1` })
    .where(eq(offers.token, token))
    .returning();
  const offer = rows[0];
  if (!offer) notFound();

  const todayIso = toLocalIso(new Date());
  const expired = offer.validUntil < todayIso;
  const nights = nightsBetween(offer.arrival, offer.departure);
  const totalPersons = offer.adults + offer.children + offer.pupils + offer.teachers;
  const totalCents = offer.subtotalCents + offer.kurtaxeCents + offer.depositCents;
  const pdfUrl = `/api/angebot/${offer.token}/pdf`;
  const bookingUrl =
    `/buchen?arrival=${offer.arrival}&departure=${offer.departure}` +
    `&adults=${offer.adults}&children=${offer.children}` +
    `&pupils=${offer.pupils}&teachers=${offer.teachers}`;

  return (
    <div className="bg-[var(--color-wh-snow)]">
      {/* HERO */}
      <section className="px-6 sm:px-8 pt-16 sm:pt-24 pb-8">
        <div className="max-w-[820px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[var(--color-wh-deep-green)]">
            <BadgeCheck size={15} aria-hidden />
            Unverbindliches Angebot — vorbehaltlich Verfügbarkeit
          </div>
          <h1 className="text-[34px] sm:text-[52px] leading-[1.04] mt-4 mb-4">
            Euer Angebot für die Wiesenhütte.
          </h1>
          {(offer.institution || offer.contactName || offer.purpose) && (
            <p className="text-[15px] text-[var(--color-wh-fg-muted)] m-0">
              {[
                offer.purpose,
                offer.institution,
                offer.contactName && `z. Hd. ${offer.contactName}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {/* Gültigkeits-Badge */}
          <div className="mt-5">
            {expired ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wh-sand)] border border-[var(--color-wh-winter-grey)] px-4 py-2 text-[13px] font-semibold text-[var(--color-wh-fg-muted)]">
                <Clock size={15} aria-hidden />
                Abgelaufen am {formatDateLong(offer.validUntil)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 px-4 py-2 text-[13px] font-semibold text-[var(--color-wh-deep-green)]">
                <Clock size={15} aria-hidden />
                Gültig bis {formatDateLong(offer.validUntil)}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-8 pb-20">
        <div className="max-w-[820px] mx-auto space-y-4">
          {/* Abgelaufen-Hinweis */}
          {expired && (
            <div className="rounded-[var(--radius-card)] bg-[var(--color-wh-sand)] border border-[var(--color-wh-winter-grey)] p-5 flex items-start gap-3">
              <Info size={18} className="text-[var(--color-wh-wood)] shrink-0 mt-0.5" />
              <div className="text-[14px] leading-relaxed text-[var(--color-wh-black)]">
                Dieses Angebot ist abgelaufen — die Preise können sich inzwischen geändert haben.{" "}
                <Link
                  href="/angebot"
                  className="font-semibold text-[var(--color-wh-deep-green)] underline underline-offset-2 hover:no-underline"
                >
                  Erstellt in 30 Sekunden ein neues Angebot →
                </Link>
              </div>
            </div>
          )}

          {/* Eckdaten */}
          <div className="rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] p-6 sm:p-7">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-wh-fg-muted)]">
                  <CalendarDays size={13} aria-hidden /> Anreise
                </div>
                <div className="font-semibold text-[15px] text-[var(--color-wh-black)] mt-1">
                  {formatDateLong(offer.arrival)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-wh-fg-muted)]">
                  <CalendarDays size={13} aria-hidden /> Abreise
                </div>
                <div className="font-semibold text-[15px] text-[var(--color-wh-black)] mt-1">
                  {formatDateLong(offer.departure)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-wh-fg-muted)]">
                  <Users size={13} aria-hidden /> Belegung
                </div>
                <div className="font-semibold text-[15px] text-[var(--color-wh-black)] mt-1">
                  {totalPersons} Personen · {nights} Nächte
                </div>
                <div className="text-[12.5px] text-[var(--color-wh-fg-muted)] mt-0.5">
                  {describePersons(offer)}
                </div>
              </div>
            </div>
          </div>

          {/* Positionstabelle */}
          <div className="rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] p-6 sm:p-7">
            <h2 className="text-[19px] sm:text-[22px] m-0 mb-4">Eure Kalkulation</h2>
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[var(--color-wh-fg-muted)]">
                  <th className="font-semibold pb-2 border-b border-[var(--color-wh-black)]">
                    Position
                  </th>
                  <th className="font-semibold pb-2 border-b border-[var(--color-wh-black)] text-right">
                    Betrag
                  </th>
                </tr>
              </thead>
              <tbody>
                {offer.lineItems.map((li, i) => (
                  <tr key={i} className="border-b border-[var(--color-wh-winter-grey)]">
                    <td className="py-2.5 pr-4 text-[var(--color-wh-black)]">{li.label}</td>
                    <td className="py-2.5 text-right tabular-nums whitespace-nowrap">
                      {formatEuro(li.totalCents)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 font-semibold text-[var(--color-wh-black)]">Zwischensumme</td>
                  <td className="pt-3 text-right font-semibold tabular-nums whitespace-nowrap text-[17px] text-[var(--color-wh-deep-green)]">
                    {formatEuro(offer.subtotalCents)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Separat: Kaution + Kurtaxe */}
            <div className="mt-5 rounded-xl bg-[var(--color-wh-beige)]/50 border border-[var(--color-wh-winter-grey)] p-4 space-y-2.5">
              <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-wh-fg-muted)] m-0">
                Kommt separat dazu
              </p>
              <div className="flex items-baseline justify-between gap-4 text-[14.5px]">
                <span className="text-[var(--color-wh-black)]">
                  Kaution{" "}
                  <span className="text-[var(--color-wh-fg-muted)]">
                    — Erstattung nach mangelfreier Abreise
                  </span>
                </span>
                <span className="tabular-nums whitespace-nowrap">
                  {formatEuro(offer.depositCents)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-[14.5px]">
                <span className="text-[var(--color-wh-black)]">
                  Kurtaxe Hochsauerland{" "}
                  <span className="text-[var(--color-wh-fg-muted)]">
                    — ab 16 J., wird an die Kurverwaltung Winterberg abgeführt
                  </span>
                </span>
                <span className="tabular-nums whitespace-nowrap">
                  {formatEuro(offer.kurtaxeCents)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-[14.5px] pt-2 border-t border-[var(--color-wh-winter-grey)] font-semibold">
                <span>Gesamt inkl. Kaution & Kurtaxe</span>
                <span className="tabular-nums whitespace-nowrap">{formatEuro(totalCents)}</span>
              </div>
            </div>

            <p className="text-[12.5px] text-[var(--color-wh-fg-muted)] m-0 mt-4 leading-relaxed">
              Unverbindliches Angebot — vorbehaltlich Verfügbarkeit. Die Kalkulation wurde am{" "}
              {formatDateLong(offer.createdAt)} mit den aktuellen Tarifen eingefroren und gilt bis{" "}
              {formatDateLong(offer.validUntil)}. Es entsteht keine Reservierung.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!expired && (
              <Link
                href={bookingUrl}
                className="inline-flex items-center gap-2 h-14 px-8 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold text-[16px] hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
              >
                Jetzt verbindlich buchen <ArrowRight size={19} />
              </Link>
            )}
            <a
              href={pdfUrl}
              className="inline-flex items-center gap-2 h-14 px-8 rounded-[var(--radius-btn)] border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] font-semibold text-[16px] hover:bg-[var(--color-wh-green-soft)] transition-colors"
            >
              <Download size={19} /> Als PDF
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
