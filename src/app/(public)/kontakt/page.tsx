import { Mail, Phone, Home } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Kontakt · Wiesenhütte Skifreunde Gütersloh",
  description:
    "Buchungen, Hüttenwart, Vorstand — alle Ansprechpartner der Skifreunde Gütersloh e.V. auf einen Blick.",
};

export default function KontaktPage() {
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[920px] mx-auto">
        <div className="eyebrow">Kontakt</div>
        <h1 className="text-[44px] sm:text-[64px] mt-4">So erreicht Ihr uns.</h1>
        <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl mt-4">
          Für Buchungen nutzt am besten direkt unser Buchungstool. Für Fragen, Sonderwünsche oder
          Großgruppenanfragen erreicht Ihr uns hier.
        </p>

        <div className="mt-10 relative aspect-[16/9] sm:aspect-[2/1] rounded-[var(--radius-card)] overflow-hidden">
          <Image
            src="/media/historical/founders.jpg"
            alt="Vorstand der Skifreunde Gütersloh"
            fill
            className="object-cover"
            sizes="(min-width: 920px) 920px, 100vw"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(47,74,53,0.85)] to-transparent p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-white/85 m-0">
              Vorstand
            </p>
            <p className="text-[15px] sm:text-[17px] text-white m-0">
              Skifreunde Gütersloh e.V. — die Menschen hinter dem Verein.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Card
            icon={<Home size={20} strokeWidth={1.6} />}
            label="Buchungsmanagement"
            primary="Tanja Milse"
            secondary={[
              { kind: "mail", value: "vorstand@skifreunde-gt.de" },
              { kind: "info", value: "Buchungsanfragen & Vertragsabwicklung" },
            ]}
          />
          <Card
            icon={<Phone size={20} strokeWidth={1.6} />}
            label="Hüttenwart vor Ort"
            primary="Werner Klauke"
            secondary={[
              { kind: "info", value: "Vorm Rohrbach 1, 59955 Winterberg-Langewiese" },
              { kind: "phone", value: "02758 / 2014822" },
              { kind: "phone", value: "0151 / 67 44 82 73" },
              { kind: "info", value: "Schlüsselübergabe, Fragen vor Ort, Mängelmeldung" },
            ]}
          />
          <Card
            icon={<Mail size={20} strokeWidth={1.6} />}
            label="Allgemein"
            primary="Skifreunde Gütersloh e.V."
            secondary={[
              { kind: "info", value: "Postfach 2819, 33258 Gütersloh" },
              { kind: "mail", value: "info@skifreunde-gt.de" },
            ]}
          />
        </div>

        <div className="mt-12 bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-6 sm:p-8">
          <h3 className="m-0 mb-2 text-[22px]">Kurze Hinweise vor Eurer Anreise</h3>
          <ul className="list-disc list-inside marker:text-[var(--color-wh-green)] text-[var(--color-wh-black)] space-y-1.5">
            <li>
              Spätestens <strong>2 Tage vor Anreise</strong> meldet Ihr Werner Klauke telefonisch
              Eure genaue Ankunftszeit.
            </li>
            <li>Werner empfängt Euch an der Hütte und übergibt Schlüssel und Kurkarten.</li>
            <li>
              Mängel bitte sofort nach Anreise telefonisch melden — wird gemeinsam protokolliert.
            </li>
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
