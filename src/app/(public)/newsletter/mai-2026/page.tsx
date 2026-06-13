import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Newsletter Mai 2026 · Skifreunde Gütersloh e.V.",
  description:
    "Ausgabe 1: Neue Homepage online, Vorstand wiedergewählt, Vereinsfahrt nach Langewiese, Sport mit Alex und mehr — Neuigkeiten der Skifreunde Gütersloh e.V.",
};

/** Editorial-Zeile: Bild und Text nebeneinander, Seite alternierend. */
function FeatureRow({
  kicker,
  title,
  imgSrc,
  imgAlt,
  reverse = false,
  children,
}: {
  kicker: string;
  title: string;
  imgSrc: string;
  imgAlt: string;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
      <div className={reverse ? "md:order-2" : ""}>
        <div className="eyebrow text-[var(--color-wh-green)]">{kicker}</div>
        <h2 className="text-[28px] sm:text-[34px] mt-2 mb-4 leading-tight">{title}</h2>
        <div className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-black)] space-y-4">
          {children}
        </div>
      </div>
      <div
        className={`relative aspect-[4/3] rounded-[var(--radius-card)] overflow-hidden ${
          reverse ? "md:order-1" : ""
        }`}
      >
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 520px, 100vw"
        />
      </div>
    </div>
  );
}

export default function NewsletterMai2026Page() {
  return (
    <div>
      {/* ---------------------------------------------------------------- */}
      {/* HERO */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="relative w-full bg-[var(--color-wh-deep-green)] min-h-[360px] sm:min-h-0 sm:aspect-[16/9] md:aspect-[21/9]"
        style={{ maxHeight: "540px" }}
      >
        <Image
          src="/media/photos/aerial-1.jpg"
          alt="Luftbild der Wiesenhütte in Langewiese"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(47,74,53,0.82)] via-[rgba(47,74,53,0.3)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 sm:px-8 pb-6 sm:pb-10 md:pb-12">
          <div className="max-w-[1080px] mx-auto">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-white/90">
              Skifreunde Gütersloh e.V. · Newsletter Mai 2026 · Ausgabe 1
            </div>
            <h1 className="text-[28px] sm:text-[44px] md:text-[58px] mt-1.5 sm:mt-2 leading-[1.05] text-white drop-shadow-md font-display font-bold">
              Neues aus Langewiese.
            </h1>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* NEU ONLINE */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-green)]">Neu online</div>
          <h2 className="text-[30px] sm:text-[40px] mt-2 mb-4 leading-tight">
            Unsere neue Homepage ist online.
          </h2>
          <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-black)]">
            Schülerinnen und Schüler des ESG-Ehrenamtsprojekts haben sie gestaltet: frische
            Fotos, Drohnenvideos, alle Vereinsinformationen, ein neues Buchungsportal — und
            eine eigene Seite zu den Schulprojekten in Langewiese.
          </p>
          <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-fg-muted)] mt-5 mb-3 font-medium">
            Was Ihr dort findet:
          </p>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {[
              "Hütteninfos, Ausstattung und Lage auf einen Blick",
              "Online-Buchung: Verfügbarkeit prüfen und anfragen",
              "Alles rund um den Verein und die Mitgliedschaft",
              "Das Schulprojekt mit dem ESG — mit Projekttagebuch",
              "Blog und Neuigkeiten aus Langewiese",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-base sm:text-[17px] text-[var(--color-wh-black)]"
              >
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--color-wh-green)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-card)] p-6">
            <p className="m-0 text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-black)]">
              Habt Ihr Aktivitäten, Fotos oder Erlebnisse aus dem Vereinsleben, die auf die
              Seite gehören?{" "}
              <Link
                href="/kontakt"
                className="text-[var(--color-wh-deep-green)] font-semibold underline underline-offset-2 hover:no-underline"
              >
                Meldet Euch
              </Link>{" "}
              — wir nehmen sie gerne auf.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* NEWS — Vorstand wiedergewählt */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow text-[var(--color-wh-green)]">News</div>
          <h2 className="text-[28px] sm:text-[34px] mt-2 mb-4 leading-tight">
            Vorstand wiedergewählt.
          </h2>
          <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-black)]">
            Auf der Mitgliederversammlung am 27. April 2026 wurde unser Vorstandsteam
            wiedergewählt. Wir freuen uns auf die gemeinsame Arbeit und danken Euch für das
            Vertrauen.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            {["Horst", "Johannes", "Norbert", "Tanja", "Thorsten"].map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-[var(--color-wh-winter-grey)] text-sm font-semibold text-[var(--color-wh-deep-green)]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* RÜCKBLICK — Vereinsfahrt */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <FeatureRow
          kicker="Rückblick"
          title="Vereinsfahrt nach Langewiese."
          imgSrc="/media/photos/landscape.jpg"
          imgAlt="Landschaft rund um die Wiesenhütte in Langewiese"
        >
          <p className="m-0">
            Am 5. Juli 2026 sind wir gemeinsam nach Langewiese gefahren. Ein gelungener Tag an
            unserem Hüttenort — danke an alle, die dabei waren.
          </p>
        </FeatureRow>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* VEREINSORGA — Danke Inge & Paul */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <FeatureRow
          kicker="Vereinsorga"
          title="Danke, Inge & Paul."
          imgSrc="/media/photos/interior-7593.jpg"
          imgAlt="Gemütlicher Aufenthaltsraum der Wiesenhütte"
          reverse
        >
          <p className="m-0">
            Unser Vermietungsteam Inge und Paul hat sich entschieden, seinen Posten nach vielen
            treuen Jahren abzugeben. Das fällt uns nicht leicht.
          </p>
          <p className="m-0">
            Wir sind zutiefst dankbar für alles, was die beiden über so viele Jahre für den
            Verein geleistet haben — in guten wie in schwierigen Zeiten, und nicht zuletzt in
            den letzten Jahren des Aufbruchs. Vielen lieben Dank, Inge und Paul.
          </p>
        </FeatureRow>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SPORT & NEUE AKTION — zwei kompakte Karten */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
            <div className="eyebrow text-[var(--color-wh-green)]">Sport in Gütersloh</div>
            <h3 className="text-[22px] mt-2 mb-3">Sei dabei — mit Alex!</h3>
            <p className="text-base leading-relaxed text-[var(--color-wh-black)] m-0">
              Wir haben ein tolles Sportangebot mit unserer Trainerin Alex. Zwei feste Termine
              pro Woche — <strong>dienstags und donnerstags</strong>. Komm endlich wieder mit!
            </p>
            <p className="text-base leading-relaxed text-[var(--color-wh-fg-muted)] mt-3 mb-0">
              Schick uns Deine Telefonnummer{" "}
              <Link
                href="/kontakt"
                className="text-[var(--color-wh-deep-green)] font-semibold underline underline-offset-2 hover:no-underline"
              >
                über die Kontaktseite
              </Link>{" "}
              — Du erhältst dann alle Termine und kannst unkompliziert Bescheid geben, wenn Du
              dabei sein möchtest.
            </p>
          </div>

          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
            <div className="eyebrow text-[var(--color-wh-green)]">Neue Aktion</div>
            <h3 className="text-[22px] mt-2 mb-3">Skifreunde im Wapelbad.</h3>
            <p className="text-base leading-relaxed text-[var(--color-wh-black)] m-0">
              Details folgen in Kürze — haltet Euch den Termin frei. Mehr Infos gibt es bald{" "}
              <Link
                href="/kontakt"
                className="text-[var(--color-wh-deep-green)] font-semibold underline underline-offset-2 hover:no-underline"
              >
                über die Kontaktseite
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* ÖFFENTLICHKEIT — Leben und Lernen in Langewiese */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <FeatureRow
          kicker="Skifreunde in der Öffentlichkeit"
          title="Leben und Lernen in Langewiese."
          imgSrc="/media/photos/ESG_Bild_1.jpg"
          imgAlt="Skifreunde und ESG in Langewiese"
        >
          <p className="m-0">
            Unter diesem Motto haben wir uns bei der Schuleinweihung des neuen ESG und beim Tag
            der offenen Tür vorgestellt. Die Besucherinnen und Besucher waren begeistert — und
            die Resonanz hat uns gezeigt: Dieser Ort verdient mehr Sichtbarkeit.
          </p>
          <div className="bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-card)] p-5">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-1">
              Nächster Termin · 12. Juni 2026
            </div>
            <p className="m-0 text-[15px] leading-relaxed text-[var(--color-wh-black)]">
              <strong>175 Jahre ESG · Schulfest.</strong> Wir sind mit unserem Stand dabei.
              Besucht uns — und bringt gerne Menschen mit, die unsere Hütte noch nicht kennen.
            </p>
          </div>
        </FeatureRow>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FOOTER-CTA */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[820px] mx-auto text-center">
          <h2 className="text-[26px] sm:text-[32px] text-[var(--color-wh-snow)] mb-3">
            Fragen oder Ideen für Mitglieder-Angebote?
          </h2>
          <p className="text-[var(--color-wh-snow)]/85 m-0 mb-7">
            Wir freuen uns über jede Rückmeldung aus dem Verein.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] hover:bg-white"
            >
              Kontakt aufnehmen
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold no-underline border border-[var(--color-wh-snow)]/40 text-[var(--color-wh-snow)]/90 hover:bg-white/10"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
