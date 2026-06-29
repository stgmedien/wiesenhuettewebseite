import Link from "next/link";
import { Mountain, Users, Sparkles, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import {
  PRICES,
  RULES,
  CANCELLATION_TIERS,
  calculatePrice,
  formatEuro,
  type Persons,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preise & Tarife · Wiesenhütte",
  description:
    "Was kostet die Wiesenhütte? Transparente Übernachtungspreise (Mitglieder −50 %), Endreinigung und Kaution — mit echten Rechenbeispielen für Vereine, Schulklassen und Familienfeiern.",
};

// --- Rechenbeispiele: über die echte Pricing-Engine berechnet, damit die
// Zahlen exakt dem Buchungstool entsprechen. ----------------------------------
const emptyPersons: Persons = { adults: 0, members: 0, children: 0, pupils: 0, teachers: 0 };

type Example = {
  key: string;
  persons: Partial<Persons>;
  arrival: string;
  departure: string;
  title: Record<Locale, string>;
  who: Record<Locale, string>;
};

const EXAMPLES: Example[] = [
  {
    key: "verein",
    persons: { members: 15 },
    arrival: "2026-09-04",
    departure: "2026-09-06", // 2 Nächte
    title: { de: "Vereins-Wochenende", en: "Club weekend", nl: "Verenigingsweekend" },
    who: {
      de: "15 Mitglieder · 2 Nächte",
      en: "15 members · 2 nights",
      nl: "15 leden · 2 nachten",
    },
  },
  {
    key: "gruppe",
    persons: { adults: 20 },
    arrival: "2026-09-04",
    departure: "2026-09-06", // 2 Nächte
    title: { de: "Gruppe / Freundeskreis", en: "Group of friends", nl: "Vriendengroep" },
    who: {
      de: "20 Erwachsene (keine Mitglieder) · 2 Nächte",
      en: "20 adults (non-members) · 2 nights",
      nl: "20 volwassenen (geen leden) · 2 nachten",
    },
  },
  {
    key: "schule",
    persons: { children: 26, teachers: 4 },
    arrival: "2026-09-07",
    departure: "2026-09-11", // 4 Nächte
    title: { de: "Schulklasse", en: "School class", nl: "Schoolklas" },
    who: {
      de: "26 Kinder + 4 Lehrkräfte · 4 Nächte",
      en: "26 children + 4 teachers · 4 nights",
      nl: "26 kinderen + 4 leerkrachten · 4 nachten",
    },
  },
  {
    key: "klein",
    persons: { adults: 10 },
    arrival: "2026-09-04",
    departure: "2026-09-06", // 2 Nächte, < 15 → Aufschlag sichtbar
    title: { de: "Kleine Feier (unter 15)", en: "Small celebration (under 15)", nl: "Klein feest (onder 15)" },
    who: {
      de: "10 Erwachsene · 2 Nächte",
      en: "10 adults · 2 nights",
      nl: "10 volwassenen · 2 nachten",
    },
  },
];

type Copy = {
  eyebrow: string;
  h1: string;
  lead: string;
  ratesHeading: string;
  rates: { label: string; price: string; sub: string }[];
  flatHeading: string;
  flats: { label: string; value: string; note: string }[];
  includedHeading: string;
  included: string[];
  examplesHeading: string;
  examplesLead: string;
  perPersonNight: string;
  plusDeposit: string;
  surchargeNote: string;
  memberHeading: string;
  memberBody: string;
  memberCta: string;
  cancelHeading: string;
  cancelIntro: string;
  cancelRows: { when: string; fee: string }[];
  cancelFoot: string;
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
  perPersonTotal: string;
};

const e = (cents: number, l: Locale) => formatEuro(cents, l);

const COPY: Record<Locale, Copy> = {
  de: {
    eyebrow: "Klar & ohne Überraschungen",
    h1: "Was die Wiesenhütte kostet.",
    lead: "Ihr zahlt pro Person und Nacht — Vereinsmitglieder die Hälfte. Dazu kommt einmalig die Endreinigung. Keine versteckten Kosten, keine Energiezuschläge. Hier ist alles auf einen Blick.",
    ratesHeading: "Übernachtung — pro Person & Nacht",
    rates: [
      { label: "Erwachsene", price: e(PRICES.adultNonMemberCents, "de"), sub: "ab 16 Jahren, inkl. Lehrkräfte" },
      { label: "Erwachsene · Mitglied", price: e(PRICES.adultMemberCents, "de"), sub: "Vereinsmitglieder −50 %" },
      { label: "Kinder & Schüler", price: e(PRICES.childCents, "de"), sub: "bis 16 Jahre" },
      { label: "Kinder & Schüler · Mitglied", price: e(PRICES.pupilCents, "de"), sub: "bis 16 Jahre, Mitglieder −50 %" },
    ],
    flatHeading: "Einmalig pro Buchung",
    flats: [
      { label: "Endreinigung", value: e(PRICES.cleaningCents, "de"), note: "Pflicht — ihr reist entspannt ab." },
      { label: "Kaution", value: e(PRICES.depositCents, "de"), note: "Wird nach dem Aufenthalt zurückerstattet." },
    ],
    includedHeading: "Im Preis enthalten",
    included: [
      "Energie & Heizung — seit 2026 ohne Zuschlag",
      "Voll ausgestattete Selbstversorger-Küche",
      "33 Schlafplätze in 5 Zimmern",
      "Aufenthaltsräume, Skikeller, Feuerstelle",
    ],
    examplesHeading: "So rechnet sich das",
    examplesLead:
      "Vier typische Belegungen, mit der gleichen Logik wie im Buchungstool gerechnet. Die Kaution (rückzahlbar) ist separat.",
    perPersonNight: "pro Person & Nacht",
    plusDeposit: "zzgl. {x} Kaution (zurück)",
    surchargeNote:
      "Enthält den Mindestbelegungs-Aufschlag: Wir rechnen mindestens mit 15 Personen — kleinere Gruppen sind willkommen, zahlen aber den Aufschlag.",
    memberHeading: "Mitglied werden lohnt sich",
    memberBody:
      "Als Vereinsmitglied zahlt ihr pro Übernachtung nur die Hälfte. Schon ab der zweiten Buchung kann sich der Jahresbeitrag rechnen — und ihr unterstützt die Hütte.",
    memberCta: "Mitglied werden",
    cancelHeading: "Stornobedingungen",
    cancelIntro: "Je nach Zeitpunkt der Stornierung (vom Buchungsbetrag ohne Kaution):",
    cancelRows: [
      { when: "mehr als 30 Tage vorher", fee: "kostenlos" },
      { when: "30 – 14 Tage vorher", fee: "30 %" },
      { when: "13 – 7 Tage vorher", fee: "60 %" },
      { when: "weniger als 7 Tage vorher", fee: "90 %" },
    ],
    cancelFoot: "Es gilt der Eingang der Stornierung. Details in den AGB.",
    ctaHeading: "Euren genauen Preis seht ihr in 30 Sekunden.",
    ctaBody:
      "Zeitraum und Personen wählen — das Buchungstool zeigt sofort die exakte Aufstellung, noch bevor irgendetwas verbindlich ist.",
    ctaButton: "Preis berechnen & Verfügbarkeit prüfen",
    perPersonTotal: "≈ {x} pro Person gesamt",
  },
  en: {
    eyebrow: "Clear & no surprises",
    h1: "What the Wiesenhütte costs.",
    lead: "You pay per person and night — club members pay half. Plus a one-off final cleaning. No hidden costs, no energy surcharges. Here is everything at a glance.",
    ratesHeading: "Overnight — per person & night",
    rates: [
      { label: "Adults", price: e(PRICES.adultNonMemberCents, "en"), sub: "16+, incl. teachers" },
      { label: "Adults · member", price: e(PRICES.adultMemberCents, "en"), sub: "club members −50%" },
      { label: "Children & pupils", price: e(PRICES.childCents, "en"), sub: "up to 16" },
      { label: "Children & pupils · member", price: e(PRICES.pupilCents, "en"), sub: "up to 16, members −50%" },
    ],
    flatHeading: "Once per booking",
    flats: [
      { label: "Final cleaning", value: e(PRICES.cleaningCents, "en"), note: "Mandatory — you leave relaxed." },
      { label: "Deposit", value: e(PRICES.depositCents, "en"), note: "Refunded after your stay." },
    ],
    includedHeading: "Included in the price",
    included: [
      "Energy & heating — no surcharge since 2026",
      "Fully equipped self-catering kitchen",
      "33 beds in 5 rooms",
      "Lounges, ski cellar, fire pit",
    ],
    examplesHeading: "How it adds up",
    examplesLead:
      "Four typical bookings, calculated with the same logic as the booking tool. The (refundable) deposit is separate.",
    perPersonNight: "per person & night",
    plusDeposit: "plus {x} deposit (refunded)",
    surchargeNote:
      "Includes the minimum-occupancy surcharge: we bill for at least 15 guests — smaller groups are welcome but pay the surcharge.",
    memberHeading: "Membership pays off",
    memberBody:
      "As a club member you pay only half per night. The annual fee can pay for itself from the second booking — and you support the cabin.",
    memberCta: "Become a member",
    cancelHeading: "Cancellation terms",
    cancelIntro: "Depending on when you cancel (of the booking amount, excl. deposit):",
    cancelRows: [
      { when: "more than 30 days before", fee: "free" },
      { when: "30 – 14 days before", fee: "30%" },
      { when: "13 – 7 days before", fee: "60%" },
      { when: "less than 7 days before", fee: "90%" },
    ],
    cancelFoot: "The date the cancellation is received applies. Details in the terms.",
    ctaHeading: "See your exact price in 30 seconds.",
    ctaBody:
      "Pick your dates and guests — the booking tool shows the exact breakdown before anything is binding.",
    ctaButton: "Calculate price & check availability",
    perPersonTotal: "≈ {x} per person total",
  },
  nl: {
    eyebrow: "Helder & zonder verrassingen",
    h1: "Wat de Wiesenhütte kost.",
    lead: "Je betaalt per persoon per nacht — leden de helft. Daarbij komt eenmalig de eindschoonmaak. Geen verborgen kosten, geen energietoeslagen. Hier is alles in één oogopslag.",
    ratesHeading: "Overnachting — per persoon & nacht",
    rates: [
      { label: "Volwassenen", price: e(PRICES.adultNonMemberCents, "nl"), sub: "vanaf 16, incl. leerkrachten" },
      { label: "Volwassenen · lid", price: e(PRICES.adultMemberCents, "nl"), sub: "leden −50%" },
      { label: "Kinderen & leerlingen", price: e(PRICES.childCents, "nl"), sub: "tot 16 jaar" },
      { label: "Kinderen & leerlingen · lid", price: e(PRICES.pupilCents, "nl"), sub: "tot 16, leden −50%" },
    ],
    flatHeading: "Eenmalig per boeking",
    flats: [
      { label: "Eindschoonmaak", value: e(PRICES.cleaningCents, "nl"), note: "Verplicht — jullie vertrekken ontspannen." },
      { label: "Borg", value: e(PRICES.depositCents, "nl"), note: "Wordt na het verblijf terugbetaald." },
    ],
    includedHeading: "Inbegrepen in de prijs",
    included: [
      "Energie & verwarming — sinds 2026 zonder toeslag",
      "Volledig uitgeruste zelfverzorgingskeuken",
      "33 slaapplaatsen in 5 kamers",
      "Verblijfsruimtes, skikelder, vuurplaats",
    ],
    examplesHeading: "Zo telt het op",
    examplesLead:
      "Vier typische boekingen, berekend met dezelfde logica als de boekingstool. De (terugbetaalbare) borg staat los.",
    perPersonNight: "per persoon & nacht",
    plusDeposit: "plus {x} borg (terug)",
    surchargeNote:
      "Inclusief de toeslag minimale bezetting: we rekenen met minimaal 15 personen — kleinere groepen zijn welkom maar betalen de toeslag.",
    memberHeading: "Lid worden loont",
    memberBody:
      "Als lid betaal je per overnachting maar de helft. Vanaf de tweede boeking kan de jaarbijdrage zich terugverdienen — en je steunt de hut.",
    memberCta: "Lid worden",
    cancelHeading: "Annuleringsvoorwaarden",
    cancelIntro: "Afhankelijk van het moment van annuleren (van het boekingsbedrag, excl. borg):",
    cancelRows: [
      { when: "meer dan 30 dagen vooraf", fee: "gratis" },
      { when: "30 – 14 dagen vooraf", fee: "30%" },
      { when: "13 – 7 dagen vooraf", fee: "60%" },
      { when: "minder dan 7 dagen vooraf", fee: "90%" },
    ],
    cancelFoot: "De datum van ontvangst van de annulering geldt. Details in de voorwaarden.",
    ctaHeading: "Je exacte prijs zie je in 30 seconden.",
    ctaBody:
      "Kies periode en personen — de boekingstool toont meteen de exacte berekening, nog voordat iets bindend is.",
    ctaButton: "Prijs berekenen & beschikbaarheid checken",
    perPersonTotal: "≈ {x} per persoon totaal",
  },
};

export default async function PreisePage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  // Beispiele live berechnen
  const computed = EXAMPLES.map((ex) => {
    const persons: Persons = { ...emptyPersons, ...ex.persons };
    const totalGuests =
      persons.adults + persons.members + persons.children + persons.pupils + persons.teachers;
    const b = calculatePrice({
      persons,
      arrival: ex.arrival,
      departure: ex.departure,
      soloUse: false,
      locale,
    });
    return {
      ...ex,
      breakdown: b,
      totalGuests,
      hasSurcharge: b.minOccupancySurchargeCents > 0,
    };
  });

  return (
    <div className="bg-[var(--color-wh-snow)]">
      {/* HERO */}
      <section className="px-6 sm:px-8 pt-16 sm:pt-24 pb-10">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[var(--color-wh-deep-green)]">
            <Mountain size={15} aria-hidden />
            {c.eyebrow}
          </div>
          <h1 className="text-[36px] sm:text-[56px] leading-[1.04] mt-4 mb-5">{c.h1}</h1>
          <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl mx-auto m-0">
            {c.lead}
          </p>
        </div>
      </section>

      {/* TARIFE */}
      <section className="px-6 sm:px-8 py-8">
        <div className="max-w-[1080px] mx-auto">
          <h2 className="text-[22px] sm:text-[26px] mb-5">{c.ratesHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.rates.map((r, i) => (
              <div
                key={r.label}
                className={`rounded-[var(--radius-card)] border p-5 flex flex-col ${
                  i % 2 === 1
                    ? "bg-[var(--color-wh-green-soft)] border-[var(--color-wh-green)]/40"
                    : "bg-white border-[var(--color-wh-winter-grey)]"
                }`}
              >
                <div className="text-sm font-semibold text-[var(--color-wh-black)] min-h-[40px]">{r.label}</div>
                <div className="text-[32px] font-display leading-none mt-2 text-[var(--color-wh-deep-green)]">
                  {r.price}
                </div>
                <div className="text-xs text-[var(--color-wh-fg-muted)] mt-1">{c.perPersonNight}</div>
                <div className="text-[13px] text-[var(--color-wh-fg-muted)] mt-3 pt-3 border-t border-[var(--color-wh-winter-grey)]">
                  {r.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Pauschalen + Inklusivleistungen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] p-6">
              <h3 className="text-[17px] font-semibold m-0 mb-4">{c.flatHeading}</h3>
              <ul className="list-none p-0 m-0 space-y-3">
                {c.flats.map((f) => (
                  <li key={f.label} className="flex items-baseline justify-between gap-4">
                    <div>
                      <div className="font-medium text-[var(--color-wh-black)]">{f.label}</div>
                      <div className="text-[13px] text-[var(--color-wh-fg-muted)]">{f.note}</div>
                    </div>
                    <div className="text-[20px] font-display text-[var(--color-wh-deep-green)] shrink-0">
                      {f.value}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] p-6">
              <h3 className="text-[17px] font-semibold m-0 mb-4 flex items-center gap-2">
                <Sparkles size={17} className="text-[var(--color-wh-deep-green)]" /> {c.includedHeading}
              </h3>
              <ul className="list-none p-0 m-0 space-y-2.5">
                {c.included.map((it) => (
                  <li key={it} className="flex items-start gap-2.5 text-[15px] text-[var(--color-wh-black)]">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--color-wh-green)] shrink-0" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* RECHENBEISPIELE */}
      <section className="px-6 sm:px-8 py-12">
        <div className="max-w-[1080px] mx-auto">
          <h2 className="text-[22px] sm:text-[26px] mb-2">{c.examplesHeading}</h2>
          <p className="text-[15px] text-[var(--color-wh-fg-muted)] max-w-2xl m-0 mb-6">{c.examplesLead}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {computed.map((ex) => {
              const perPersonTotal =
                ex.totalGuests > 0 ? Math.round(ex.breakdown.subtotalCents / ex.totalGuests) : 0;
              return (
                <div
                  key={ex.key}
                  className="rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] p-6"
                >
                  <div className="flex items-center gap-2 text-[var(--color-wh-deep-green)]">
                    <Users size={16} aria-hidden />
                    <span className="font-semibold">{ex.title[locale]}</span>
                  </div>
                  <div className="text-[13px] text-[var(--color-wh-fg-muted)] mt-1">{ex.who[locale]}</div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-[34px] font-display leading-none text-[var(--color-wh-black)]">
                      {formatEuro(ex.breakdown.subtotalCents, locale)}
                    </span>
                  </div>
                  <div className="text-[13px] text-[var(--color-wh-fg-muted)] mt-1">
                    {c.perPersonTotal.replace("{x}", formatEuro(perPersonTotal, locale))} ·{" "}
                    {c.plusDeposit.replace("{x}", formatEuro(ex.breakdown.depositCents, locale))}
                  </div>

                  {ex.hasSurcharge && (
                    <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-card)] bg-[var(--color-wh-sand)] border border-[var(--color-wh-winter-grey)] p-3 text-[12.5px] leading-relaxed text-[var(--color-wh-fg-muted)]">
                      <Info size={15} className="text-[var(--color-wh-wood)] shrink-0 mt-0.5" />
                      <span>{c.surchargeNote}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MITGLIEDSCHAFT */}
      <section className="px-6 sm:px-8 pb-12">
        <div className="max-w-[1080px] mx-auto">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] p-7 sm:p-9">
            <h2 className="text-[22px] sm:text-[26px] m-0 mb-2 text-[var(--color-wh-snow)]">{c.memberHeading}</h2>
            <p className="m-0 text-[15px] leading-relaxed text-[var(--color-wh-snow)]/85">
              {c.memberBody}{" "}
              <Link
                href="/verein"
                className="text-[var(--color-wh-snow)] underline underline-offset-2 hover:no-underline"
              >
                {c.memberCta} →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* STORNO */}
      <section className="px-6 sm:px-8 pb-12">
        <div className="max-w-[760px] mx-auto rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] p-6 sm:p-7">
          <h2 className="text-[19px] sm:text-[22px] m-0 mb-1 flex items-center gap-2">
            <ShieldCheck size={19} className="text-[var(--color-wh-deep-green)]" /> {c.cancelHeading}
          </h2>
          <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-4">{c.cancelIntro}</p>
          <ul className="list-none p-0 m-0 divide-y divide-[var(--color-wh-winter-grey)]">
            {c.cancelRows.map((row) => (
              <li key={row.when} className="flex items-center justify-between py-2.5 text-[15px]">
                <span className="text-[var(--color-wh-black)]">{row.when}</span>
                <span className="font-semibold text-[var(--color-wh-deep-green)]">{row.fee}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] text-[var(--color-wh-fg-muted)] m-0 mt-4">{c.cancelFoot}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-8 pb-20">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-[26px] sm:text-[34px] leading-tight m-0 mb-3">{c.ctaHeading}</h2>
          <p className="text-[15px] sm:text-[16px] text-[var(--color-wh-fg-muted)] max-w-xl mx-auto m-0 mb-6">
            {c.ctaBody}
          </p>
          <Link
            href="/buchen"
            className="inline-flex items-center gap-2 h-14 px-8 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold text-[16px] hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
          >
            {c.ctaButton} <ArrowRight size={19} />
          </Link>
          <p className="text-[12px] text-[var(--color-wh-fg-muted)] mt-4 m-0">
            {RULES.minNights} {locale === "en" ? "nights minimum" : locale === "nl" ? "nachten minimum" : "Nächte Mindestaufenthalt"} ·{" "}
            {locale === "en"
              ? "billed from 15 guests"
              : locale === "nl"
                ? "afgerekend vanaf 15 personen"
                : "Abrechnung ab 15 Personen"}
          </p>
        </div>
      </section>
    </div>
  );
}
