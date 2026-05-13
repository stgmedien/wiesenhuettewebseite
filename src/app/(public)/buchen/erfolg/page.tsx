import Link from "next/link";
import { CheckCircle2, MapPin, Footprints, Backpack } from "lucide-react";

export const metadata = { title: "Buchung erfolgreich · Wiesenhütte" };

type Props = { searchParams: Promise<{ bn?: string }> };

export default async function ErfolgPage({ searchParams }: Props) {
  const { bn } = await searchParams;
  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh]">
      <section className="px-8 py-16 sm:py-20">
        <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-8 sm:p-10 text-center">
          <CheckCircle2 className="text-[var(--color-wh-green)] mx-auto" size={64} strokeWidth={1.4} />
          <h1 className="text-[36px] sm:text-[40px] mt-6">Vielen Dank — Eure Buchung ist da.</h1>
          {bn && (
            <p className="text-[var(--color-wh-fg-muted)] m-0">
              Buchungsnummer: <strong className="text-[var(--color-wh-deep-green)]">{bn}</strong>
            </p>
          )}
          <p className="mt-4 text-[var(--color-wh-fg-muted)]">
            Eine Bestätigung mit allen Details ist unterwegs zu Eurer E-Mail-Adresse.
            Falls sie nicht innerhalb weniger Minuten ankommt, schaut bitte im Spam-Ordner nach.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-center">Damit Ihr gut vorbereitet seid</div>
          <h2 className="text-[28px] sm:text-[36px] mt-3 mb-3 leading-tight text-center text-[var(--color-wh-deep-green)] font-display font-bold">
            Was Ihr jetzt schon planen könnt.
          </h2>
          <p className="text-[var(--color-wh-fg-muted)] text-[15px] max-w-xl mx-auto mb-10 text-center">
            Drei Tools, die wir Euch für die Zeit vor und während des Aufenthalts mitgeben.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PostBookCard
              href="/empfehlungen"
              Icon={MapPin}
              title="Empfehlungen in der Region"
              body="Restaurants, Einkauf, Notdienste, Ausflüge — kuratiert vom Vorstand."
            />
            <PostBookCard
              href="/wandertouren"
              Icon={Footprints}
              title="Wandertouren mit GPX"
              body="Routen direkt von der Hütte aus, downloadbar für Komoot & Garmin."
            />
            <PostBookCard
              href="/packliste"
              Icon={Backpack}
              title="Deine Packliste"
              body="Personalisiert nach Saison und Aktivität — druckbar als PDF."
            />
          </div>
          <div className="text-center mt-10">
            <Link
              href="/konto"
              className="text-[14px] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:underline"
            >
              Buchung in Deinem Konto ansehen →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PostBookCard({
  href,
  Icon,
  title,
  body,
}: {
  href: string;
  Icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 no-underline hover:shadow-md transition-shadow"
    >
      <div className="w-10 h-10 rounded-full bg-[var(--color-wh-deep-green)]/10 text-[var(--color-wh-deep-green)] flex items-center justify-center mb-3">
        <Icon size={20} />
      </div>
      <h3 className="font-display font-bold text-[18px] text-[var(--color-wh-deep-green)] m-0 mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-[13px] sm:text-[14px] text-[var(--color-wh-black)] m-0 mb-3">
        {body}
      </p>
      <span className="text-[13px] text-[var(--color-wh-deep-green)] font-semibold group-hover:translate-x-1 inline-block transition-transform">
        Ansehen →
      </span>
    </Link>
  );
}
