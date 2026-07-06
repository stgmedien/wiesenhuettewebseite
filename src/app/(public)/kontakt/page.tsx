import { Mail, Phone, CalendarCheck } from "lucide-react";
import Image from "next/image";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = {
  title: "Kontakt · Wiesenhütte Skifreunde Gütersloh",
  description:
    "Buchungen, Hüttenwart, Vorstand — alle Ansprechpartner der Skifreunde Gütersloh e.V. auf einen Blick.",
};

type Copy = {
  eyebrow: string;
  h1: string;
  lead: string;
  vorstand: { eyebrow: string; line: string };
  cards: {
    booking: { label: string; info: string; cta: string };
    fragen: { label: string; info: string };
    huettenwart: { label: string; address: string; info: string };
  };
  notes: {
    h3: string;
    items: string[];
  };
};

const COPY: Record<Locale, Copy> = {
  de: {
    eyebrow: "Kontakt",
    h1: "So erreicht Ihr uns.",
    lead: "Alle Buchungen laufen direkt über unser Online-Buchungstool. Für Fragen, die auf unserer Webseite noch nicht beantwortet sind, erreicht Ihr uns per E-Mail.",
    vorstand: { eyebrow: "Vorstand", line: "Skifreunde Gütersloh e.V. — die Menschen hinter dem Verein." },
    cards: {
      booking: {
        label: "Buchungen",
        info: "Alle Buchungen laufen direkt über unser Online-Buchungstool — Buchungsanfragen oder Verträge per E-Mail sind nicht nötig.",
        cta: "Zum Buchungstool",
      },
      fragen: {
        label: "Fragen",
        info: "Für Fragen, die auf unserer Webseite noch nicht beantwortet sind.",
      },
      huettenwart: {
        label: "Hüttenwart vor Ort",
        address: "Vorm Rohrbach 1, 59955 Winterberg-Langewiese",
        info: "Schlüsselübergabe, Fragen vor Ort, Mängelmeldung",
      },
    },
    notes: {
      h3: "Kurze Hinweise vor Eurer Anreise",
      items: [
        "Spätestens **2 Tage vor Anreise** meldet Ihr Toni Klauke telefonisch Eure genaue Ankunftszeit.",
        "Toni empfängt Euch an der Hütte und übergibt die Schlüssel. Eure Kurkarten bekommt Ihr vorab automatisch per E-Mail zugesendet.",
        "Mängel bitte sofort nach Anreise telefonisch melden — wird gemeinsam protokolliert.",
      ],
    },
  },
  en: {
    eyebrow: "Contact",
    h1: "How to reach us.",
    lead: "All bookings go directly through our online booking tool. For questions not yet answered on our website, reach us by email.",
    vorstand: { eyebrow: "Board", line: "Skifreunde Gütersloh e.V. — the people behind the club." },
    cards: {
      booking: {
        label: "Bookings",
        info: "All bookings go directly through our online booking tool — no booking inquiries or contracts by email needed.",
        cta: "Go to booking tool",
      },
      fragen: {
        label: "Questions",
        info: "For questions not yet answered on our website.",
      },
      huettenwart: {
        label: "On-site cabin keeper",
        address: "Vorm Rohrbach 1, 59955 Winterberg-Langewiese, Germany",
        info: "Key handover, questions on site, reporting defects",
      },
    },
    notes: {
      h3: "A few notes before your arrival",
      items: [
        "At the latest **2 days before arrival** call Toni Klauke to tell him your exact arrival time.",
        "Toni meets you at the cabin and hands over the keys. Your visitor cards (Kurkarten) are emailed to you in advance.",
        "Please report any defects by phone right after arrival — we'll log them together.",
      ],
    },
  },
  nl: {
    eyebrow: "Contact",
    h1: "Zo bereik je ons.",
    lead: "Alle boekingen verlopen direct via onze online boekingstool. Voor vragen die nog niet op onze website beantwoord zijn, bereik je ons per e-mail.",
    vorstand: { eyebrow: "Bestuur", line: "Skifreunde Gütersloh e.V. — de mensen achter de vereniging." },
    cards: {
      booking: {
        label: "Boekingen",
        info: "Alle boekingen verlopen direct via onze online boekingstool — boekingsaanvragen of contracten per e-mail zijn niet nodig.",
        cta: "Naar de boekingstool",
      },
      fragen: {
        label: "Vragen",
        info: "Voor vragen die nog niet op onze website beantwoord zijn.",
      },
      huettenwart: {
        label: "Hutwacht ter plaatse",
        address: "Vorm Rohrbach 1, 59955 Winterberg-Langewiese, Duitsland",
        info: "Sleutel­overdracht, vragen ter plaatse, gebreken melden",
      },
    },
    notes: {
      h3: "Korte aanwijzingen vóór aankomst",
      items: [
        "Uiterlijk **2 dagen vóór aankomst** bel je Toni Klauke om je precieze aankomsttijd door te geven.",
        "Toni ontvangt jullie bij de hut en overhandigt de sleutels. Jullie kurkarten krijgen jullie vooraf automatisch per e-mail.",
        "Gebreken graag direct na aankomst telefonisch melden — leggen we samen vast.",
      ],
    },
  },
};

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default async function KontaktPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[920px] mx-auto">
        <div className="eyebrow">{c.eyebrow}</div>
        <h1 className="text-[44px] sm:text-[64px] mt-4">{c.h1}</h1>
        <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl mt-4">
          {c.lead}
        </p>

        <div className="mt-10 relative aspect-[16/9] sm:aspect-[2/1] rounded-[var(--radius-card)] overflow-hidden">
          <Image
            src="/media/historical/neuer_vorstand.jpg"
            alt="Der Vorstand der Skifreunde Gütersloh"
            fill
            className="object-cover"
            sizes="(min-width: 920px) 920px, 100vw"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(47,74,53,0.85)] to-transparent p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-white/85 m-0">
              {c.vorstand.eyebrow}
            </p>
            <p className="text-[15px] sm:text-[17px] text-white m-0">{c.vorstand.line}</p>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Card
            icon={<CalendarCheck size={20} strokeWidth={1.6} />}
            label={c.cards.booking.label}
            primary="Online-Buchungstool"
            secondary={[
              { kind: "link", value: c.cards.booking.cta, href: "/buchen" },
              { kind: "info", value: c.cards.booking.info },
            ]}
          />
          <Card
            icon={<Mail size={20} strokeWidth={1.6} />}
            label={c.cards.fragen.label}
            primary="Wiesenhütte Team"
            secondary={[
              { kind: "mail", value: "hello@wiesenhuette.de" },
              { kind: "info", value: c.cards.fragen.info },
            ]}
          />
          <Card
            icon={<Phone size={20} strokeWidth={1.6} />}
            label={c.cards.huettenwart.label}
            primary="Toni Klauke"
            secondary={[
              { kind: "info", value: c.cards.huettenwart.address },
              { kind: "phone", value: "02758 / 2014822" },
              { kind: "phone", value: "0151 / 67 44 82 73" },
              { kind: "info", value: c.cards.huettenwart.info },
            ]}
          />
        </div>

        <div className="mt-12 bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-6 sm:p-8">
          <h3 className="m-0 mb-2 text-[22px]">{c.notes.h3}</h3>
          <ul className="list-disc list-inside marker:text-[var(--color-wh-green)] text-[var(--color-wh-black)] space-y-1.5">
            {c.notes.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type Item =
  | { kind: "mail"; value: string }
  | { kind: "phone"; value: string }
  | { kind: "info"; value: string }
  | { kind: "link"; value: string; href: string };

const Card = ({
  icon,
  label,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary: Item[];
}) => (
  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
    <div className="flex items-center gap-2 text-[var(--color-wh-deep-green)] mb-3">
      {icon}
      <span className="eyebrow">{label}</span>
    </div>
    <p className="m-0 font-semibold text-[18px]">{primary}</p>
    <ul className="m-0 mt-2 list-none p-0 text-sm text-[var(--color-wh-fg-muted)] space-y-1">
      {secondary.map((s, i) => (
        <li key={i}>
          {s.kind === "mail" && <a href={`mailto:${s.value}`}>{s.value}</a>}
          {s.kind === "phone" && <a href={`tel:${s.value.replace(/[^0-9+]/g, "")}`}>{s.value}</a>}
          {s.kind === "info" && s.value}
          {s.kind === "link" && (
            <a href={s.href} className="font-semibold text-[var(--color-wh-deep-green)] underline">
              {s.value} →
            </a>
          )}
        </li>
      ))}
    </ul>
  </div>
);
