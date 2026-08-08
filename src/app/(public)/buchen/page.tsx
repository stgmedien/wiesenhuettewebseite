import Link from "next/link";
import { BookingFlow } from "./BookingFlow";
import { getBookingBlocks } from "@/lib/availability";
import { getBookingPrefill } from "./actions";
import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { RULES } from "@/lib/pricing";
import { toLocalIso } from "@/lib/utils";

const PAGE_COPY: Record<Locale, { eyebrow: string; h1: string; lead: string; loggedIn: string; member: string; pricesLink: string }> = {
  de: {
    eyebrow: "Buchen",
    h1: "Wann kommt ihr?",
    lead: "Mindestaufenthalt 2 Nächte, maximal 33 Personen. Buchungen unter 15 Personen werden zum Preisniveau von 15 Personen abgerechnet. Preise und Pauschalen werden live berechnet.",
    loggedIn: "Eingeloggt als",
    member: "Mitglied",
    pricesLink: "Preise & Rechenbeispiele ansehen",
  },
  en: {
    eyebrow: "Book",
    h1: "When are you coming?",
    lead: "Minimum stay 2 nights, maximum 33 guests. Bookings below 15 guests are billed at the 15-guest price level. Prices and flat-rates are calculated live.",
    loggedIn: "Signed in as",
    member: "Member",
    pricesLink: "See prices & example calculations",
  },
  nl: {
    eyebrow: "Boeken",
    h1: "Wanneer komen jullie?",
    lead: "Minimaal 2 nachten, maximaal 33 personen. Boekingen onder 15 personen worden afgerekend op het prijsniveau van 15 personen. Prijzen en pakketten worden live berekend.",
    loggedIn: "Ingelogd als",
    member: "Lid",
    pricesLink: "Bekijk prijzen & rekenvoorbeelden",
  },
};

export const metadata = { title: "Buchen · Wiesenhütte" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    repeat?: string;
    // Prefill-Vertrag (z. B. vom Preis-Schnellcheck der Startseite):
    // arrival/departure als YYYY-MM-DD, Personen als Ganzzahlen.
    arrival?: string;
    departure?: string;
    adults?: string;
    children?: string;
    pupils?: string;
    teachers?: string;
  }>;
};

export default async function BuchenPage({ searchParams }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 720); // ~2 years out

  // Unabhängige Calls parallel — vorher seriell (getBookingBlocks blockte
  // getBookingPrefill). getBookingBlocks ist zusätzlich gecacht (Tag
  // "booking-blocks"), Folge-Aufrufe sind damit nahezu sofort.
  const [{ booked, cleaning, wartung }, prefill] = await Promise.all([
    getBookingBlocks(today, horizon),
    getBookingPrefill(),
  ]);

  // Re-Book: gleiche Personenzahl, +1 Jahr Datum
  const sp = await searchParams;
  let repeatHint:
    | { adults: number; members: number; children: number; pupils: number; teachers: number; soloUse: boolean; arrival: string; departure: string }
    | undefined = undefined;
  if (sp.repeat && prefill.loggedIn) {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      const customerRow = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      const customer = customerRow[0];
      if (customer) {
        const found = await db
          .select()
          .from(bookings)
          .where(and(eq(bookings.id, sp.repeat), eq(bookings.customerId, customer.id)))
          .limit(1);
        const b = found[0];
        if (b) {
          const plusYear = (iso: string) => {
            const d = new Date(iso);
            d.setFullYear(d.getFullYear() + 1);
            return d.toISOString().slice(0, 10);
          };
          repeatHint = {
            adults: b.adults,
            members: b.members,
            children: b.children,
            pupils: b.pupils,
            teachers: b.teachers,
            soloUse: b.soloUse,
            arrival: plusYear(b.arrival),
            departure: plusYear(b.departure),
          };
        }
      }
    }
  }

  // Prefill via Query-Params (z. B. vom Preis-Schnellcheck der Startseite):
  // arrival/departure + adults/children/pupils/teachers. Datum und Personen
  // werden UNABHÄNGIG validiert und nur bei validen Werten übernommen — so
  // füllt z. B. eine gültige Personenzahl auch dann vor, wenn das Datum
  // kaputt oder abgelaufen ist. repeat= hat Vorrang (kompletteres Prefill).
  if (!repeatHint) {
    const todayIso = toLocalIso(today);
    const isIsoDate = (s: string | undefined): s is string =>
      !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());
    const nightsBetween = (a: string, d: string) =>
      Math.round(
        (new Date(`${d}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000
      );
    const datesOk =
      isIsoDate(sp.arrival) &&
      isIsoDate(sp.departure) &&
      sp.arrival >= todayIso &&
      nightsBetween(sp.arrival, sp.departure) >= RULES.minNights;

    // Personen: fehlende Params zählen als 0; ein einziger kaputter Wert
    // macht die ganze Personen-Gruppe ungültig (kein Rate-Prefill).
    const parseCount = (s: string | undefined): number => {
      if (s === undefined) return 0;
      return /^\d{1,2}$/.test(s) ? Number(s) : NaN;
    };
    const qp = {
      adults: parseCount(sp.adults),
      children: parseCount(sp.children),
      pupils: parseCount(sp.pupils),
      teachers: parseCount(sp.teachers),
    };
    const qpTotal = qp.adults + qp.children + qp.pupils + qp.teachers;
    const personsOk =
      Number.isInteger(qpTotal) && qpTotal >= 1 && qpTotal <= RULES.maxPersons;

    if (datesOk || personsOk) {
      repeatHint = {
        adults: personsOk ? qp.adults : 0,
        members: 0,
        children: personsOk ? qp.children : 0,
        pupils: personsOk ? qp.pupils : 0,
        teachers: personsOk ? qp.teachers : 0,
        soloUse: false,
        arrival: datesOk ? sp.arrival! : "",
        departure: datesOk ? sp.departure! : "",
      };
    }
  }

  // Re-Book-Guard: Wenn die +1-Jahr-Daten (teilweise) belegt sind, NICHT
  // vorbefüllen (nur Personen übernehmen) — sonst startet der Gast mit einer
  // bereits gesperrten Auswahl. Gilt genauso für das Query-Param-Prefill.
  if (repeatHint && repeatHint.arrival && repeatHint.departure) {
    const blockedAll = new Set<string>([...booked, ...cleaning, ...wartung]);
    let anyBlocked = false;
    const cur = new Date(`${repeatHint.arrival}T00:00:00Z`);
    const end = new Date(`${repeatHint.departure}T00:00:00Z`);
    while (cur < end) {
      if (blockedAll.has(cur.toISOString().slice(0, 10))) {
        anyBlocked = true;
        break;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    if (anyBlocked) {
      repeatHint = { ...repeatHint, arrival: "", departure: "" };
    }
  }

  const locale = await getServerLocale();
  const pc = PAGE_COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-screen px-5 sm:px-8 py-10 sm:py-16 overflow-x-clip">
      <div className="max-w-[1080px] mx-auto">
        <div className="eyebrow">{pc.eyebrow}</div>
        <h1 className="text-[36px] sm:text-[56px] mt-4 mb-2 leading-tight">{pc.h1}</h1>
        <p className="text-[var(--color-wh-fg-muted)] text-[16px] sm:text-[18px] max-w-xl mt-4 leading-relaxed">{pc.lead}</p>
        <Link
          href="/preise"
          className="inline-flex items-center gap-1.5 mt-3 text-[15px] font-semibold text-[var(--color-wh-deep-green)] hover:underline"
        >
          {pc.pricesLink} →
        </Link>
        {prefill.loggedIn && (
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl sm:rounded-full bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)]/40 px-4 py-2 text-sm max-w-full">
            <span className="text-[var(--color-wh-deep-green)] shrink-0">●</span>
            <span className="break-all">
              {pc.loggedIn} <strong>{prefill.email}</strong>
            </span>
            {prefill.membershipVerified && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shrink-0">
                {pc.member}
              </span>
            )}
          </div>
        )}
        <div className="mt-12">
          <BookingFlow
            bookedDates={Array.from(booked)}
            cleaningDates={Array.from(cleaning)}
            wartungDates={Array.from(wartung)}
            prefill={prefill}
            repeatHint={repeatHint}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
