import { CalendarDays, Clock, MapPin, Flame } from "lucide-react";
import { WapelbadForm } from "./WapelbadForm";

export const dynamic = "force-dynamic";

// Versteckte Seite: nicht in Navigation/Sitemap, zusätzlich noindex/nofollow —
// nur über den direkt geteilten Link erreichbar (z. B. aus dem Newsletter).
export const metadata = {
  title: "Wapelbad – Anmeldung · Wiesenhütte",
  description: "Anmeldung zum Wapelbad-Vereinsfest der Skifreunde Gütersloh e.V.",
  robots: { index: false, follow: false },
};

const FACTS = [
  { icon: CalendarDays, label: "Freitag, 5. September 2026" },
  { icon: Clock, label: "ab 16 Uhr" },
  { icon: MapPin, label: "Wapelbad" },
  { icon: Flame, label: "Grillbuffet optional – 10 € pro Person, vor Ort" },
] as const;

export default async function WapelbadPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const msg =
    status === "ok"
      ? {
          tone: "ok" as const,
          text: "Danke! Deine Anmeldung ist eingegangen – eine Bestätigung kommt per E-Mail.",
        }
      : status === "fehler"
        ? {
            tone: "err" as const,
            text: "Bitte gib einen Namen und eine gültige E-Mail-Adresse an.",
          }
        : status === "mailfehler"
          ? {
              tone: "err" as const,
              text: "Die Anmeldung konnte gerade nicht versendet werden. Bitte versuch es später erneut oder schreib an skifreunde@wiesenhuette.de.",
            }
          : null;

  return (
    <div className="bg-[var(--color-wh-snow)]">
      <section className="px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Intro + Eckdaten */}
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[var(--color-wh-deep-green)]">
              Vereinsfest
            </div>
            <h1 className="text-[36px] sm:text-[52px] leading-[1.04] mt-4 mb-5">
              Wapelbad – sei dabei.
            </h1>
            <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-xl m-0 mb-8">
              Ein gemütlicher Nachmittag mit den Skifreunden im Wapelbad – mit Grillbuffet, wenn ihr
              mögt. Meldet euch kurz an, damit wir besser planen können.
            </p>
            <ul className="list-none p-0 m-0 space-y-3">
              {FACTS.map((f) => {
                const Icon = f.icon;
                return (
                  <li
                    key={f.label}
                    className="flex items-start gap-3 text-[15px] text-[var(--color-wh-black)]"
                  >
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)]">
                      <Icon size={16} strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="pt-1">{f.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Anmeldeformular */}
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-[0_16px_44px_rgba(47,74,53,0.08)]">
            <h2 className="text-[22px] font-semibold text-[var(--color-wh-deep-green)] mb-5">
              Anmeldung
            </h2>
            {msg && (
              <div
                className={
                  "mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[15px] " +
                  (msg.tone === "ok"
                    ? "bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] border border-[var(--color-wh-green)]/40"
                    : "bg-red-50 text-red-700 border border-red-200")
                }
              >
                {msg.text}
              </div>
            )}
            <WapelbadForm />
          </div>
        </div>
      </section>
    </div>
  );
}
