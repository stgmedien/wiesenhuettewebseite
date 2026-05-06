import Image from "next/image";

export const metadata = {
  title: "ESG-Projekt · Wiesenhütte als Lernort",
  description:
    "Schülerinnen und Schüler der Mittelstufe des ESG Gütersloh nutzen die Wiesenhütte als pädagogischen Lernort. Selbstorganisation, Naturerfahrung, Verantwortung — abseits des Klassenzimmers.",
};

const TOC = [
  { id: "einstieg", label: "Eine Schule, eine Hütte" },
  { id: "tagebuch", label: "Projekttagebuch" },
  { id: "jahrgaenge", label: "Was die Mittelstufe tut" },
  { id: "ansprechpartner", label: "Ansprechpartner & Stimmen" },
  { id: "paedagogik", label: "Pädagogische Idee" },
  { id: "lernort", label: "Wie aus einer Hütte ein Lernort wird" },
  { id: "sicherheit", label: "Begleitung & Sicherheit" },
  { id: "fragen", label: "Häufige Elternfragen" },
  { id: "traeger", label: "Wer trägt die Hüttenarbeit" },
];

const FEUERSTELLE_BILDER = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
  src: `/media/photos/feuerstelle_${i}.jpg`,
  alt: `Feuerstelle vor der Wiesenhütte — Bauphase ${i}`,
}));

export default function EsgPage() {
  return (
    <div>
      {/* ---------------------------------------------------------------- */}
      {/* HERO BILD — Kollaboration ESG × Wiesenhütte */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative w-full bg-[var(--color-wh-deep-green)]" style={{ aspectRatio: "21 / 9", maxHeight: "560px" }}>
        <Image
          src="/media/photos/kollaboration_esg_skifreunde.png"
          alt="Kollaboration zwischen Evangelisch Stiftischem Gymnasium und Skifreunden Gütersloh"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(47,74,53,0.65)] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 sm:px-8 pb-8 sm:pb-12">
          <div className="max-w-[1080px] mx-auto">
            <div className="text-xs uppercase tracking-wider font-semibold text-white/85">
              ESG · Evangelisch Stiftisches Gymnasium
            </div>
            <h1 className="text-[40px] sm:text-[60px] mt-2 leading-[1.05] text-white drop-shadow-md">
              Eine Schule, eine Hütte,<br className="hidden sm:block" /> ein gemeinsames Lernen.
            </h1>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 1. Einstieg — Lead-Text */}
      {/* ---------------------------------------------------------------- */}
      <section id="einstieg" className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-start">
          <div>
            <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-black)] max-w-2xl">
              Die Wiesenhütte in Langewiese ist keine Klassenfahrt-Adresse. Sie ist ein
              außerschulischer Lernort des Evangelisch Stiftischen Gymnasiums Gütersloh —
              getragen seit Generationen vom Verein Skifreunde Gütersloh, geöffnet seit einigen
              Jahren auch für die pädagogische Arbeit des ESG.
            </p>
            <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-black)] max-w-2xl mt-4">
              Hier gilt eine einfache Beobachtung: <strong>Manches lernt man nur dort, wo das
              Klassenzimmer aufhört.</strong> Wenn Schüler:innen für eine Woche selbst kochen,
              Holz schichten, miteinander durch Konflikte gehen und am Ende des Tages am Feuer
              stehen, geschieht etwas, das zu Persönlichkeitsbildung wird — und nicht nur zu
              Stoff. Genau dafür gibt es die Hütte.
            </p>
          </div>
          <div className="relative w-40 sm:w-56 md:w-64 aspect-[3/2] shrink-0">
            <Image
              src="/media/logos/esg-175.jpg"
              alt="175 Jahre Evangelisch Stiftisches Gymnasium"
              fill
              className="object-contain"
              sizes="(min-width: 768px) 256px, 224px"
            />
          </div>
        </div>
      </section>

      {/* In Kürze */}
      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">In Kürze</div>
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">
            {[
              "Eigene Hütte in Langewiese (Hochsauerland), 33 Schlafplätze, Selbstversorgung",
              "Genutzt für Klassen-, Stufen- und AG-Fahrten der Mittelstufe (Klasse 7–9)",
              "Pädagogisches Leitbild: Pestalozzis Trias Kopf – Herz – Hand, ergänzt um den Fuß",
              "Eingebettet in das Schulprofil des ESG — evangelisch, humanistisch, neugierig",
              "Getragen durch Lehrkräfte, den Förderverein und die Skifreunde Gütersloh",
            ].map((t) => (
              <li
                key={t}
                className="bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] px-4 py-3 text-[15px]"
              >
                {t}
              </li>
            ))}
          </ul>
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
          <p className="text-[var(--color-wh-fg-muted)] text-[16px] max-w-2xl mb-12">
            Diese Reportagen zeigen, was an der Hütte konkret entsteht. Wer den pädagogischen
            Hintergrund vertiefen möchte, findet weiter unten die Konzept-Abschnitte.
          </p>

          {/* Eintrag 1: Feuerstelle der Klasse 9e */}
          <article className="mb-20">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
              Eintrag 1
            </div>
            <h3 className="text-[28px] sm:text-[32px] mt-0 mb-6 leading-tight">
              Die Feuerstelle der Klasse 9e.
            </h3>

            {/* Galerie 8 Bilder */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8">
              {FEUERSTELLE_BILDER.map((img) => (
                <div
                  key={img.src}
                  className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-wh-beige)]"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(min-width: 640px) 250px, 50vw"
                  />
                </div>
              ))}
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
                  Die Idee kam aus einer Klassenkonferenz: „Vor der Hütte fehlt etwas, an dem man
                  abends sitzen kann." Aus dieser Beobachtung wurde im Unterricht ein
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
                <ul className="prose-block list-none p-0 space-y-3">
                  <li>
                    <strong className="text-[var(--color-wh-deep-green)]">Hand:</strong> Wie viele
                    Steine es braucht, bis eine Feuerstelle steht. Wie schwer eine Schubkarre voll
                    Sand ist. Wie genau eine Wasserwaage sein muss.
                  </li>
                  <li>
                    <strong className="text-[var(--color-wh-deep-green)]">Kopf:</strong>{" "}
                    Projektmanagement im Kleinen: Phasenplanung, Zuständigkeiten, Pufferzeiten,
                    Umgang mit dem Wetter.
                  </li>
                  <li>
                    <strong className="text-[var(--color-wh-deep-green)]">Herz:</strong> Wie sich
                    ein Erfolg anfühlt, der nicht in einer Note endet. Wer in einer Krise
                    einspringt, wenn jemand keine Lust mehr hat.
                  </li>
                  <li>
                    <strong className="text-[var(--color-wh-deep-green)]">Fuß:</strong> Eine Woche
                    körperliche Arbeit, in der Schüler:innen, die im Klassenraum oft eher still
                    sind, plötzlich Schlüsselrollen übernommen haben.
                  </li>
                </ul>

                <div className="mt-6 bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] rounded-r-[var(--radius-md)] p-5">
                  <p className="m-0 text-[15px] italic">
                    „Wir haben jetzt etwas hier, das auch noch da ist, wenn wir längst Abi haben."
                  </p>
                  <p className="m-0 mt-2 text-[13px] text-[var(--color-wh-fg-muted)]">
                    — aus der Reflexionsrunde der Klasse 9e
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Eintrag 2 */}
          <article className="mb-16 border-t border-[var(--color-wh-winter-grey)] pt-12">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
              Eintrag 2
            </div>
            <h3 className="text-[24px] sm:text-[28px] mt-0 mb-4 leading-tight">
              Renovierung eines Schlafraums.
            </h3>
            <div className="prose-block">
              <p>
                Eine Klasse hat einen Schlafraum der Hütte gründlich gereinigt, gestrichen und neu
                gestaltet. Aus einem benutzten, aber nicht mehr einladenden Raum wurde ein
                gemütlicher Schlafraum. Die Klasse hat über die Farbwahl abgestimmt, das Material
                gemeinsam mit dem Hüttenwart bestellt, und an einem Wochenende selbst gestrichen.
              </p>
              <p>
                <strong>Lernanlass:</strong> Verantwortung für gemeinsame Räume. Die Erfahrung,
                dass eine Klasse einen Raum ihrer Schule (und ihres Vereins) verändert — nicht
                durch Vorschlag, sondern durch eigene Hand.
              </p>
            </div>
          </article>

          {/* Eintrag 3 */}
          <article className="mb-12 border-t border-[var(--color-wh-winter-grey)] pt-12">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-2">
              Eintrag 3
            </div>
            <h3 className="text-[24px] sm:text-[28px] mt-0 mb-4 leading-tight">
              Naturerkundung rund um Langewiese.
            </h3>
            <div className="prose-block">
              <p>
                Eine Doppeljahrgangsstufe hat eine zweitägige Naturerkundung gemacht: Bestimmen
                von Pflanzen und Spuren, Vermessen einer Geländeformation, Kartierung eines
                Bachlaufs. Begleitend: ein Lese- und Reflexionsabend zu Hartmut Rosas
                Resonanzbegriff — was heißt es, einer Landschaft wirklich zu begegnen, statt sie
                nur zu fotografieren?
              </p>
              <p>
                <strong>Lernanlass:</strong> Genaues Hinsehen. Die Erfahrung, dass eine Wiese mehr
                Pflanzenarten enthält, als man denkt — wenn man sich Zeit nimmt.
              </p>
            </div>
          </article>

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
          <div className="eyebrow">Jahrgänge</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-6 leading-tight">
            Was die Mittelstufe an der Hütte tut.
          </h2>
          <p className="prose-block">
            Am ESG fährt <strong>die Mittelstufe</strong> (Klasse 7–9) zur Wiesenhütte. Eine
            Hüttenfahrt in Klasse 7 hat einen anderen Sinn als in Klasse 9 — wir erläutern die
            jahrgangsspezifischen Schwerpunkte unten. Klasse 5/6 und Oberstufe nutzen andere
            Lernformate; die Hütte ist bewusst der Mittelstufen-Lernort.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <YearCard
              year="Klasse 7"
              title="Verantwortung übernehmen"
              body="Die erste Hüttenfahrt: Aus 28 Einzelkindern wird eine Klasse. Schwerpunkt sind Gemeinschaft, Tagesstruktur, Selbstständigkeit (Kofferpacken bis Bett machen), erste Wanderung mit Karte. Reflexion am Ende: Welche Rolle übernehme ich in der Klasse — und welche möchte ich?"
            />
            <YearCard
              year="Klasse 8"
              title="Konflikte aushalten"
              body="In der Pubertät spitzen sich Klassendynamiken zu. Die Hütte gibt Raum, in dem Konflikte nicht ausgesessen werden können. Schwerpunkt ist soziale Kompetenz, Selbstorganisation, ein erstes größeres Projekt (z. B. Renovierung eines Raums, Naturkartierung)."
            />
            <YearCard
              year="Klasse 9"
              title="Ein eigenes Projekt verantworten"
              body="Die Hütte ist Bühne für ein eigenständig verantwortetes Projekt. Beispiel: Klasse 9e hat 2025 die Feuerstelle vor der Hütte geplant, gebaut und übergeben (siehe Projekttagebuch oben). Schwerpunkt: Projektkompetenz, handwerkliches Arbeiten, Übergabe an die Schulgemeinschaft."
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. Ansprechpartner & Stimmen */}
      {/* ---------------------------------------------------------------- */}
      <section id="ansprechpartner" className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Ansprechpartner</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-4 leading-tight">
            Wer trägt diese Brücke zwischen Schule und Verein.
          </h2>
          <p className="prose-block max-w-2xl mb-10">
            Die Kooperation zwischen ESG und den Skifreunden Gütersloh wird von Menschen
            getragen, die in beiden Welten zu Hause sind: <strong>Tanja Milse</strong> und{" "}
            <strong>Johannes Leiskau</strong> sind <strong>Vorstände der Skifreunde
            Gütersloh e.V.</strong> und gleichzeitig <strong>Lehrkräfte am ESG</strong>. Sie sind
            erste Ansprechpartner für alles, was die Hüttenarbeit am ESG betrifft — für Klassen,
            Eltern und Kolleg:innen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
            <ContactCard
              imgSrc="/media/photos/tanja-milse-portrait-gruen.png"
              imgAlt="Tanja Milse, Lehrkraft am ESG und Vorständin der Skifreunde Gütersloh"
              name="Tanja Milse"
              roles={[
                "Vorstand · Skifreunde Gütersloh e.V.",
                "Lehrkraft · ESG Gütersloh",
              ]}
              email="mil@esg-guetersloh.de"
              quote="Ich kenne die Klasse seit Klasse 5. Aber drei Tage Hütte zeigen mir mehr über meine Klasse als ein halbes Schuljahr Unterricht. Nicht weil der Unterricht schlecht wäre — weil die Hütte etwas anderes ist."
            />
            <ContactCard
              imgSrc="/media/photos/johannes-leiskau-portrait-gruen.png"
              imgAlt="Johannes Leiskau, Lehrkraft am ESG und Vorstand der Skifreunde Gütersloh"
              name="Johannes Leiskau"
              roles={[
                "Vorstand · Skifreunde Gütersloh e.V.",
                "Lehrkraft · ESG Gütersloh",
              ]}
              email="lei@esg-guetersloh.de"
              quote="Wir sehen Schüler:innen an der Hütte in Rollen, die im Klassenzimmer kaum sichtbar sind. Wer in Mathe eher still ist, organisiert plötzlich die ganze Küche. Das verschiebt etwas — nicht nur in der Klasse, sondern auch in unserem Bild von ihr."
            />
          </div>

          <div className="border-t border-[var(--color-wh-winter-grey)] pt-12">
            <div className="eyebrow mb-3">Stimmen aus der Hütte</div>
            <h3 className="text-[24px] sm:text-[28px] mt-0 mb-8 leading-tight">
              Schüler:innen und Eltern.
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
                <p className="text-[17px] sm:text-[19px] leading-relaxed italic m-0 text-[var(--color-wh-deep-green)]">
                  „Am Anfang dachte ich, das ist nur Schaufeln. Aber als wir dann am letzten Abend
                  dasaßen, mit dem Feuer, das wir selber gebaut haben — das war anders als alles,
                  was wir vorher in der Schule gemacht haben."
                </p>
                <p className="m-0 mt-4 text-[13px] text-[var(--color-wh-fg-muted)]">
                  — Eine Schülerin der Klasse 9
                </p>
              </div>
              <div className="bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
                <p className="text-[17px] sm:text-[19px] leading-relaxed italic m-0 text-[var(--color-wh-deep-green)]">
                  „Sie kam zurück und konnte erklären, warum sie weniger Streit mit ihrer
                  Schwester hatte. Sie hat etwas mitgebracht, das man auch zuhause merkt. Und das
                  war keine Klassenfahrtsstimmung — das war ein Stück Reife."
                </p>
                <p className="m-0 mt-4 text-[13px] text-[var(--color-wh-fg-muted)]">
                  — Eine Mutter, nach der ersten Hüttenfahrt ihrer Tochter (Klasse 7)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 5. Pädagogische Idee — Konzept-Block */}
      {/* ---------------------------------------------------------------- */}
      <section id="paedagogik" className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Pädagogische Idee</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-6 leading-tight">
            Kopf · Herz · Hand · Fuß.
          </h2>
          <p className="prose-block max-w-2xl text-[var(--color-wh-fg-muted)]">
            Die folgenden Abschnitte erläutern den pädagogischen Hintergrund, vor dem die oben
            beschriebenen Projekte entstehen. Wer das Gesamtbild sucht, ist hier richtig.
          </p>

          <h3 className="text-[22px] sm:text-[26px] mt-12 mb-3">
            Warum überhaupt ein außerschulischer Lernort?
          </h3>
          <div className="prose-block">
            <p>
              Schule lebt von einem Versprechen: dass Bildung mehr ist als Stoffvermittlung. Mehr
              als Noten. Mehr als die Optimierung von G8-Wochenstunden. Dass Schule auch dazu da
              ist, Menschen zu bilden — mit Verstand, Werten und der Fähigkeit, in der Welt etwas
              zu tun.
            </p>
            <p>
              Dieses Versprechen lässt sich im Klassenraum nur teilweise einlösen. Manches braucht{" "}
              <strong>andere Räume, andere Zeiten, andere Aufgaben</strong>: ein Wochenende ohne
              Schulglocke, eine Küche, in der zwölf Hungrige bedient werden wollen, einen Wald, in
              dem das Smartphone keinen Empfang hat, ein Lagerfeuer, an dem Gespräche entstehen,
              die unter Zeitdruck nicht entstanden wären.
            </p>
            <p>Die Wiesenhütte ist ein solcher anderer Raum.</p>
          </div>

          <h3 className="text-[22px] sm:text-[26px] mt-12 mb-3">Pestalozzis Trias — und der Fuß</h3>
          <div className="prose-block">
            <p>
              Wir lehnen uns an eine pädagogische Tradition an, die im deutschsprachigen Raum eine
              lange Linie hat. <strong>Johann Heinrich Pestalozzi</strong> (1746–1827) hat sie auf
              eine einfache Formel gebracht: Bildung gelingt, wenn drei Dimensionen zusammenwirken.
            </p>
            <ul>
              <li>
                <strong>Kopf</strong> — das Denken, das Verstehen, das Reflektieren.
              </li>
              <li>
                <strong>Herz</strong> — das Fühlen, die Werte, die Verantwortung füreinander.
              </li>
              <li>
                <strong>Hand</strong> — das Tun, die praktische Geschicklichkeit, das Hervorbringen.
              </li>
            </ul>
            <p>
              In der Hüttenarbeit ergänzen wir diese Trias um eine vierte Dimension: den{" "}
              <strong>Fuß</strong>. Damit meinen wir alles, was mit Bewegung, mit Ortwechsel, mit
              dem Hinausgehen aus der Schul- und Stadtroutine zu tun hat. Der Fuß ist die
              Lerndimension, die in einer sitzenden, zunehmend bildschirmgebundenen Schule am
              leichtesten verloren geht.
            </p>
          </div>

          <h4 className="text-[18px] sm:text-[20px] mt-10 mb-4 font-semibold text-[var(--color-wh-deep-green)]">
            Was das konkret an der Hütte heißt
          </h4>

          <div className="hidden md:block overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-wh-winter-grey)] bg-white">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="bg-[var(--color-wh-snow)] text-left">
                  <th className="p-4 font-semibold w-[120px]">Dimension</th>
                  <th className="p-4 font-semibold">Was Schüler:innen tun</th>
                  <th className="p-4 font-semibold">Was sie dabei lernen</th>
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map((d) => (
                  <tr
                    key={d.dim}
                    className="border-t border-[var(--color-wh-winter-grey)] align-top"
                  >
                    <td className="p-4 font-bold text-[var(--color-wh-deep-green)]">{d.dim}</td>
                    <td className="p-4 leading-relaxed">{d.tun}</td>
                    <td className="p-4 leading-relaxed text-[var(--color-wh-fg-muted)]">
                      {d.lernen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden grid gap-3">
            {DIMENSIONS.map((d) => (
              <div
                key={d.dim}
                className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5"
              >
                <div className="font-bold text-[var(--color-wh-deep-green)] text-[18px] mb-2">
                  {d.dim}
                </div>
                <p className="m-0 text-[14px] mb-2">
                  <strong>Was sie tun:</strong> {d.tun}
                </p>
                <p className="m-0 text-[14px] text-[var(--color-wh-fg-muted)]">
                  <strong>Was sie lernen:</strong> {d.lernen}
                </p>
              </div>
            ))}
          </div>

          <p className="prose-block mt-8 text-[15px]">
            Diese vier Dimensionen sind keine Programmpunkte, die wir abhaken. Sie sind ein
            Kompass: Eine Hüttenfahrt, an der nur eine der vier Dimensionen vorkommt, wäre keine
            gute Hüttenfahrt. Sie sind außerdem ein Korrektiv — wenn eine Klasse zum Beispiel im
            Kopf-Modus festhängt, lenken wir bewusst auf Hand oder Fuß um.
          </p>

          <h3 className="text-[22px] sm:text-[26px] mt-12 mb-3">
            Mit wem wir pädagogisch im Gespräch sind
          </h3>
          <div className="prose-block">
            <p>
              Wir stehen mit unserer Praxis nicht alleine. Mehrere pädagogische Traditionen tragen
              das, was an der Hütte geschieht.
            </p>
            <ul>
              {PADAGOGEN.map((p) => (
                <li key={p.name} className="mb-3">
                  <strong>{p.name}</strong> {p.intro && `— ${p.intro}`}
                  <br />
                  <span className="text-[var(--color-wh-fg-muted)]">{p.text}</span>
                </li>
              ))}
            </ul>
            <p className="text-[14px] text-[var(--color-wh-fg-muted)] italic">
              Diese Verankerungen erwähnen wir nicht, um zu imponieren. Sie sind
              Selbstverpflichtung: Was wir an der Hütte machen, soll diesem Niveau standhalten.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
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
              subtitle="Ein typischer Tag"
              points={[
                "Frühdienst & Frühstück gemeinsam",
                "Morgenkreis: Was steht heute an?",
                "Vormittag: Wandern, Werken, Renovieren",
                "Nachmittag: Bewegung & Projektarbeit",
                "Abend: Reflexionsrunde am Lagerfeuer",
              ]}
            />
            <PhaseCard
              num="03"
              title="Nach der Fahrt"
              subtitle="Reflexion und Anschluss"
              points={[
                "Reflexionsstunde in der Klasse",
                "Anschluss an den Unterricht",
                "Bericht an Förderverein & Schulgemeinschaft",
                "Bei Bedarf: individuelle Nachgespräche",
              ]}
            />
          </div>

          <h3 className="text-[22px] sm:text-[26px] mt-16 mb-4">An der Hütte — ein Tag</h3>
          <div className="bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden">
            {DAY_SCHEDULE.map((d, i) => (
              <div
                key={d.time}
                className={`flex flex-col sm:flex-row gap-2 sm:gap-6 px-5 sm:px-6 py-4 ${
                  i !== DAY_SCHEDULE.length - 1
                    ? "border-b border-[var(--color-wh-winter-grey)]"
                    : ""
                }`}
              >
                <div className="font-mono text-[13px] text-[var(--color-wh-deep-green)] font-bold w-full sm:w-32 shrink-0 pt-0.5">
                  {d.time}
                </div>
                <div className="text-[15px] leading-relaxed">{d.text}</div>
              </div>
            ))}
          </div>
          <p className="text-[14px] text-[var(--color-wh-fg-muted)] mt-4 italic">
            Dieser Rhythmus erlaubt Konzentration und Erholung im Wechsel. Er ist kein Plan zum
            Abhaken, sondern ein Gerüst, das die Klasse füllt.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 7. Begleitung, Sicherheit, Inklusion */}
      {/* ---------------------------------------------------------------- */}
      <section id="sicherheit" className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Eltern-Block</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-6 leading-tight">
            Begleitung, Sicherheit & Inklusion.
          </h2>
          <p className="prose-block text-[var(--color-wh-fg-muted)] italic">
            Diese Seite ist für die Eltern, die — zu Recht — fragen: „Wie konkret läuft das
            eigentlich?"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <SafetyBlock
              title="Begleitung"
              body={
                <>
                  Pro Klasse mindestens <strong>zwei Lehrkräfte</strong>, in der Regel
                  Klassenleitung plus eine zusätzliche Lehrkraft, geschlechtergemischt. In der
                  Mittelstufe können — wo sinnvoll — Schul-Sozialarbeiter:innen ergänzend
                  mitfahren. Lehrkräfte sind <strong>Lernbegleiter:innen</strong>: sie
                  strukturieren, halten Räume offen, intervenieren in Konflikten und ermöglichen
                  Verantwortungsübernahme.
                </>
              }
            />
            <SafetyBlock
              title="Sicherheit"
              body={
                <>
                  Mindestens zwei Begleitpersonen mit aktuellem Erste-Hilfe-Schein. Notfallplan
                  mit Hüttenwart Werner Klauke (mobil 01516 7448273), Polizei, Notarzt 112,
                  ärztlicher Bereitschaftsdienst 116117, St. Franziskus Hospital Winterberg
                  (02981/8020). Klassenleitung ist während der Fahrt 24/7 für Eltern erreichbar.
                </>
              }
            />
            <SafetyBlock
              title="Inklusion"
              body={
                <>
                  <strong>Soziale Fairness:</strong> Förderverein des ESG unterstützt Familien
                  vertraulich. <strong>Gesundheit:</strong> Allergien, Diabetes, Asthma,
                  vegetarisch/vegan/glutenfrei werden vorher abgefragt.{" "}
                  <strong>Mobilität:</strong> Barrierefreiheit ist nicht überall gegeben — wir
                  sprechen offen und suchen Lösungen.
                </>
              }
            />
          </div>

          <div className="mt-12 bg-white border-l-4 border-[var(--color-wh-deep-green)] rounded-r-[var(--radius-card)] p-6">
            <p className="m-0 text-[15px]">
              <strong>Mobbing & Heimweh.</strong> Eine 24/7-Wohngemeinschaft kann auch belasten.
              Lehrkräfte sind sensibilisiert, kennen die Klasse, beobachten Dynamiken und greifen
              früh ein. Kein Kind wird allein gelassen — Heimweh wird ernst genommen, aber nicht
              zur Krise hochgespielt.
            </p>
          </div>
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
            Ein Dreiergespann.
          </h2>
          <p className="text-[17px] leading-relaxed max-w-3xl text-[var(--color-wh-snow)]/90">
            Die Hüttenarbeit am ESG ist getragen von drei Säulen — Verein, Schule und Eltern. Das
            ist keine Selbstverständlichkeit. Sie funktioniert, weil über Jahre ein Vertrauen
            zwischen Verein, Schule und Familien gewachsen ist.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
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
            <PillarCard
              num="3"
              title="Förderverein des ESG"
              body="Unterstützt — finanziell, ideell und mit dem Auge der Eltern. Zentraler Topf für soziale Härtefälle."
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

const DIMENSIONS = [
  {
    dim: "Hand",
    tun: "selbst kochen, Tisch decken, abspülen; Holz hacken, Feuer machen, Hütte heizen; Werken, Bank reparieren, Insektenhotel bauen; mit Karte und Kompass orientieren",
    lernen: "praktische Intelligenz, Verantwortung für gemeinsame Räume, manuelle Sorgfalt, Selbstwirksamkeit",
  },
  {
    dim: "Kopf",
    tun: "Naturbeobachtung mit Bestimmungsbüchern; kleine Projekte zu Geschichte, Forst, Bergbau im Sauerland; Leseabende, Disputationen am Kamin; konzentrierte Arbeit ohne Bildschirmablenkung",
    lernen: "Konzentration, kritisches Urteilen, Argumentationsfähigkeit, die Erfahrung von ruhigem, tiefem Denken",
  },
  {
    dim: "Herz",
    tun: "Lagerfeuer, Stille, gemeinsame Mahlzeiten; Konflikte miteinander aushalten und lösen; Rituale (Morgenkreis, Abendreflexion); Vertrauen aufbauen jenseits der Klassenraum-Hierarchie",
    lernen: "emotionale Kompetenz, Empathie, Konfliktfähigkeit, Resilienz, Zugehörigkeit",
  },
  {
    dim: "Fuß",
    tun: "Wandern, Skifahren, Mountainbike, Klettern, Geländespiele; den Hochsauerland-Wald erleben mit Anstrengung, Wetter und Kälte",
    lernen: "Bewegungsfreude, Naturverbundenheit, Körperbewusstsein, Mut, die Erfahrung dass Anstrengung sich lohnt",
  },
];

const PADAGOGEN = [
  {
    name: "Kurt Hahn",
    intro: "(1886–1974), Begründer der Erlebnispädagogik (Internat Salem, Outward Bound)",
    text:
      "Hahns Grundannahme — durch herausfordernde, ehrliche Erfahrungen wachsen — findet sich in jeder Wanderetappe, in jeder Selbstversorgungsschicht.",
  },
  {
    name: "John Dewey",
    intro: "(1859–1952), Learning by doing",
    text:
      "Schule als Erfahrungsraum, in dem Schüler:innen mitgestalten, statt zu konsumieren. Die Renovierung eines Schlafraums durch eine Klasse ist Dewey im Praxistest.",
  },
  {
    name: "Martin Wagenschein",
    intro: "(1896–1988), genetisch-exemplarisches Lernen",
    text:
      "Lieber an wenigen Phänomenen tief verstehen als viele Themen oberflächlich abhaken. Eine Hüttenwoche bietet die Zeit, die das Curriculum oft nicht hergibt.",
  },
  {
    name: "Hartmut Rosa",
    intro: "(*1965), Resonanzpädagogik",
    text:
      "Lernen entsteht, wenn Welt und Mensch in Beziehung treten — nicht durch Verfügung über Stoff. Die Hütte stellt Resonanzräume bereit, die ein 45-Minuten-Takt nur schwer erzeugt.",
  },
  {
    name: "Gerald Hüther",
    intro: "(*1951), Neurobiologie des Lernens",
    text:
      "Was emotional bedeutsam ist, bleibt. Hüttenwochen werden noch dreißig Jahre später erzählt. Der Lehrstoff vom letzten Mittwoch nicht.",
  },
  {
    name: "BNE — Bildung für nachhaltige Entwicklung",
    intro: "(KMK / BMBF)",
    text:
      "Ressourcen sind endlich, Verantwortung ist konkret. An der Hütte heißt das: Holz, Wasser, Strom, Müll — alles muss gedacht und gehandhabt werden.",
  },
];

const DAY_SCHEDULE = [
  {
    time: "6:30 – 7:30",
    text: "Frühdienst: Eine Kleingruppe deckt den Tisch, kocht Tee, schneidet Brot. Der Rest der Hütte wacht langsam auf.",
  },
  {
    time: "7:30 – 8:30",
    text: "Frühstück. Gemeinsam, am großen Tisch. Es gibt nicht zwei Schichten — alle frühstücken zusammen.",
  },
  {
    time: "8:30 – 9:00",
    text: "Morgenkreis. Was steht heute an? Wer übernimmt was? Eine Lehrkraft moderiert, aber die Schüler:innen tragen den Tag.",
  },
  {
    time: "9:00 – 12:30",
    text: "Vormittagsblock: Wandern, Naturprojekt, Werken, Renovierung oder fachliche Arbeit.",
  },
  {
    time: "12:30 – 14:00",
    text: "Mittagessen, das die Tagesgruppe gekocht hat. Aufräumen gehört dazu. Ja, mit allen.",
  },
  {
    time: "14:00 – 17:30",
    text: "Nachmittagsblock: Bewegung (Skifahren im Winter, Mountainbike im Sommer, Geländespiele), oder ein zweiter Projektblock.",
  },
  {
    time: "17:30 – 19:00",
    text: "Freie Zeit: Lesen, Karten spielen, raus, Musik machen. Ohne Programm.",
  },
  { time: "19:00 – 20:30", text: "Abendessen." },
  {
    time: "20:30 – 21:30",
    text: "Reflexionsrunde am Lagerfeuer oder im Aufenthaltsraum. Was war heute? Was hat geklappt, was nicht? Methoden wechseln: Stille-Karten, Blitzlichtrunde, Wertekreis.",
  },
  { time: "21:30 – 22:00", text: "Übergabe an die Nachtbereitschaft. Hüttenruhe." },
];

const FAQS = [
  {
    q: "Wie sicher ist die Hütte?",
    a: "Sehr sicher, mit Routine: zwei Lehrkräfte mit Erste-Hilfe-Schein, Notfallplan, Hüttenwart vor Ort, Erreichbarkeit der Klassenleitung 24/7 für Eltern. Wir senden vor jeder Fahrt einen Elternbrief mit allen Notfallnummern.",
  },
  {
    q: "Was kostet eine Klassenfahrt zur Wiesenhütte?",
    a: "Die Übernachtung in der Hütte ist günstig (Stand 2025: 18 € pro Person und Nacht für Nichtmitglieder). Hinzu kommen Verpflegung und Anreise. Die Gesamtkosten liegen je nach Dauer in einem Rahmen, der bewusst niedrig gehalten ist — damit alle mitfahren können. <strong>Familien, für die es eng ist, wenden sich vertraulich an die Klassenleitung — der Förderverein des ESG hilft.</strong>",
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
    a: "Das ESG ist ein evangelisches, humanistisches Gymnasium mit einem Profil, das Persönlichkeitsbildung, Verantwortung und Gemeinschaft ernst nimmt. Die Hüttenarbeit ist eine konkrete Übersetzung dieses Profils. Sie ist nicht zusätzlich zum Schulprogramm — sie ist Teil davon.",
  },
  {
    q: "Wer trägt die Hütte?",
    a: "Die Wiesenhütte gehört dem Verein <strong>Skifreunde Gütersloh e.V.</strong>, gegründet 1949, der die Hütte seit 1956 betreibt. Das ESG nutzt die Hütte in Kooperation mit den Skifreunden — die jahrzehntelange Pflege durch den Verein ist die Grundlage dafür, dass die Hütte heute steht und genutzt werden kann.",
  },
  {
    q: "Können Eltern die Hütte selbst sehen?",
    a: "Ja. Bei Tagen der offenen Tür, Eltern-Wanderungen oder bei Familienwochenenden des Vereins ist das möglich. Termine sehen Sie auf dieser Seite und im Schul-Newsletter.",
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

function SafetyBlock({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
      <h4 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-0 mb-3">
        {title}
      </h4>
      <p className="text-[14px] leading-relaxed text-[var(--color-wh-black)] m-0">{body}</p>
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
