import Image from "next/image";
import { PhotoGallery } from "@/components/public/PhotoGallery";
import { FeaturedQuote } from "@/components/public/FeaturedQuote";
import { CommunityEntryCard, type CommunityEntryView } from "@/components/public/CommunityEntryCard";
import { CommunitySubmitForm } from "@/components/public/CommunitySubmitForm";
import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { db } from "@/lib/db";
import { communityEntries } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getServerLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ESG-Projekt · Wiesenhütte als Lernort",
  description:
    "Schülerinnen und Schüler der Mittelstufe des ESG Gütersloh nutzen die Wiesenhütte als pädagogischen Lernort. Selbstorganisation, Naturerfahrung, Verantwortung — abseits des Klassenzimmers.",
};

const TOC = [
  { id: "einstieg", label: "Eine Schule, eine Hütte" },
  { id: "tagebuch", label: "Projekttagebuch" },
  { id: "jahrgaenge", label: "Was Mittelstufe an der Hütte tut" },
  { id: "anekdoten", label: "Anekdoten der Schüler:innen" },
  { id: "stimmen", label: "Kontakt zur Hüttenarbeit" },
  { id: "lernort", label: "Wie aus einer Hütte ein Lernort wird" },
  { id: "fragen", label: "Häufige Elternfragen" },
  { id: "traeger", label: "Wer trägt die Hüttenarbeit" },
];

const FEUERSTELLE_BILDER = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
  src: `/media/photos/feuerstelle_${i}.jpg`,
  alt: `Feuerstelle vor der Wiesenhütte — Bauphase ${i}`,
}));

const PROJEKTFAHRT_BILDER = [
  { src: "/media/photos/projektfahrten/zusammen_essen_kochen.jpeg", alt: "Schüler:innen kochen zusammen in der Hütten-Küche" },
  { src: "/media/photos/projektfahrten/fruestueck_gemeinsam.jpeg", alt: "Gemeinsames Frühstück am großen Tisch" },
  { src: "/media/photos/projektfahrten/eine_bank_wird_gebaut.jpeg", alt: "Eine Holzbank wird gebaut" },
  { src: "/media/photos/projektfahrten/bank_wird_gebaut_2.jpeg", alt: "Schüler beim Bau der Bank" },
  { src: "/media/photos/projektfahrten/fertige_bank.jpeg", alt: "Die fertige selbstgebaute Bank" },
  { src: "/media/photos/projektfahrten/jacken_haenger_bauen.jpeg", alt: "Bau einer Garderoben-Leiste" },
  { src: "/media/photos/projektfahrten/maedchen_boehrt.jpeg", alt: "Schülerin bohrt mit der Akkuschraubmaschine" },
  { src: "/media/photos/projektfahrten/maedchen_schrauben_in_ein_brett.jpeg", alt: "Schülerinnen schrauben in ein Brett" },
  { src: "/media/photos/projektfahrten/voegelhaeurser_bemalen.jpeg", alt: "Vogelhäuser werden bemalt" },
  { src: "/media/photos/projektfahrten/insektenhotel_vogelhaeuser.jpeg", alt: "Selbstgebautes Insektenhotel und bunte Vogelhäuser an der Hütte" },
  { src: "/media/photos/projektfahrten/vogelhaus_bemalt.jpeg", alt: "Bunt bemaltes Vogelhaus mit Baum- und Blumenmotiv" },
  { src: "/media/photos/projektfahrten/baumbank_bau.jpeg", alt: "Schüler:innen bauen eine Rundbank um den Baum vor der Hütte" },
  { src: "/media/photos/projektfahrten/baumbank_fertig.jpeg", alt: "Die fertige Baumbank mit Blick über die Wiese" },
  { src: "/media/photos/projektfahrten/holzarbeiten.jpeg", alt: "Schülerin und Betreuer bei Holzarbeiten vor der Hütte" },
];

export default async function EsgPage() {
  const locale = await getServerLocale();
  // Schüler-Anekdoten — approved entries vom Community-Feed
  const anekdotenRows = await db
    .select({
      id: communityEntries.id,
      authorName: communityEntries.authorName,
      authorContext: communityEntries.authorContext,
      title: communityEntries.title,
      body: communityEntries.body,
      photoUrls: communityEntries.photoUrls,
      visitDate: communityEntries.visitDate,
      submittedAt: communityEntries.submittedAt,
    })
    .from(communityEntries)
    .where(
      and(
        eq(communityEntries.kind, "schulprojekt"),
        eq(communityEntries.status, "approved")
      )
    )
    .orderBy(desc(communityEntries.submittedAt))
    .limit(50);
  const anekdoten: CommunityEntryView[] = anekdotenRows;

  return (
    <div>
      <DeOnlyBanner locale={locale} />
      {/* ---------------------------------------------------------------- */}
      {/* HERO BILD — Kollaboration ESG × Wiesenhütte */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="relative w-full bg-[var(--color-wh-deep-green)] min-h-[380px] sm:min-h-0 sm:aspect-[16/9] md:aspect-[21/9]"
        style={{ maxHeight: "560px" }}
      >
        <Image
          src="/media/photos/kollaboration_esg_skifreunde.png"
          alt="Kollaboration zwischen Evangelisch Stiftischem Gymnasium und Skifreunden Gütersloh"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(47,74,53,0.78)] via-[rgba(47,74,53,0.25)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 sm:px-8 pb-6 sm:pb-10 md:pb-12">
          <div className="max-w-[1080px] mx-auto">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-white/90">
              ESG · Evangelisch Stiftisches Gymnasium
            </div>
            <h1 className="text-[26px] sm:text-[40px] md:text-[56px] lg:text-[60px] mt-1.5 sm:mt-2 leading-[1.1] sm:leading-[1.05] text-white drop-shadow-md font-display font-bold">
              Eine Schule, eine Hütte,<br className="hidden sm:block" /> ein gemeinsames Lernen.
            </h1>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 1. Einstieg — Lead-Text */}
      {/* ---------------------------------------------------------------- */}
      <section id="einstieg" className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[1080px] mx-auto">
          <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-black)] max-w-2xl">
            Die Wiesenhütte in Langewiese gehört dem Verein Skifreunde Gütersloh e.V. — und
            steht allen offen: Vereine, Familien, Schulen und andere Gruppen buchen sie als
            Selbstversorgerhütte. Das Evangelisch Stiftische Gymnasium, eine Gütersloher
            Schule, nutzt sie seit einigen Jahren als außerschulischen Lernort und darf sie
            dabei aktiv mitgestalten. Ein Vorrecht ist das nicht: Diesen Gestaltungsraum
            öffnen wir gern auch für andere Schulen.
          </p>
          <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-black)] max-w-2xl mt-4">
            Hier gilt eine einfache Beobachtung: <strong>Manches lernt man nur dort, wo das
            Klassenzimmer aufhört.</strong> Wenn Lerngruppen für ein paar Tage selbst kochen,
            Holz schichten, am Lagerfeuer Stockbrot drehen und miteinander durch Konflikte
            gehen, geschieht etwas, das zu Persönlichkeitsbildung wird — und nicht nur zu
            Stoff. Genau dafür gibt es die Hütte.
          </p>
          {/* Einladung an weitere Schulen + Verweis auf den Kontaktabschnitt (#stimmen) */}
          <div className="mt-6 bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-card)] p-5 sm:p-6 max-w-2xl">
            <p className="text-[15px] sm:text-base leading-relaxed text-[var(--color-wh-black)] m-0">
              <strong>Ihr seid eine Schule und möchtet die Wiesenhütte als Lernort nutzen — und
              vielleicht eigene Ideen mit einbringen?</strong> Genau dafür ist sie da. Meldet Euch
              bei der Hüttenarbeit, dann denken wir gemeinsam mit Euch, wie ein Projekt für Eure
              Klassen aussehen könnte.{" "}
              <a
                href="#stimmen"
                className="text-[var(--color-wh-deep-green)] font-semibold underline underline-offset-2 hover:no-underline"
              >
                Kontakt zur Hüttenarbeit →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* TOC */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-10 border-y border-[var(--color-wh-winter-grey)]">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow mb-3">Auf dieser Seite</div>
          <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {TOC.map((t, i) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="text-[15px] text-[var(--color-wh-deep-green)] hover:underline no-underline flex gap-2 items-baseline"
              >
                <span className="font-mono text-xs opacity-60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. PROJEKTTAGEBUCH — jetzt früh, damit man konkrete Projekte sieht */}
      {/* ---------------------------------------------------------------- */}
      <section id="tagebuch" className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Projekttagebuch · „Aus der Hütte"</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-4 leading-tight">
            Reportagen aus der Wiesenhütte.
          </h2>
          <div className="max-w-2xl mb-12">
            <p className="text-[17px] leading-relaxed text-[var(--color-wh-black)]">
              In Langewiese wird gebaut, geschraubt, gestrichen und ab und zu auch wieder
              abgerissen. Was hier entsteht, hat einen Zweck und bleibt stehen: Eine
              Feuerstelle wärmt, eine Baumbank trägt. Das verändert das Lernen. Es gibt
              keine Noten — dafür Wetter, Materialkosten und Mitschüler:innen, auf die man
              sich verlassen muss. Wer mitmacht, merkt meist von selbst, dass sich Kopf und
              Hand hier nicht trennen lassen und dass ein Projekt nur so gut wird wie die
              Gruppe, die es trägt.
            </p>
            <p className="text-[17px] leading-relaxed text-[var(--color-wh-black)] mt-4">
              Nicht jede Klasse kommt zum Bauen. Manche verbringen erlebnispädagogische
              Tage, bei denen zählt, was zwischen den Beteiligten passiert: Aufgaben, die
              sich nur gemeinsam lösen lassen oder über die eigenen Grenzen gehen.
            </p>
            <p className="text-[var(--color-wh-fg-muted)] text-[15px] mt-4">
              Diese Reportagen zeigen, was an der Hütte konkret entsteht. Wer den
              pädagogischen Hintergrund vertiefen möchte, findet weiter unten die
              Konzept-Abschnitte.
            </p>
          </div>

          {/* Eintrag 1: Feuerstelle der Klasse 9e */}
          <article className="mb-20">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
              Eintrag 1
            </div>
            <h3 className="text-[28px] sm:text-[32px] mt-0 mb-6 leading-tight">
              Die Feuerstelle der Klasse 9e.
            </h3>

            {/* Galerie 8 Bilder — klickbar mit Lightbox-Carousel */}
            <div className="mb-8">
              <PhotoGallery
                images={FEUERSTELLE_BILDER}
                gridClassName="grid-cols-2 sm:grid-cols-4"
                sizes="(min-width: 640px) 250px, 50vw"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-[18px] text-[var(--color-wh-deep-green)] mb-2">
                  Was war das Projekt?
                </h4>
                <p className="prose-block">
                  Im Schuljahr 2024/25 hat die Klasse 9e des ESG eine neue Feuerstelle vor der
                  Wiesenhütte geplant, gebaut und an die Schul- und Vereinsgemeinschaft
                  übergeben. Heute ist sie der Ort, an dem nahezu jede Hüttenfahrt einen ihrer
                  wichtigsten Abende verbringt.
                </p>

                <h4 className="font-semibold text-[18px] text-[var(--color-wh-deep-green)] mt-6 mb-2">
                  Wie ist es entstanden?
                </h4>
                <p className="prose-block">
                  Die Idee kam aus einer Klassenkonferenz: Vor der Hütte fehlte ein Ort, an dem man
                  abends sitzen kann. Aus dieser Beobachtung wurde im Unterricht ein
                  Projektauftrag. Die Klasse hat in Kleingruppen gearbeitet:
                </p>
                <ul className="prose-block list-disc pl-5 mt-2 space-y-1.5">
                  <li>
                    <strong>Recherche & Genehmigung:</strong> Auflagen für eine offene Feuerstelle
                    in Langewiese, Verhandlung mit Gemeinde und Skifreunden Gütersloh.
                  </li>
                  <li>
                    <strong>Entwurf:</strong> Skizzen, Materialliste, Bauablauf — Mathematik,
                    Kunst und Werken in dieser Phase verschränkt.
                  </li>
                  <li>
                    <strong>Bau:</strong> An zwei Hütten-Wochenenden vor Ort. Jede:r Schüler:in
                    war an mindestens einem Bauschritt beteiligt — vom Ausheben der Grube bis zum
                    Schichten der Steine.
                  </li>
                  <li>
                    <strong>Übergabe & Einweihung:</strong> Die Klasse 9e hat die fertige
                    Feuerstelle in einem kleinen Akt der Schulgemeinschaft und den Skifreunden
                    übergeben.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[18px] text-[var(--color-wh-deep-green)] mb-2">
                  Was wurde dabei gelernt?
                </h4>
                <ul className="prose-block list-disc pl-5 space-y-3">
                  <li>
                    Wie viele Steine es braucht, bis eine Feuerstelle steht. Wie schwer eine
                    Schubkarre voll Sand ist. Wie genau eine Wasserwaage sein muss.
                  </li>
                  <li>
                    Projektmanagement im Kleinen: Phasenplanung, Zuständigkeiten, Pufferzeiten,
                    Umgang mit dem Wetter.
                  </li>
                  <li>
                    Wie sich ein Erfolg anfühlt, der nicht in einer Note endet. Und wer in
                    einer Krise einspringt, wenn jemand keine Lust mehr hat.
                  </li>
                  <li>
                    Eine Woche körperliche Arbeit, in der Schüler:innen, die im Klassenraum
                    oft eher still sind, plötzlich Schlüsselrollen übernommen haben.
                  </li>
                </ul>

              </div>
            </div>
          </article>

          {/* Eintrag 2: Projektfahrt der 9b */}
          <article className="mb-20 border-t border-[var(--color-wh-winter-grey)] pt-12">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
              Eintrag 2
            </div>
            <h3 className="text-[28px] sm:text-[32px] mt-0 mb-3 leading-tight">
              Projektfahrt der 9b — Mehr als eine Klassenfahrt.
            </h3>
            <p className="text-[15px] text-[var(--color-wh-fg-muted)] m-0 mb-8 italic">
              Eine Erfahrung des ESG Gütersloh in der Hütte der Skifreunde Gütersloh e.V. ·
              Erfahrungsumfrage Mai 2026 mit 20 Gästen (15–16 Jahre, 100 % Rücklauf).
            </p>

            {/* Foto-Galerie 12 Bilder — klickbar mit Lightbox-Carousel */}
            <div className="mb-10">
              <PhotoGallery
                images={PROJEKTFAHRT_BILDER}
                gridClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                sizes="(min-width: 1024px) 250px, (min-width: 640px) 33vw, 50vw"
              />
            </div>

            {/* Lead */}
            <div className="prose-block max-w-3xl">
              <p>
                Die Wiesenhütte in Langewiese ist für das Evangelisch Stiftische Gymnasium
                Gütersloh kein gewöhnlicher Ausflugsort. Sie ist ein Lernraum eigener Art: Eine
                Klasse zieht für mehrere Tage in eine Hütte mitten im Wald, kocht selbst,
                organisiert sich selbst, gestaltet ihre Abende selbst — und nimmt am Ende mehr mit
                als jede Schulstunde vermitteln könnte. Was das ESG hier mit seinen Schülerinnen
                und Schülern erlebt, ist <strong>Selbstversorgung als Schule fürs Leben</strong>.
              </p>
            </div>

            {/* Selbstversorgung */}
            <h4 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-10 mb-3">
              Selbstversorgung als pädagogisches Format
            </h4>
            <div className="prose-block max-w-3xl">
              <p>
                In der Wiesenhütte gibt es keinen Hotelservice, keine Animation, kein Programm aus
                der Konserve. Stattdessen: ein Küchenteam aus den eigenen Reihen, gemeinsame
                Abende, gemeinsame Verantwortung. Genau dieses Selber-Machen wird von den
                Schülerinnen und Schülern als das prägende Element erlebt.
              </p>
            </div>
            <div className="prose-block max-w-3xl mt-6">
              <p>
                Das Küchenteam wird namentlich gelobt — nicht ein anonymer Caterer, sondern
                Mitschülerinnen und Mitschüler, die füreinander kochen. Genau das ist der Punkt:
                Wer für zwanzig andere kocht, lernt etwas über Mengen, Planung, Verlässlichkeit —
                und über sich selbst.
              </p>
            </div>

            {/* Bewertungs-Stats */}
            <h4 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-10 mb-4">
              Was die Schülerinnen und Schüler erleben
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <RatingBox
                label="Gemeinschaft"
                rating="4,1"
                text={`11 von 20 Gästen bewerten das Gemeinschaftsgefühl mit „Sehr gut". Mit deutlichem Abstand das meistgenannte Lob der gesamten Umfrage — und es entsteht genau dort, wo Selbstorganisation gefragt ist: am Abend, in der Küche, im Schlafsaal.`}
              />
              <RatingBox
                label="Lage"
                rating="3,8"
                text="Die Hütte liegt mitten im Sauerland, umgeben von Wald und Wiese. 12 von 20 Gästen nennen die Umgebung explizit als Highlight — und keine einzige Antwort kritisiert sie."
              />
            </div>

            {/* ----------------------------------------------------------- */}
            {/* HIGHLIGHT-ZITATE — Original-Stimmen aus der Erfahrungsumfrage */}
            {/* ----------------------------------------------------------- */}
            <div className="my-16 sm:my-20">
              <div className="text-center mb-10 sm:mb-14">
                <div className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--color-wh-deep-green)]/80">
                  <span className="inline-block w-8 h-px bg-[var(--color-wh-deep-green)]/40" />
                  Original-Zitate aus der 9b
                  <span className="inline-block w-8 h-px bg-[var(--color-wh-deep-green)]/40" />
                </div>
                <h4 className="font-display font-bold text-[26px] sm:text-[34px] text-[var(--color-wh-deep-green)] mt-3 mb-0 leading-tight">
                  Was die Schüler:innen selbst sagen.
                </h4>
              </div>
              <div className="space-y-10 sm:space-y-14">
                <FeaturedQuote
                  text="Der Wald liegt direkt nebenan, und das Programm war so, dass jeder Spaß hatte."
                  author="Lena Brinkmann"
                  role="Schülerin der 9b · 16 Jahre"
                  align="left"
                  delayMs={0}
                />
                <FeaturedQuote
                  text="Abends kann man dort gut Gemeinschaftsspiele spielen und die Nacht ausklingen lassen. Das Miteinander hat richtig Spaß gemacht."
                  author="Jonas Friedrich"
                  role="Schüler der 9b · 16 Jahre"
                  align="right"
                  delayMs={150}
                />
              </div>
            </div>

            {/* 10er-Betten */}
            <h4 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-10 mb-3">
              Die 10er-Betten — Gemeinschaft im Schlafsaal
            </h4>
            <div className="prose-block max-w-3xl">
              <p>
                Die großen Schlafsäle sind ein Format, das es kaum noch irgendwo gibt — und genau
                deshalb funktioniert es. Vier Gäste heben sie ausdrücklich hervor. Wer in einem
                Zehnerzimmer schläft, lernt Rücksicht, Geduld und das Aushalten von Nähe. Das sind
                Kompetenzen, die in keinem Lehrplan stehen — und die im echten Leben jeden Tag
                gebraucht werden.
              </p>
            </div>

            {/* ESG */}
            <h4 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-10 mb-3">
              Was das ESG hier möglich macht
            </h4>
            <div className="prose-block max-w-3xl">
              <p>
                Das ESG Gütersloh nutzt die Wiesenhütte als das, was sie sein kann: einen Ort, an
                dem Schülerinnen und Schüler für ein paar Tage erwachsen werden dürfen. Sie
                übernehmen Verantwortung für die Versorgung der Gruppe, sie gestalten ihren
                Tagesablauf, sie lösen kleine Probleme, ohne dass Eltern oder Lehrkräfte sie ihnen
                abnehmen. Die Hütte stellt den Rahmen — die Klasse füllt ihn selbst.
              </p>
              <p>
                Die Umfrageergebnisse zeigen: Diese Form von Klassenfahrt hinterlässt Eindruck.
                Nicht wegen eines Programms, sondern wegen der Erfahrung, sich selbst und die
                Gruppe zu organisieren. Das Programm ist hier eben nicht von außen vorgegeben,
                sondern entsteht aus der Klasse heraus.
              </p>
            </div>

            {/* Fazit */}
            <div className="bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] rounded-r-[var(--radius-md)] p-6 mt-10 max-w-3xl">
              <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-2">
                Fazit
              </p>
              <p className="text-[15px] leading-relaxed m-0">
                Die Wiesenhütte ist für das ESG Gütersloh ein Lernort, der das leistet, was Schule
                allein nicht kann: <strong>Selbstversorgung, Gemeinschaft und Eigenverantwortung
                in einem realen Setting erfahrbar machen.</strong> Wald, Wiese, Schlafsaal, eigene
                Küche — das ist die Bühne, auf der eine Klasse für ein paar Tage so etwas wie ein
                eigener kleiner Haushalt wird. Und genau das nehmen die Schülerinnen und Schüler
                — und die Lehrkräfte — mit nach Hause.
              </p>
            </div>
          </article>

          {/* ESBlog-Teaser — Artikel der 8a in der digitalen Schülerzeitung */}
          <div className="mt-12 bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-card)] p-6 sm:p-7 max-w-3xl">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-3">
              Aus der Schülerzeitung
            </div>
            <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[var(--color-wh-deep-green)] mt-0 mb-3 leading-snug">
              Vier Tage Chaos, Spaß und Abenteuer.
            </h3>
            <p className="text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0 mb-4">
              Die 8a des ESG war in Langewiese — und hat direkt selbst darüber geschrieben. Ein
              Artikel in der digitalen Schülerzeitung des ESG, aus Schülersicht.
            </p>
            <a
              href="https://esblog.de/blog/2026/05/22/8a-on-tour-vier-tage-chaos-spass-und-abenteuer/#more-27583"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--color-wh-deep-green)] font-semibold text-[15px] underline underline-offset-2 hover:no-underline"
            >
              Zum Artikel im ESBlog →
            </a>
            <p className="text-[13px] text-[var(--color-wh-fg-muted)] mt-4 mb-0">
              Mit dabei: Frau Rapp und Frau Bannert.
            </p>
          </div>

          <p className="text-[15px] text-[var(--color-wh-fg-muted)] italic mt-8 border-t border-[var(--color-wh-winter-grey)] pt-6">
            <strong>Mehr Einträge folgen.</strong> Die Klassen, AGs und Stufen, die nach der Hütte
            zurückkommen, sind eingeladen, eigene Beiträge fürs Projekttagebuch zu schreiben. So
            entsteht über Jahre eine kleine Chronik der Wiesenhütte als ESG-Lernort.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. Was die Mittelstufe tut */}
      {/* ---------------------------------------------------------------- */}
      <section id="jahrgaenge" className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Mittelstufe</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-6 leading-tight">
            Was Mittelstufe an der Hütte tut.
          </h2>
          <div className="prose-block max-w-3xl">
            <p>
              Am ESG fährt <strong>die Mittelstufe</strong> zur Wiesenhütte. Wir fahren immer
              <strong> unter der Woche, meist drei Tage</strong> — kompakt genug, dass es in den
              Schulalltag passt, lang genug, dass etwas hängenbleibt.
            </p>
            <p>
              An der Hütte gestalten die Schüler:innen ihren Alltag selbst. Sie kochen für die
              Gruppe, schichten Holz, machen Feuer, drehen am Abend Stockbrot über der
              Glut, grillen, räumen auf. Selbstversorgung ist nicht nebenbei — sie ist Teil des
              Programms. Wer für zwölf Hungrige Mittagessen kocht, lernt Verantwortung anders
              als im Hauswirtschafts-Stundenplan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
              <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
                Alltag gestalten
              </div>
              <h3 className="font-display font-bold text-[22px] text-[var(--color-wh-deep-green)] mt-0 mb-3">
                Selbst kochen, selbst heizen.
              </h3>
              <p className="text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0">
                Die Gruppe übernimmt die Hütte für drei Tage. Frühstück, Mittagessen, Abendbrot
                — alles wird gemeinsam gekocht. Wer einkauft, wer kocht, wer abspült: das
                organisiert die Klasse. Holz machen, Feuer in der Lagerfeuerstelle,
                aufräumen — auch das gehört dazu. Am Abend: Stockbrot, Lagerfeuer, Reflexion.
              </p>
            </div>

            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
              <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
                Eigene Projekte
              </div>
              <h3 className="font-display font-bold text-[22px] text-[var(--color-wh-deep-green)] mt-0 mb-3">
                Schüler:innen pitchen ihre Ideen.
              </h3>
              <p className="text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0">
                Wenn eine Klasse ein Projekt an der Hütte anstoßen will — Feuerstelle bauen, Raum
                renovieren, Naturweg anlegen — pitcht sie ihre Idee dem Vorstand der Skifreunde
                Gütersloh. Der Vorstand steht mit Rat, Tat und (wo nötig) Finanzierung zur Seite.
                Das ist die Erlaubnisstruktur der Hüttenarbeit: Schüler:innen denken, Verein
                trägt mit. Die Feuerstelle der Klasse 9e ist genau so entstanden (siehe
                Projekttagebuch oben).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Anekdoten — Schüler:innen schreiben selbst (mit Moderation) */}
      {/* ---------------------------------------------------------------- */}
      <section id="anekdoten" className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[760px] mx-auto">
          <div className="eyebrow">Anekdoten der Schüler:innen</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-3 leading-tight">
            Was wir mitgenommen haben.
          </h2>
          <p className="text-[var(--color-wh-fg-muted)] text-[16px] max-w-2xl mb-10">
            Klassen, die an der Hütte waren, hinterlassen hier ihre Erinnerungen. Die Einträge
            werden vor Veröffentlichung gesichtet — der Rest entsteht aus den Klassen heraus.
          </p>

          {anekdoten.length === 0 ? (
            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-8 text-center mb-10">
              <p className="text-[var(--color-wh-fg-muted)] italic m-0">
                Noch keine Einträge — bist Du Schüler:in einer Klasse, die kürzlich da war?
                Schreib unten den ersten Beitrag.
              </p>
            </div>
          ) : (
            <div className="space-y-6 mb-12">
              {anekdoten.map((e) => (
                <CommunityEntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}

          <CommunitySubmitForm
            kind="schulprojekt"
            contextPlaceholder="z.B. Klasse 9b, ESG Gütersloh"
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. Kontakt zur Hüttenarbeit */}
      {/* ---------------------------------------------------------------- */}
      <section id="stimmen" className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          {/* Kontakt */}
          <div>
            <div className="eyebrow mb-2">Kontakt zur Hüttenarbeit</div>
            <p className="text-[15px] text-[var(--color-wh-fg-muted)] max-w-2xl mb-6">
              Die Brücke zwischen Schule und Verein wird im Vorstand der Skifreunde Gütersloh von
              zwei ESG-Lehrkräften mitgehalten — gerne als Ansprechpartner für Klassen-Pitches
              und organisatorische Fragen.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ContactRow
                imgSrc="/media/photos/tanja-milse-portrait-gruen.png"
                imgAlt="Tanja Milse"
                name="Tanja Milse"
                role="Vorstand Skifreunde · Lehrkraft ESG"
                email="mil@esg-guetersloh.de"
              />
              <ContactRow
                imgSrc="/media/photos/johannes-leiskau-portrait-gruen.png"
                imgAlt="Johannes Leiskau"
                name="Johannes Leiskau"
                role="Vorstand Skifreunde · Lehrkraft ESG"
                email="lei@esg-guetersloh.de"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Wie aus einer Hütte ein Lernort wird */}
      {/* ---------------------------------------------------------------- */}
      <section id="lernort" className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Prozess</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-6 leading-tight">
            Wie aus einer Hütte ein Lernort wird.
          </h2>
          <p className="prose-block">
            Eine Hüttenfahrt am ESG hat drei Phasen: <strong>Vorbereitung, Aufenthalt,
            Nachbereitung</strong>. Erst alle drei zusammen machen sie zu einem Lernort.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <PhaseCard
              num="01"
              title="Vor der Fahrt"
              subtitle="Hineinwachsen in den Lernort"
              points={[
                "Inhaltliche Verzahnung mit dem Unterricht",
                "Vorbereitungsrunden in der Klasse",
                "Elternkontakt mit Notfallplan",
                "Sicherheits-Briefing der Lehrkräfte",
              ]}
            />
            <PhaseCard
              num="02"
              title="An der Hütte"
              subtitle="Drei Tage gemeinsam"
              points={[
                "Selbstversorgung: kochen, abspülen, Holz machen",
                "Tagesblock: Wandern, Werken, Projekt",
                "Bewegung im Sauerland-Wald",
                "Stockbrot, Lagerfeuer, Gespräche",
                "Reflexion am Abend, kein Minutenplan",
              ]}
            />
            <PhaseCard
              num="03"
              title="Nach der Fahrt"
              subtitle="Reflexion und Anschluss"
              points={[
                "Reflexionsstunde in der Klasse",
                "Anschluss an den Unterricht",
                "Bericht an die Schulgemeinschaft",
                "Bei Bedarf: individuelle Nachgespräche",
              ]}
            />
          </div>

          <p className="prose-block max-w-3xl mt-12 text-[15px] text-[var(--color-wh-fg-muted)] italic">
            Wir geben bewusst keinen Minutenplan vor. Jede Klasse füllt die drei Tage anders —
            mit ihrer Lehrkraft, mit ihrem Projekt, mit ihrem eigenen Rhythmus. Was bleibt, ist:
            morgens gemeinsam frühstücken, abends ans Lagerfeuer, dazwischen das, was die
            Gruppe sich vorgenommen hat.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 8. FAQ */}
      {/* ---------------------------------------------------------------- */}
      <section id="fragen" className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[800px] mx-auto">
          <div className="eyebrow">Häufige Fragen</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-10 leading-tight">
            Was Eltern wissen wollen.
          </h2>

          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 cursor-pointer"
              >
                <summary className="font-semibold text-[16px] sm:text-[17px] text-[var(--color-wh-deep-green)] list-none flex items-start justify-between gap-4">
                  <span>{f.q}</span>
                  <span className="text-2xl leading-none text-[var(--color-wh-deep-green)] group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <div
                  className="mt-3 text-[15px] leading-relaxed text-[var(--color-wh-black)] [&_strong]:text-[var(--color-wh-black)]"
                  dangerouslySetInnerHTML={{ __html: f.a }}
                />
              </details>
            ))}
          </div>

          {/* Eltern-Teaser: Mitgliedschaft = Gestaltungsraum */}
          <div className="mt-10 bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-card)] p-6 sm:p-7">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
              Für Eltern
            </div>
            <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[var(--color-wh-deep-green)] mt-0 mb-2">
              Mitgestalten statt nur zuschauen.
            </h3>
            <p className="text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0 mb-4">
              Als Mitglied der Skifreunde Gütersloh bekommt Ihr echten Gestaltungsraum: bei
              der Hütte, bei den Projekten Eurer Kinder und in einer Vereinsgemeinschaft,
              die diesen Ort seit über 70 Jahren trägt. Dazu nutzt Ihr die Hütte zu
              reduzierten Konditionen — die Skigymnastik ist inklusive.
            </p>
            <a
              href="/mitglied-werden"
              className="inline-flex items-center h-11 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold text-sm hover:bg-[var(--color-wh-green)] transition-colors"
            >
              Mitglied werden →
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 9. Träger — dunkler Schluss-Block */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="traeger"
        className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24"
      >
        <div className="max-w-[1080px] mx-auto">
          <div className="text-xs uppercase tracking-wider text-[var(--color-wh-snow)]/85 font-semibold">
            Wer trägt die Hüttenarbeit
          </div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-6 leading-tight text-[var(--color-wh-snow)]">
            Ein starkes Gespann.
          </h2>
          <p className="text-[17px] leading-relaxed max-w-3xl text-[var(--color-wh-snow)]/90">
            Die Hüttenarbeit am ESG ist getragen von zwei Säulen — Verein und Schule. Das
            ist keine Selbstverständlichkeit. Sie funktioniert, weil über Jahre ein Vertrauen
            zwischen Verein, Schule und Eltern gewachsen ist.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
            <PillarCard
              num="1"
              title="Skifreunde Gütersloh e.V."
              body="Stellen die Hütte bereit, halten sie instand, garantieren den Hüttenwart, und sind seit 70+ Jahren ihr Rückgrat."
            />
            <PillarCard
              num="2"
              title="Lehrkräfte des ESG"
              body="Tragen die pädagogische Konzeption, planen, begleiten und reflektieren die Fahrten."
            />
          </div>

          <p className="text-[15px] mt-10 text-[var(--color-wh-snow)]/75 italic">
            Wir sind dankbar, dass das so ist.
          </p>
        </div>
      </section>
    </div>
  );
}

// ====================================================================
// Daten
// ====================================================================

const FAQS = [
  {
    q: "Wann finden die Hüttenfahrten statt?",
    a: "Wir fahren <strong>immer unter der Woche</strong>, meist drei Tage. Das hält die Fahrt schulalltagstauglich und schont das Wochenende der Eltern.",
  },
  {
    q: "Was kostet eine Hüttenfahrt für ESG-Lerngruppen?",
    a: "Wichtig zur Unterscheidung: <strong>Eine 'Lerngruppe' ist eine ESG-Gruppe, die in der Hütte ein konkretes Projekt umsetzt</strong> (Werkstatt, Forschungswoche, Sozialprojekt etc.). Normale Klassenfahrten fallen NICHT darunter und werden wie jede andere Buchung abgerechnet. Für anerkannte Lerngruppen gilt: Die Skifreunde Gütersloh stellen die <strong>Hütte selbst kostenfrei</strong> zur Verfügung — die Übernachtungskosten entfallen. <strong>Kurtaxe und Energiepauschale werden allerdings auch hier weiter berechnet</strong>, weil sie nicht uns zustehen (Kurbeitrag Hochsauerland) bzw. realen Verbrauch decken (Strom/Heizung). Eltern zahlen also: Kurtaxe + Energiepauschale + Anreise + Verpflegung. Die Verpflegung wird gemeinsam eingekauft und gekocht, was die Gesamtkosten niedrig hält. <strong>Eltern, für die selbst das eng ist, wenden sich vertraulich an die Klassenleitung.</strong>",
  },
  {
    q: "Mein Kind hat eine Allergie / besondere Ernährung — geht das?",
    a: "Ja. Die Hüttenküche ist groß genug, um mehrere Bedürfnisse parallel zu bedienen. Wir fragen vor der Fahrt explizit ab und planen entsprechend.",
  },
  {
    q: "Mein Kind ist sehr schüchtern / hatte schon mal Heimweh. Was passiert dann?",
    a: "Heimweh ist Teil des Lernens, wird aber sensibel gehandhabt. Lehrkräfte kennen das Kind aus dem Schulalltag und sind erreichbar, ein erstes Gespräch erfolgt früh. Im seltenen Notfall erfolgt selbstverständlich Rücksprache mit den Eltern.",
  },
  {
    q: "Was, wenn mein Kind nicht möchte / krank wird?",
    a: "Wir besprechen das individuell. Eine Hüttenfahrt ist Teil des Schulprogramms, aber niemand wird gegen seinen Willen in eine Überforderung gezwungen.",
  },
  {
    q: "Wie passt das zum Schulprogramm des ESG?",
    a: "Das ESG ist ein evangelisches, humanistisches Gymnasium — eine Gütersloher Schule mit einem Profil, das Persönlichkeitsbildung, Verantwortung und Gemeinschaft ernst nimmt. Die Hüttenarbeit ist eine konkrete Übersetzung dieses Profils. Sie ist nicht zusätzlich zum Schulprogramm — sie ist Teil davon.",
  },
  {
    q: "Wer trägt die Hütte?",
    a: "Die Wiesenhütte gehört dem Verein <strong>Skifreunde Gütersloh e.V.</strong>, gegründet 1949, der die Hütte seit 1956 betreibt. Das ESG nutzt die Hütte in Kooperation mit den Skifreunden — die jahrzehntelange Pflege durch den Verein ist die Grundlage dafür, dass die Hütte heute steht und genutzt werden kann.",
  },
  {
    q: "An wen kann ich mich mit Fragen wenden?",
    a: "Erste Anlaufstelle ist immer die <strong>Klassenleitung</strong>. Für vereinsseitige Fragen rund um die Wiesenhütte stehen <a href=\"mailto:mil@esg-guetersloh.de\">Tanja Milse</a> und <a href=\"mailto:lei@esg-guetersloh.de\">Johannes Leiskau</a> zur Verfügung — beide sind Lehrkräfte am ESG und gleichzeitig im Vorstand der Skifreunde Gütersloh e.V.",
  },
];

// ====================================================================
// Hilfs-Komponenten
// ====================================================================

function PhaseCard({
  num,
  title,
  subtitle,
  points,
}: {
  num: string;
  title: string;
  subtitle: string;
  points: string[];
}) {
  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
      <div className="font-mono text-xs text-[var(--color-wh-fg-muted)] mb-2">Phase {num}</div>
      <h4 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-0 mb-1">
        {title}
      </h4>
      <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-4 italic">{subtitle}</p>
      <ul className="list-none p-0 m-0 space-y-2">
        {points.map((p) => (
          <li key={p} className="text-[14px] flex gap-2 items-start">
            <span className="text-[var(--color-wh-deep-green)] font-bold shrink-0">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function YearCard({
  year,
  title,
  body,
}: {
  year: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
        {year}
      </div>
      <h4 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-0 mb-3">
        {title}
      </h4>
      <p className="text-[14px] leading-relaxed text-[var(--color-wh-black)] m-0">{body}</p>
    </div>
  );
}

function ContactCard({
  imgSrc,
  imgAlt,
  name,
  roles,
  email,
  quote,
}: {
  imgSrc: string;
  imgAlt: string;
  name: string;
  roles: string[];
  email: string;
  quote: string;
}) {
  return (
    <div className="bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
      <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] gap-4 sm:gap-5 items-start mb-5">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white shrink-0">
          <Image
            src={imgSrc}
            alt={imgAlt}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div>
          <p className="font-display font-bold text-[20px] sm:text-[22px] text-[var(--color-wh-deep-green)] m-0">
            {name}
          </p>
          {roles.map((r) => (
            <p key={r} className="text-[13px] text-[var(--color-wh-fg-muted)] m-0">
              {r}
            </p>
          ))}
          <a
            href={`mailto:${email}`}
            className="inline-block mt-2 text-[14px] text-[var(--color-wh-deep-green)] underline hover:opacity-70"
          >
            {email}
          </a>
        </div>
      </div>
      <p className="text-[15px] sm:text-[16px] leading-relaxed italic m-0 text-[var(--color-wh-black)] border-l-2 border-[var(--color-wh-deep-green)] pl-4">
        „{quote}"
      </p>
    </div>
  );
}

function ContactRow({
  imgSrc,
  imgAlt,
  name,
  role,
  email,
}: {
  imgSrc: string;
  imgAlt: string;
  name: string;
  role: string;
  email: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] px-4 py-3">
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white shrink-0">
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-[15px] text-[var(--color-wh-deep-green)] m-0 leading-tight">
          {name}
        </p>
        <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 leading-tight">
          {role}
        </p>
        <a
          href={`mailto:${email}`}
          className="text-[13px] text-[var(--color-wh-deep-green)] hover:underline break-all"
        >
          {email}
        </a>
      </div>
    </div>
  );
}

function PillarCard({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-[var(--radius-card)] p-6">
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-snow)]/75 font-semibold mb-2">
        Säule {num}
      </div>
      <h3 className="font-display font-bold text-[20px] mb-3 text-[var(--color-wh-snow)]">
        {title}
      </h3>
      <p className="text-[15px] leading-relaxed text-[var(--color-wh-snow)]/90 m-0">{body}</p>
    </div>
  );
}

function RatingBox({
  label,
  rating,
  text,
}: {
  label: string;
  rating: string;
  text: string;
}) {
  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold">
          {label}
        </span>
        <span className="font-display font-bold text-[28px] text-[var(--color-wh-deep-green)] leading-none">
          Ø {rating}
        </span>
        <span className="text-[12px] text-[var(--color-wh-fg-muted)]">/ 5</span>
      </div>
      <p className="text-[14px] leading-relaxed text-[var(--color-wh-black)] m-0">{text}</p>
    </div>
  );
}
