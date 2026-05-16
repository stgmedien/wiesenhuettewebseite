import { Mail, Phone, Home } from "lucide-react";
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
    booking: { label: string; secondaryInfo: string };
    huettenwart: { label: string; address: string; info: string };
    general: { label: string };
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
    lead: "Für Buchungen nutzt am besten direkt unser Buchungstool. Für Fragen, Sonderwünsche oder Großgruppenanfragen erreicht Ihr uns hier.",
    vorstand: { eyebrow: "Vorstand", line: "Skifreunde Gütersloh e.V. — die Menschen hinter dem Verein." },
    cards: {
      booking: { label: "Buchungsmanagement", secondaryInfo: "Buchungsanfragen & Vertragsabwicklung" },
      huettenwart: {
        label: "Hüttenwart vor Ort",
        address: "Vorm Rohrbach 1, 59955 Winterberg-Langewiese",
        info: "Schlüsselübergabe, Fragen vor Ort, Mängelmeldung",
      },
      general: { label: "Allgemein" },
    },
    notes: {
      h3: "Kurze Hinweise vor Eurer Anreise",
      items: [
        "Spätestens **2 Tage vor Anreise** meldet Ihr Werner Klauke telefonisch Eure genaue Ankunftszeit.",
        "Werner empfängt Euch an der Hütte und übergibt Schlüssel und Kurkarten.",
        "Mängel bitte sofort nach Anreise telefonisch melden — wird gemeinsam protokolliert.",
      ],
    },
  },
  en: {
    eyebrow: "Contact",
    h1: "How to reach us.",
    lead: "For bookings, please use our booking tool directly. For questions, special requests or large-group inquiries, you can reach us here.",
    vorstand: { eyebrow: "Board", line: "Skifreunde Gütersloh e.V. — the people behind the club." },
    cards: {
      booking: { label: "Booking management", secondaryInfo: "Booking inquiries & contract handling" },
      huettenwart: {
        label: "On-site cabin keeper",
        address: "Vorm Rohrbach 1, 59955 Winterberg-Langewiese, Germany",
        info: "Key handover, questions on site, reporting defects",
      },
      general: { label: "General" },
    },
    notes: {
      h3: "A few notes before your arrival",
      items: [
        "At the latest **2 days before arrival** call Werner Klauke to tell him your exact arrival time.",
        "Werner meets you at the cabin and hands over keys and resort cards.",
        "Please report any defects by phone right after arrival — we'll log them together.",
      ],
    },
  },
  nl: {
    eyebrow: "Contact",
    h1: "Zo bereik je ons.",
    lead: "Voor boekingen gebruik je het beste rechtstreeks onze boekingstool. Voor vragen, bijzondere wensen of grote groepen kun je ons hier bereiken.",
    vorstand: { eyebrow: "Bestuur", line: "Skifreunde Gütersloh e.V. — de mensen achter de vereniging." },
    cards: {
      booking: { label: "Boekingsbeheer", secondaryInfo: "Boekingsaanvragen & contractafhandeling" },
      huettenwart: {
        label: "Hutwacht ter plaatse",
        address: "Vorm Rohrbach 1, 59955 Winterberg-Langewiese, Duitsland",
        info: "Sleutel­overdracht, vragen ter plaatse, gebreken melden",
      },
      general: { label: "Algemeen" },
    },
    notes: {
      h3: "Korte aanwijzingen vóór aankomst",
      items: [
        "Uiterlijk **2 dagen vóór aankomst** bel je Werner Klauke om je precieze aankomsttijd door te geven.",
        "Werner ontvangt jullie bij de hut en overhandigt sleutels en kurkarten.",
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
            icon={<Home size={20} strokeWidth={1.6} />}
            label={c.cards.booking.label}
            primary="Tanja Milse"
            secondary={[
              { kind: "mail", value: "vorstand@skifreunde-gt.de" },
              { kind: "info", value: c.cards.booking.secondaryInfo },
            ]}
          />
          <Card
            icon={<Phone size={20} strokeWidth={1.6} />}
            label={c.cards.huettenwart.label}
            primary="Werner Klauke"
            secondary={[
              { kind: "info", value: c.cards.huettenwart.address },
              { kind: "phone", value: "02758 / 2014822" },
              { kind: "phone", value: "0151 / 67 44 82 73" },
              { kind: "info", value: c.cards.huettenwart.info },
            ]}
          />
          <Card
            icon={<Mail size={20} strokeWidth={1.6} />}
            label={c.cards.general.label}
            primary="Skifreunde Gütersloh e.V."
            secondary={[
              { kind: "info", value: "Postfach 2819, 33258 Gütersloh" },
              { kind: "mail", value: "info@skifreunde-gt.de" },
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
  | { kind: "info"; value: string };

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
        </li>
      ))}
    </ul>
  </div>
);
