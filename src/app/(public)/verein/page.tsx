import Image from "next/image";
import Link from "next/link";
import { ImageCarousel } from "@/components/public/ImageCarousel";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

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

type TimelineItem = { year: string; title: string; body: string };
type Copy = {
  hero: { eyebrow: string; h1: string; lead: string };
  profile: {
    eyebrow: string;
    h2: string;
    p1: string;
    p2: string;
    portraitLabel: string;
    portraitRole: string;
  };
  timelineHeading: { eyebrow: string; h2: string };
  timeline: TimelineItem[];
  active: {
    eyebrow: string;
    h2: string;
    gymHeading: string;
    gymH3: string;
    gymBody: string;
    eventsHeading: string;
    adventH3: string;
    adventBody: string;
    walkH3: string;
    walkBody: string;
  };
  member: {
    eyebrow: string;
    h2: string;
    lead: string;
    tiers: Array<[string, string]>;
    ctaBox: {
      title: string;
      body: string;
      ctaSignup: string;
      ctaMember: string;
      ctaPending: string;
      ctaPropose: string;
      ctaMail: string;
    };
  };
};

const COPY: Record<Locale, Copy> = {
  de: {
    hero: {
      eyebrow: "Skifreunde Gütersloh e.V.",
      h1: "Seit 1949 in Bewegung.",
      lead:
        "Gegründet von 124 Skibegeisterten in Gütersloh, getragen über mehr als sieben Jahrzehnte von ehrenamtlicher Arbeit, Vereinsfahrten und Generationen, die in Langewiese ihre erste Skispur gezogen haben.",
    },
    profile: {
      eyebrow: "Vereinsprofil",
      h2: "Naturerlebnis. Bewegung. Gemeinschaft.",
      p1:
        "Die Skifreunde Gütersloh wurden 1949 gegründet. Mit dem Bau der Hütte 1956 entstand ein gemeinschaftlicher Ort, der bis heute getragen wird. Der Verein verbindet Naturerlebnis, Bewegung und generationsübergreifendes Engagement. Die Hütte ist das Zentrum dieses Gemeinschaftslebens: ein Ort für Begegnungen, Projekte, Ehrenamt und pädagogische Arbeit.",
      p2:
        "Bereits 1958 verfügt der Verein über erste Übungsleiter; in den 50er und 60er Jahren gehören die Skifreunde zu den führenden Vereinen des Westdeutschen Skiverbands. Vereinsmeisterschaften finden ab 1957 in Langewiese statt — über 40 Jahre lang regelmäßig.",
      portraitLabel: "Dr. Walter Hiersemann",
      portraitRole: "1. Vorsitzender (1949)",
    },
    timelineHeading: { eyebrow: "Zeitleiste", h2: "Eine Vereinsgeschichte." },
    timeline: [
      { year: "1949", title: "Gründung", body: "Am 26. Oktober treffen sich 124 Skibegeisterte im Gasthaus Schröder in Gütersloh und gründen den Verein. Erster Vorsitzender: Dr. Walter Hiersemann. Eintragung ins Vereinsregister am 4. November." },
      { year: "1956", title: "Kauf der Hütte in Langewiese", body: "Die Hütte wird von Werner Teske inklusive Inventar für 7.000 DM erworben. Anfangs schlafen 15 Personen drin, weitere Gäste auf Bänken und in Schlafhängematten. Der Verein zählt 450 Mitglieder." },
      { year: "1958–1960", title: "Unterkellerung in Eigenarbeit", body: "Mitglieder heben den Boden mit Kohlenschaufeln per Hand aus." },
      { year: "1960", title: "Anbau Seitentrakt", body: "3.650 ehrenamtliche Arbeitsstunden der Vereinsmitglieder." },
      { year: "1968", title: "Heizungsanlage", body: "Die Skibusse befördern 453 Personen nach Langewiese — ein Jahr später schon 661." },
      { year: "1972", title: "Grundstückskauf", body: "Etwa 2.000 m² inklusive Hang." },
      { year: "1986", title: "Letzter Erweiterungsbau", body: "Seitdem 33 Schlafplätze in 5 Schlafzimmern, 2 Aufenthaltsräume, voll ausgestattete Küche, Sanitäranlagen, Skikeller." },
      { year: "Heute", title: "Verein in Bewegung", body: "Skigymnastik, Vereinsfahrten, Renovierungswochenenden, ESG-Projekte — getragen von Ehrenamt und Generationen." },
    ],
    active: {
      eyebrow: "Aktive Vereinszeit",
      h2: "Bewegung & Veranstaltungen.",
      gymHeading: "Gymnastikkurse",
      gymH3: "Skigymnastik mit Alexandra Lütgert",
      gymBody: "Kraft, Beweglichkeit, Koordination und Kondition — ideal für alle, die aktiv bleiben möchten. Dienstags 18:30 Uhr und donnerstags 20:00 Uhr, Schnupperstunde jederzeit möglich.",
      eventsHeading: "Veranstaltungen",
      adventH3: "Adventskaffeetrinken",
      adventBody: "Im Spexarder Bauernhaus, organisiert von Karin Lütgert. Mitglieder aller Generationen kommen zusammen.",
      walkH3: "Grünkohlwanderung & Jahreshauptversammlung",
      walkBody: "Traditionelle Winterwanderung mit gemeinsamem Essen, jährlicher Austausch über Vereinsentwicklung, Renovierungswochenenden, Hüttenfahrten.",
    },
    member: {
      eyebrow: "Mitgliedschaft",
      h2: "Mitglied werden.",
      lead: "Die Skifreunde freuen sich über neue Mitglieder aller Generationen. Jährliche Beiträge:",
      tiers: [
        ["Erwachsene", "45 €"],
        ["Ehepaare", "65 €"],
        ["Familien (bis 14 Jahre)", "65 €"],
        ["Familien (ab 14 Jahren)", "80 €"],
        ["Kinder & Jugendliche (ohne Familienmitgliedschaft)", "25 €"],
        ["Schüler & Studierende", "30 €"],
        ["Rentner:innen", "15 €"],
      ],
      ctaBox: {
        title: "Mitglied werden — direkt online.",
        body: "Konto anlegen, Mitgliedschaft beantragen, der Vorstand prüft den Antrag. Sobald bestätigt, kannst Du den Mitgliedsbeitrag perspektivisch bequem per SEPA-Lastschrift oder Karte automatisch jährlich einziehen lassen.",
        ctaSignup: "Konto anlegen & Mitgliedschaft beantragen →",
        ctaMember: "✓ Du bist Mitglied — zum Konto",
        ctaPending: "Dein Antrag wird geprüft — Status ansehen",
        ctaPropose: "Mitgliedschaft beantragen →",
        ctaMail: "Lieber per Mail",
      },
    },
  },
  en: {
    hero: {
      eyebrow: "Skifreunde Gütersloh e.V.",
      h1: "In motion since 1949.",
      lead: "Founded by 124 ski enthusiasts in Gütersloh, carried for more than seven decades by volunteer work, club trips and generations who carved their first turns in Langewiese.",
    },
    profile: {
      eyebrow: "Club profile",
      h2: "Nature. Movement. Community.",
      p1: "The Skifreunde Gütersloh were founded in 1949. With the construction of the cabin in 1956, a communal place came into being that is still carried by volunteers today. The club combines nature, movement and cross-generational engagement. The cabin is the heart of this community life: a place for encounters, projects, volunteer work and educational programs.",
      p2: "By 1958 the club already had its first instructors; in the 50s and 60s the Skifreunde were among the leading clubs of the West German Ski Association. Club championships have been held in Langewiese since 1957 — regularly for over 40 years.",
      portraitLabel: "Dr. Walter Hiersemann",
      portraitRole: "First chairman (1949)",
    },
    timelineHeading: { eyebrow: "Timeline", h2: "A club history." },
    timeline: [
      { year: "1949", title: "Founding", body: "On 26 October, 124 ski enthusiasts met at the Schröder inn in Gütersloh and founded the club. First chairman: Dr. Walter Hiersemann. Registered as an association on 4 November." },
      { year: "1956", title: "Acquired the cabin in Langewiese", body: "The cabin was purchased from Werner Teske including inventory for 7,000 DM. Initially 15 people slept inside, additional guests on benches and in hammocks. The club had 450 members." },
      { year: "1958–1960", title: "Basement excavation by club members", body: "Members dug out the floor by hand using coal shovels." },
      { year: "1960", title: "Side wing extension", body: "3,650 volunteer hours by club members." },
      { year: "1968", title: "Heating system", body: "The ski buses carried 453 people to Langewiese — a year later already 661." },
      { year: "1972", title: "Land purchase", body: "About 2,000 m² including the slope." },
      { year: "1986", title: "Last major extension", body: "Since then: 33 beds in 5 bedrooms, 2 common rooms, fully equipped kitchen, bathrooms, ski cellar." },
      { year: "Today", title: "A club in motion", body: "Ski gymnastics, club trips, renovation weekends, ESG school projects — carried by volunteer work and generations." },
    ],
    active: {
      eyebrow: "Active club life",
      h2: "Movement & events.",
      gymHeading: "Gymnastics classes",
      gymH3: "Ski gymnastics with Alexandra Lütgert",
      gymBody: "Strength, flexibility, coordination and stamina — ideal for everyone who wants to stay active. Tuesdays 18:30 and Thursdays 20:00, trial sessions possible at any time.",
      eventsHeading: "Events",
      adventH3: "Advent coffee",
      adventBody: "At the Spexarder Bauernhaus, organised by Karin Lütgert. Members of all generations come together.",
      walkH3: "Kale hike & annual general meeting",
      walkBody: "Traditional winter hike with a shared meal, annual exchange on club development, renovation weekends, cabin trips.",
    },
    member: {
      eyebrow: "Membership",
      h2: "Become a member.",
      lead: "The Skifreunde welcome new members of all generations. Annual fees:",
      tiers: [
        ["Adults", "€45"],
        ["Couples", "€65"],
        ["Families (up to age 14)", "€65"],
        ["Families (age 14+)", "€80"],
        ["Children & teenagers (without family membership)", "€25"],
        ["Pupils & students", "€30"],
        ["Pensioners", "€15"],
      ],
      ctaBox: {
        title: "Become a member — directly online.",
        body: "Create an account, apply for membership, the board reviews the request. Once approved, you can later have the annual fee automatically debited by SEPA direct debit or card.",
        ctaSignup: "Create account & apply →",
        ctaMember: "✓ You're a member — to account",
        ctaPending: "Your application is under review — see status",
        ctaPropose: "Apply for membership →",
        ctaMail: "Prefer email",
      },
    },
  },
  nl: {
    hero: {
      eyebrow: "Skifreunde Gütersloh e.V.",
      h1: "Sinds 1949 in beweging.",
      lead: "Opgericht door 124 ski-enthousiastelingen in Gütersloh, ruim zeven decennia gedragen door vrijwilligerswerk, verenigingsreizen en generaties die in Langewiese hun eerste skispoor trokken.",
    },
    profile: {
      eyebrow: "Verenigingsprofiel",
      h2: "Natuur. Beweging. Gemeenschap.",
      p1: "De Skifreunde Gütersloh werd in 1949 opgericht. Met de bouw van de hut in 1956 ontstond een gemeenschappelijke plek die tot vandaag gedragen wordt. De vereniging verbindt natuurbeleving, beweging en intergenerationeel engagement. De hut is het hart van dit verenigingsleven: een plek voor ontmoetingen, projecten, vrijwilligerswerk en pedagogisch werk.",
      p2: "Al in 1958 had de vereniging eerste oefenleiders; in de jaren 50 en 60 behoorden de Skifreunde tot de toonaangevende verenigingen van de West-Duitse Skibond. Verenigingskampioenschappen vinden sinds 1957 plaats in Langewiese — meer dan 40 jaar lang regelmatig.",
      portraitLabel: "Dr. Walter Hiersemann",
      portraitRole: "1e voorzitter (1949)",
    },
    timelineHeading: { eyebrow: "Tijdlijn", h2: "Een verenigingsgeschiedenis." },
    timeline: [
      { year: "1949", title: "Oprichting", body: "Op 26 oktober kwamen 124 ski-enthousiastelingen samen in herberg Schröder in Gütersloh en richtten de vereniging op. Eerste voorzitter: Dr. Walter Hiersemann. Inschrijving in het verenigingsregister op 4 november." },
      { year: "1956", title: "Aankoop hut in Langewiese", body: "De hut werd door Werner Teske inclusief inventaris voor 7.000 DM gekocht. Aanvankelijk sliepen er 15 mensen binnen, andere gasten op banken en in hangmatten. De vereniging telde 450 leden." },
      { year: "1958–1960", title: "Kelder met eigen handen uitgegraven", body: "Leden groeven de vloer met de hand uit met kolenschoppen." },
      { year: "1960", title: "Zijvleugel-aanbouw", body: "3.650 vrijwillige werkuren van de leden." },
      { year: "1968", title: "Verwarmingsinstallatie", body: "De skibussen vervoerden 453 personen naar Langewiese — een jaar later al 661." },
      { year: "1972", title: "Grondaankoop", body: "Ongeveer 2.000 m² inclusief helling." },
      { year: "1986", title: "Laatste grote uitbreiding", body: "Sindsdien 33 slaapplaatsen in 5 slaapkamers, 2 verblijfsruimtes, volledig ingerichte keuken, sanitair, skikelder." },
      { year: "Vandaag", title: "Een vereniging in beweging", body: "Skigymnastiek, verenigingsreizen, renovatieweekenden, ESG-schoolprojecten — gedragen door vrijwilligers en generaties." },
    ],
    active: {
      eyebrow: "Actieve verenigingstijd",
      h2: "Beweging & evenementen.",
      gymHeading: "Gymnastieklessen",
      gymH3: "Skigymnastiek met Alexandra Lütgert",
      gymBody: "Kracht, lenigheid, coördinatie en conditie — ideaal voor wie actief wil blijven. Dinsdag 18:30 en donderdag 20:00, proefles altijd mogelijk.",
      eventsHeading: "Evenementen",
      adventH3: "Adventkoffie",
      adventBody: "In het Spexarder Bauernhaus, georganiseerd door Karin Lütgert. Leden van alle generaties komen samen.",
      walkH3: "Grünkohl-wandeling & jaarvergadering",
      walkBody: "Traditionele winterwandeling met gezamenlijke maaltijd, jaarlijkse uitwisseling over verenigingsontwikkeling, renovatieweekenden, huttenreizen.",
    },
    member: {
      eyebrow: "Lidmaatschap",
      h2: "Lid worden.",
      lead: "De Skifreunde verwelkomen nieuwe leden van alle generaties. Jaarlijkse contributies:",
      tiers: [
        ["Volwassenen", "€ 45"],
        ["Echtparen", "€ 65"],
        ["Gezinnen (tot 14 jaar)", "€ 65"],
        ["Gezinnen (vanaf 14 jaar)", "€ 80"],
        ["Kinderen & jongeren (zonder gezinslidmaatschap)", "€ 25"],
        ["Scholieren & studenten", "€ 30"],
        ["Gepensioneerden", "€ 15"],
      ],
      ctaBox: {
        title: "Word lid — direct online.",
        body: "Account aanmaken, lidmaatschap aanvragen, het bestuur beoordeelt. Zodra bevestigd, kun je de jaarlijkse contributie eenvoudig laten incasseren via SEPA of kaart.",
        ctaSignup: "Account aanmaken & lid worden →",
        ctaMember: "✓ Je bent lid — naar account",
        ctaPending: "Je aanvraag wordt beoordeeld — status bekijken",
        ctaPropose: "Lidmaatschap aanvragen →",
        ctaMail: "Liever per mail",
      },
    },
  },
};

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
  cta,
}: {
  loggedIn: boolean;
  status: MemberCtaState["status"];
  cta: Copy["member"]["ctaBox"];
}) {
  const base =
    "inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline";
  const primary = "bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] hover:bg-white";
  if (!loggedIn) {
    return (
      <Link href="/registrieren" className={`${base} ${primary}`}>
        {cta.ctaSignup}
      </Link>
    );
  }
  if (status === "verified") {
    return (
      <Link href="/konto" className={`${base} ${primary}`}>
        {cta.ctaMember}
      </Link>
    );
  }
  if (status === "pending") {
    return (
      <Link href="/konto/profil" className={`${base} ${primary}`}>
        {cta.ctaPending}
      </Link>
    );
  }
  return (
    <Link href="/konto/profil" className={`${base} ${primary}`}>
      {cta.ctaPropose}
    </Link>
  );
}

export default async function VereinPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  const memberCta = await getMemberCtaState();

  return (
    <div>
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">{c.hero.eyebrow}</div>
          <h1 className="text-[var(--color-wh-snow)] mt-4 text-[44px] sm:text-[64px]">
            {c.hero.h1}
          </h1>
          <p className="text-[var(--color-wh-snow)]/85 max-w-2xl text-base sm:text-[18px] leading-relaxed mt-4">
            {c.hero.lead}
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">
          <div className="relative aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden">
            <Image
              src="/media/historical/walter-hiersemann.jpg"
              alt={c.profile.portraitLabel}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 400px, 100vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="text-[var(--color-wh-snow)] text-sm">
                {c.profile.portraitLabel}
                <span className="block text-xs opacity-80">{c.profile.portraitRole}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow">{c.profile.eyebrow}</div>
            <h2 className="text-[32px] sm:text-[40px] mt-3 mb-4">{c.profile.h2}</h2>
            <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-black)] m-0">
              {c.profile.p1}
            </p>
            <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-fg-muted)] mt-4">
              {c.profile.p2}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow">{c.timelineHeading.eyebrow}</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 sm:mt-4">{c.timelineHeading.h2}</h2>
          <ol className="mt-10 sm:mt-12 space-y-8 sm:space-y-10 border-l-2 border-[var(--color-wh-green)] pl-7 sm:pl-8">
            {c.timeline.map((t) => (
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
            <div className="eyebrow">{c.active.eyebrow}</div>
            <h2 className="text-[32px] sm:text-[40px] mt-3 mb-6">{c.active.h2}</h2>

            {/* Gymnastikkurse — eigener Sub-Heading, klar getrennt */}
            <div className="eyebrow text-[var(--color-wh-green)] mt-2">
              {c.active.gymHeading}
            </div>
            <h3 className="text-[20px] mt-2 mb-2">{c.active.gymH3}</h3>
            <p className="text-[var(--color-wh-fg-muted)] m-0">{c.active.gymBody}</p>

            {/* Sichtbare Trennung */}
            <div className="my-8 h-px bg-[var(--color-wh-winter-grey)]/60" />

            {/* Veranstaltungen — eigener Sub-Heading */}
            <div className="eyebrow text-[var(--color-wh-green)]">
              {c.active.eventsHeading}
            </div>
            <h3 className="text-[20px] mt-2 mb-2">{c.active.adventH3}</h3>
            <p className="text-[var(--color-wh-fg-muted)] m-0">{c.active.adventBody}</p>

            <h3 className="text-[20px] mt-6 mb-2">{c.active.walkH3}</h3>
            <p className="text-[var(--color-wh-fg-muted)] m-0">{c.active.walkBody}</p>
          </div>

          <ImageCarousel images={VEREINSAKTIVITAETEN_BILDER} aspectClass="aspect-[4/3]" />
        </div>
      </section>

      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">{c.member.eyebrow}</div>
          <h2 className="text-[var(--color-wh-snow)] text-[32px] sm:text-[40px] mt-3 mb-6">
            {c.member.h2}
          </h2>
          <p className="text-[var(--color-wh-snow)]/85 m-0 mb-8 max-w-2xl">{c.member.lead}</p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0">
            {c.member.tiers.map(([label, price]) => (
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
              {c.member.ctaBox.title}
            </p>
            <p className="text-[var(--color-wh-snow)]/85 m-0 mb-5 text-sm leading-relaxed">
              {c.member.ctaBox.body}
            </p>
            <div className="flex flex-wrap gap-3">
              <MemberCta
                loggedIn={memberCta.loggedIn}
                status={memberCta.status}
                cta={c.member.ctaBox}
              />
              <a
                href="mailto:info@skifreunde-gt.de"
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline border border-[var(--color-wh-snow)]/40 text-[var(--color-wh-snow)]/85 hover:bg-[var(--color-wh-snow)]/10"
              >
                {c.member.ctaBox.ctaMail}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
