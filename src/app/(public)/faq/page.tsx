import Link from "next/link";
import { HelpCircle, ChevronDown, ArrowRight } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Häufige Fragen · Wiesenhütte",
  description:
    "Antworten auf die häufigsten Fragen zur Wiesenhütte: Belegung, Preise, Bettwäsche, Anreise & Schlüssel, Bezahlung, Stornierung und Haustiere.",
};

type QA = { q: Record<Locale, string>; a: Record<Locale, string> };

// Inhaltlich aus Hausordnung, AGB, /huette, /kontakt und der Pricing-Engine
// hergeleitet — keine erfundenen Regeln.
const FAQS: QA[] = [
  {
    q: {
      de: "Für wie viele Personen ist die Hütte geeignet?",
      en: "How many people does the cabin sleep?",
      nl: "Voor hoeveel personen is de hut geschikt?",
    },
    a: {
      de: "Die Wiesenhütte hat 33 Schlafplätze in 5 Zimmern (max. 33 Personen). Abgerechnet wird ab 15 Personen — kleinere Gruppen sind willkommen, zahlen aber einen Mindestbelegungs-Aufschlag.",
      en: "The Wiesenhütte sleeps 33 in 5 rooms (max. 33 guests). Billing starts at 15 guests — smaller groups are welcome but pay a minimum-occupancy surcharge.",
      nl: "De Wiesenhütte heeft 33 slaapplaatsen in 5 kamers (max. 33 personen). Afrekening vanaf 15 personen — kleinere groepen zijn welkom maar betalen een toeslag minimale bezetting.",
    },
  },
  {
    q: {
      de: "Was kostet eine Übernachtung?",
      en: "What does a night cost?",
      nl: "Wat kost een overnachting?",
    },
    a: {
      de: "Pro Person und Nacht — Vereinsmitglieder zahlen die Hälfte. Dazu kommt einmalig die Endreinigung (190 €) sowie eine Kaution (300 €), die nach dem Aufenthalt zurückerstattet wird. Energie ist im Preis enthalten. Alle Tarife und Rechenbeispiele findest Du auf der Preis-Seite.",
      en: "Per person and night — club members pay half. Plus a one-off final cleaning (€190) and a deposit (€300) that is refunded after your stay. Energy is included. All rates and examples are on the prices page.",
      nl: "Per persoon per nacht — leden betalen de helft. Daarbij eenmalig de eindschoonmaak (€190) en een borg (€300) die na het verblijf wordt terugbetaald. Energie is inbegrepen. Alle tarieven en voorbeelden staan op de prijspagina.",
    },
  },
  {
    q: {
      de: "Gibt es Bettwäsche? Was muss ich mitbringen?",
      en: "Is bedding provided? What do I bring?",
      nl: "Is er beddengoed? Wat moet ik meenemen?",
    },
    a: {
      de: "Die Hütte stellt nur Kopfkissen (ohne Bezug). Selbst mitzubringen sind: 1 Bettlaken, 1 Kopfkissenbezug und 1 Schlafsack oder eine Decke mit Bezug. Außerdem ratsam: Geschirrtücher und Toilettenpapier für den Anfang.",
      en: "The cabin provides pillows only (without covers). Please bring: 1 fitted sheet, 1 pillowcase and 1 sleeping bag or duvet with cover. Also handy: tea towels and some toilet paper to start.",
      nl: "De hut levert alleen kussens (zonder sloop). Zelf meenemen: 1 hoeslaken, 1 kussensloop en 1 slaapzak of dekbed met overtrek. Handig: theedoeken en wat toiletpapier voor het begin.",
    },
  },
  {
    q: {
      de: "Wie läuft die Anreise und Schlüsselübergabe?",
      en: "How do arrival and key handover work?",
      nl: "Hoe verloopt de aankomst en sleuteloverdracht?",
    },
    a: {
      de: "Stimme Deine genaue Ankunftszeit vorab ab. Hüttenwart Toni Klauke (Vorm Rohrbach 1, gleich um die Ecke) empfängt Dich an der Hütte und übergibt die Schlüssel persönlich. Die Kurkarten erhältst Du vorab automatisch per E-Mail.",
      en: "Arrange your arrival time in advance. Cabin warden Toni Klauke (Vorm Rohrbach 1, just around the corner) welcomes you at the cabin and hands over the keys in person. Your guest cards arrive automatically by email beforehand.",
      nl: "Stem je aankomsttijd vooraf af. Huttenbeheerder Toni Klauke (Vorm Rohrbach 1, om de hoek) ontvangt je bij de hut en overhandigt de sleutels persoonlijk. De kuurkaarten ontvang je vooraf automatisch per e-mail.",
    },
  },
  {
    q: {
      de: "Wie bezahle ich?",
      en: "How do I pay?",
      nl: "Hoe betaal ik?",
    },
    a: {
      de: "Sicher online über Stripe (Kreditkarte oder SEPA-Lastschrift). In der Regel zahlst Du bei der Buchung 50 % an, der Rest wird 14 Tage vor Anreise automatisch eingezogen. Die Kaution (300 €) wird vorgemerkt und nach dem Aufenthalt zurückerstattet.",
      en: "Securely online via Stripe (credit card or SEPA direct debit). Usually you pay 50% on booking, the rest is charged automatically 14 days before arrival. The deposit (€300) is pre-authorised and refunded after your stay.",
      nl: "Veilig online via Stripe (creditcard of SEPA-incasso). Meestal betaal je 50% bij de boeking, de rest wordt 14 dagen voor aankomst automatisch geïncasseerd. De borg (€300) wordt gereserveerd en na het verblijf terugbetaald.",
    },
  },
  {
    q: {
      de: "Kann ich kostenlos stornieren?",
      en: "Can I cancel free of charge?",
      nl: "Kan ik gratis annuleren?",
    },
    a: {
      de: "Bis 30 Tage vor Anreise kostenlos. Danach gestaffelt: 30–14 Tage 30 %, 13–7 Tage 60 %, weniger als 7 Tage 90 % des Buchungsbetrags (ohne Kaution). Maßgeblich ist der Eingang der Stornierung.",
      en: "Free up to 30 days before arrival. After that, tiered: 30–14 days 30%, 13–7 days 60%, less than 7 days 90% of the booking amount (excl. deposit). The date the cancellation is received applies.",
      nl: "Gratis tot 30 dagen voor aankomst. Daarna getrapt: 30–14 dagen 30%, 13–7 dagen 60%, minder dan 7 dagen 90% van het boekingsbedrag (excl. borg). De ontvangstdatum van de annulering geldt.",
    },
  },
  {
    q: {
      de: "Sind Haustiere erlaubt?",
      en: "Are pets allowed?",
      nl: "Zijn huisdieren toegestaan?",
    },
    a: {
      de: "Nein. Laut Hausordnung sind Tiere aller Art zu keiner Zeit in der Hütte erlaubt.",
      en: "No. Per the house rules, animals of any kind are never permitted in the cabin.",
      nl: "Nee. Volgens het huishoudelijk reglement zijn dieren van welke aard dan ook nooit toegestaan in de hut.",
    },
  },
  {
    q: {
      de: "Gibt es einen Mindestaufenthalt?",
      en: "Is there a minimum stay?",
      nl: "Is er een minimumverblijf?",
    },
    a: {
      de: "Ja, der Mindestaufenthalt beträgt 2 Nächte.",
      en: "Yes, the minimum stay is 2 nights.",
      nl: "Ja, het minimumverblijf is 2 nachten.",
    },
  },
  {
    q: {
      de: "Ist die Hütte Selbstverpflegung — gibt es eine Küche?",
      en: "Is it self-catering — is there a kitchen?",
      nl: "Is het zelfverzorging — is er een keuken?",
    },
    a: {
      de: "Ja, die Wiesenhütte ist eine Selbstversorgerhütte mit voll ausgestatteter Küche. Wer nicht selbst kochen möchte, kann Catering über einen Gasthof in der Nähe organisieren.",
      en: "Yes, the Wiesenhütte is self-catering with a fully equipped kitchen. If you'd rather not cook, catering can be arranged via a nearby inn.",
      nl: "Ja, de Wiesenhütte is zelfverzorging met een volledig uitgeruste keuken. Wie liever niet zelf kookt, kan catering regelen via een nabijgelegen gasthof.",
    },
  },
  {
    q: {
      de: "Was ist mit der Kurtaxe?",
      en: "What about the guest tax (Kurtaxe)?",
      nl: "Hoe zit het met de toeristenbelasting (Kurtaxe)?",
    },
    a: {
      de: "Die Kurtaxe wird nicht über die Hütte abgerechnet. Nach der Buchung erhältst Du eine separate E-Mail mit einem Link zum offiziellen Kurtaxen-Portal Hochsauerland.",
      en: "The guest tax is not billed via the cabin. After booking you receive a separate email with a link to the official Hochsauerland guest-tax portal.",
      nl: "De toeristenbelasting loopt niet via de hut. Na de boeking ontvang je een aparte e-mail met een link naar het officiële Hochsauerland-portaal.",
    },
  },
];

type Copy = {
  eyebrow: string;
  h1: string;
  lead: string;
  pricesLink: string;
  ctaHeading: string;
  ctaButton: string;
  contactPrompt: string;
  contactLink: string;
};

const COPY: Record<Locale, Copy> = {
  de: {
    eyebrow: "Gut zu wissen",
    h1: "Häufige Fragen.",
    lead: "Die wichtigsten Antworten rund um eine Buchung der Wiesenhütte — von Bettwäsche bis Schlüsselübergabe.",
    pricesLink: "Zu den Preisen & Tarifen",
    ctaHeading: "Frage beantwortet? Dann schau, wann frei ist.",
    ctaButton: "Verfügbarkeit prüfen",
    contactPrompt: "Noch etwas offen?",
    contactLink: "Schreib uns",
  },
  en: {
    eyebrow: "Good to know",
    h1: "Frequently asked questions.",
    lead: "The key answers around booking the Wiesenhütte — from bedding to key handover.",
    pricesLink: "See prices & rates",
    ctaHeading: "Question answered? See when it's free.",
    ctaButton: "Check availability",
    contactPrompt: "Still something open?",
    contactLink: "Get in touch",
  },
  nl: {
    eyebrow: "Goed om te weten",
    h1: "Veelgestelde vragen.",
    lead: "De belangrijkste antwoorden rond het boeken van de Wiesenhütte — van beddengoed tot sleuteloverdracht.",
    pricesLink: "Naar prijzen & tarieven",
    ctaHeading: "Vraag beantwoord? Kijk wanneer het vrij is.",
    ctaButton: "Beschikbaarheid checken",
    contactPrompt: "Nog iets onduidelijk?",
    contactLink: "Neem contact op",
  },
};

export default async function FaqPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q[locale],
      acceptedAnswer: { "@type": "Answer", text: f.a[locale] },
    })),
  };

  return (
    <div className="bg-[var(--color-wh-snow)]">
      <JsonLd data={faqSchema} />

      <section className="px-6 sm:px-8 pt-16 sm:pt-24 pb-8">
        <div className="max-w-[760px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[var(--color-wh-deep-green)]">
            <HelpCircle size={15} aria-hidden />
            {c.eyebrow}
          </div>
          <h1 className="text-[36px] sm:text-[52px] leading-[1.04] mt-4 mb-5">{c.h1}</h1>
          <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-xl mx-auto m-0">
            {c.lead}
          </p>
          <Link
            href="/preise"
            className="inline-flex items-center gap-1.5 mt-5 text-[15px] font-semibold text-[var(--color-wh-deep-green)] hover:underline"
          >
            {c.pricesLink} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="px-6 sm:px-8 pb-12">
        <div className="max-w-[760px] mx-auto space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 text-[16px] sm:text-[17px] font-semibold text-[var(--color-wh-black)] hover:bg-[var(--color-wh-green-soft)]/40 transition-colors">
                {f.q[locale]}
                <ChevronDown
                  size={20}
                  className="shrink-0 text-[var(--color-wh-deep-green)] transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="px-5 pb-5 -mt-1 text-[15px] leading-relaxed text-[var(--color-wh-fg-muted)]">
                {f.a[locale]}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="px-6 sm:px-8 pb-20">
        <div className="max-w-[760px] mx-auto text-center">
          <h2 className="text-[24px] sm:text-[30px] leading-tight m-0 mb-5">{c.ctaHeading}</h2>
          <Link
            href="/buchen"
            className="inline-flex items-center gap-2 h-13 px-7 py-3.5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold text-[16px] hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
          >
            {c.ctaButton} <ArrowRight size={19} />
          </Link>
          <p className="text-[14px] text-[var(--color-wh-fg-muted)] mt-5 m-0">
            {c.contactPrompt}{" "}
            <Link href="/kontakt" className="text-[var(--color-wh-deep-green)] font-semibold hover:underline">
              {c.contactLink}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
