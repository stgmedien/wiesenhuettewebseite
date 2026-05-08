import Image from "next/image";
import Link from "next/link";
import { ImageCarousel } from "@/components/public/ImageCarousel";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verein · Skifreunde Gütersloh e.V.",
  description:
    "1949 gegründet, seit 1956 Träger der Wiesenhütte in Langewiese. Skigymnastik, Adventskaffeetrinken, Grünkohlwanderung — und Generationen, die die Hütte erhalten.",
};

const VEREINSAKTIVITAETEN_BILDER = [
  { src: "/media/photos/vereinsaktivitaeten/signal-2026-04-21-084348.jpeg", alt: "Vereinsaktivität — Skifreunde Gütersloh" },
  { src: "/media/photos/vereinsaktivitaeten/signal-2026-04-21-084428.jpeg", alt: "Vereinsaktivität — Skifreunde Gütersloh" },
  { src: "/media/photos/vereinsaktivitaeten/signal-2026-04-21-084456.jpeg", alt: "Vereinsaktivität — Skifreunde Gütersloh" },
  { src: "/media/photos/vereinsaktivitaeten/signal-2026-04-21-084531.jpeg", alt: "Vereinsaktivität — Skifreunde Gütersloh" },
];

const TIMELINE = [
  {
    year: "1949",
    title: "Gründung",
    body:
      "Am 26. Oktober treffen sich 124 Skibegeisterte im Gasthaus Schröder in Gütersloh und gründen den Verein. Erster Vorsitzender: Dr. Walter Hiersemann. Eintragung ins Vereinsregister am 4. November.",
  },
  {
    year: "1956",
    title: "Kauf der Hütte in Langewiese",
    body:
      "Die Hütte wird von Werner Teske inklusive Inventar für 7.000 DM erworben. Anfangs schlafen 15 Personen drin, weitere Gäste auf Bänken und in Schlafhängematten. Der Verein zählt 450 Mitglieder.",
  },
  {
    year: "1958–1960",
    title: "Unterkellerung in Eigenarbeit",
    body:
      "Mitglieder heben den Boden mit Kohlenschaufeln per Hand aus.",
  },
  {
    year: "1960",
    title: "Anbau Seitentrakt",
    body: "3.650 ehrenamtliche Arbeitsstunden der Vereinsmitglieder.",
  },
  {
    year: "1968",
    title: "Heizungsanlage",
    body:
      "Die Skibusse befördern 453 Personen nach Langewiese — ein Jahr später schon 661.",
  },
  {
    year: "1972",
    title: "Grundstückskauf",
    body: "Etwa 2.000 m² inklusive Hang.",
  },
  {
    year: "1986",
    title: "Letzter Erweiterungsbau",
    body:
      "Seitdem 33 Schlafplätze in 5 Schlafzimmern, 2 Aufenthaltsräume, voll ausgestattete Küche, Sanitäranlagen, Skikeller.",
  },
  {
    year: "Heute",
    title: "Verein in Bewegung",
    body:
      "Skigymnastik, Vereinsfahrten, Renovierungswochenenden, ESG-Projekte — getragen von Ehrenamt und Generationen.",
  },
];

type MemberCtaState = {
  loggedIn: boolean;
  status: "none" | "pending" | "verified" | "rejected" | null;
};

async function getMemberCtaState(): Promise<MemberCtaState> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { loggedIn: false, status: null };
  const c = await db
    .select({ status: customers.membershipStatus })
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  return { loggedIn: true, status: c[0]?.status ?? "none" };
}

function MemberCta({
  loggedIn,
  status,
}: {
  loggedIn: boolean;
  status: MemberCtaState["status"];
}) {
  const base =
    "inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline";
  const primary = "bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] hover:bg-white";
  if (!loggedIn) {
    return (
      <Link href="/registrieren" className={`${base} ${primary}`}>
        Konto anlegen & Mitgliedschaft beantragen →
      </Link>
    );
  }
  if (status === "verified") {
    return (
      <Link href="/konto" className={`${base} ${primary}`}>
        ✓ Du bist Mitglied — zum Konto
      </Link>
    );
  }
  if (status === "pending") {
    return (
      <Link href="/konto/profil" className={`${base} ${primary}`}>
        Dein Antrag wird geprüft — Status ansehen
      </Link>
    );
  }
  return (
    <Link href="/konto/profil" className={`${base} ${primary}`}>
      Mitgliedschaft beantragen →
    </Link>
  );
}

export default async function VereinPage() {
  const memberCta = await getMemberCtaState();

  return (
    <div>
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">Skifreunde Gütersloh e.V.</div>
          <h1 className="text-[var(--color-wh-snow)] mt-4 text-[44px] sm:text-[64px]">
            Seit 1949 in Bewegung.
          </h1>
          <p className="text-[var(--color-wh-snow)]/85 max-w-2xl text-base sm:text-[18px] leading-relaxed mt-4">
            Gegründet von 124 Skibegeisterten in Gütersloh, getragen über mehr als sieben
            Jahrzehnte von ehrenamtlicher Arbeit, Vereinsfahrten und Generationen, die in
            Langewiese ihre erste Skispur gezogen haben.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">
          <div className="relative aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden">
            <Image
              src="/media/historical/walter-hiersemann.jpg"
              alt="Dr. Walter Hiersemann, erster Vorsitzender"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 400px, 100vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="text-[var(--color-wh-snow)] text-sm">
                Dr. Walter Hiersemann
                <span className="block text-xs opacity-80">1. Vorsitzender (1949)</span>
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow">Vereinsprofil</div>
            <h2 className="text-[32px] sm:text-[40px] mt-3 mb-4">Naturerlebnis. Bewegung. Gemeinschaft.</h2>
            <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-black)] m-0">
              Die Skifreunde Gütersloh wurden 1949 gegründet. Mit dem Bau der Hütte 1956 entstand
              ein gemeinschaftlicher Ort, der bis heute getragen wird. Der Verein verbindet
              Naturerlebnis, Bewegung und generationsübergreifendes Engagement. Die Hütte ist das
              Zentrum dieses Gemeinschaftslebens: ein Ort für Begegnungen, Projekte, Ehrenamt und
              pädagogische Arbeit.
            </p>
            <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-fg-muted)] mt-4">
              Bereits 1958 verfügt der Verein über erste Übungsleiter; in den 50er und 60er Jahren
              gehören die Skifreunde zu den führenden Vereinen des Westdeutschen Skiverbands.
              Vereinsmeisterschaften finden ab 1957 in Langewiese statt — über 40 Jahre lang
              regelmäßig.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow">Zeitleiste</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 sm:mt-4">Eine Vereinsgeschichte.</h2>
          <ol className="mt-10 sm:mt-12 space-y-8 sm:space-y-10 border-l-2 border-[var(--color-wh-green)] pl-7 sm:pl-8">
            {TIMELINE.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[37px] sm:-left-[42px] top-1.5 w-4 h-4 rounded-full bg-[var(--color-wh-green)]" />
                <div className="font-display text-[24px] sm:text-[28px] font-bold text-[var(--color-wh-deep-green)] leading-none">
                  {t.year}
                </div>
                <h4 className="mt-2 m-0 text-[18px] sm:text-[20px]">{t.title}</h4>
                <p className="mt-2 m-0 text-[var(--color-wh-fg-muted)]">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-center">
          <div>
            <div className="eyebrow">Aktive Vereinszeit</div>
            <h2 className="text-[32px] sm:text-[40px] mt-3 mb-5">Bewegung & Veranstaltungen.</h2>

            <h3 className="text-[20px] mt-6 mb-2">Skigymnastik mit Alexandra Lütgert</h3>
            <p className="text-[var(--color-wh-fg-muted)] m-0">
              Kraft, Beweglichkeit, Koordination und Kondition — ideal für alle, die aktiv
              bleiben möchten. Dienstags 18:30 Uhr und donnerstags 20:00 Uhr, Schnupperstunde
              jederzeit möglich.
            </p>

            <h3 className="text-[20px] mt-6 mb-2">Adventskaffeetrinken</h3>
            <p className="text-[var(--color-wh-fg-muted)] m-0">
              Im Spexarder Bauernhaus, organisiert von Karin Lütgert. Mitglieder aller
              Generationen kommen zusammen.
            </p>

            <h3 className="text-[20px] mt-6 mb-2">Grünkohlwanderung & Jahreshauptversammlung</h3>
            <p className="text-[var(--color-wh-fg-muted)] m-0">
              Traditionelle Winterwanderung mit gemeinsamem Essen, jährlicher Austausch über
              Vereinsentwicklung, Renovierungswochenenden, Hüttenfahrten.
            </p>
          </div>

          <ImageCarousel
            images={VEREINSAKTIVITAETEN_BILDER}
            aspectClass="aspect-[4/3]"
          />
        </div>
      </section>

      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">Mitgliedschaft</div>
          <h2 className="text-[var(--color-wh-snow)] text-[32px] sm:text-[40px] mt-3 mb-6">
            Mitglied werden.
          </h2>
          <p className="text-[var(--color-wh-snow)]/85 m-0 mb-8 max-w-2xl">
            Die Skifreunde freuen sich über neue Mitglieder aller Generationen. Jährliche Beiträge:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0">
            {[
              ["Erwachsene", "45 €"],
              ["Ehepaare", "65 €"],
              ["Familien (bis 14 Jahre)", "65 €"],
              ["Familien (ab 14 Jahren)", "80 €"],
              ["Kinder & Jugendliche (ohne Familienmitgliedschaft)", "25 €"],
              ["Schüler & Studierende", "30 €"],
              ["Rentner:innen", "15 €"],
            ].map(([label, price]) => (
              <li
                key={label}
                className="flex items-center justify-between bg-[var(--color-wh-snow)]/10 px-4 py-3 rounded-[var(--radius-md)]"
              >
                <span>{label}</span>
                <span className="font-semibold">{price}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 bg-[var(--color-wh-snow)]/10 border border-[var(--color-wh-snow)]/20 rounded-[var(--radius-card)] p-6 sm:p-7">
            <p className="text-[var(--color-wh-snow)] m-0 mb-2 font-semibold text-[18px]">
              Mitglied werden — direkt online.
            </p>
            <p className="text-[var(--color-wh-snow)]/85 m-0 mb-5 text-sm leading-relaxed">
              Konto anlegen, Mitgliedschaft beantragen, der Vorstand prüft den Antrag. Sobald
              bestätigt, kannst Du den Mitgliedsbeitrag perspektivisch bequem per
              SEPA-Lastschrift oder Karte automatisch jährlich einziehen lassen.
            </p>
            <div className="flex flex-wrap gap-3">
              <MemberCta loggedIn={memberCta.loggedIn} status={memberCta.status} />
              <a
                href="mailto:info@skifreunde-gt.de"
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline border border-[var(--color-wh-snow)]/40 text-[var(--color-wh-snow)]/85 hover:bg-[var(--color-wh-snow)]/10"
              >
                Lieber per Mail
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
