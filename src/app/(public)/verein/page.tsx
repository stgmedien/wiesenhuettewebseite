import Image from "next/image";

export const metadata = {
  title: "Verein · Skifreunde Gütersloh e.V.",
  description:
    "1949 gegründet, seit 1956 Träger der Wiesenhütte in Langewiese. Skigymnastik, Adventskaffeetrinken, Grünkohlwanderung — und Generationen, die die Hütte erhalten.",
};

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

export default function VereinPage() {
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

          <div className="relative aspect-[4/3] rounded-[var(--radius-card)] overflow-hidden">
            <Image
              src="/media/historical/community.jpg"
              alt="Mitglieder beim gemütlichen Beisammensein"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 460px, 100vw"
            />
          </div>
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

          <p className="text-[var(--color-wh-snow)]/75 mt-8 text-sm">
            Aufnahmeantrag und Datenschutzerklärung als PDF: bitte direkt anfragen unter
            <a className="text-[var(--color-wh-snow)] ml-1" href="mailto:info@skifreunde-gt.de">
              info@skifreunde-gt.de
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
