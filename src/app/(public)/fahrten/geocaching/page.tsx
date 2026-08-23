import Link from "next/link";
import { Compass, MapPin, ArrowLeft, TriangleAlert } from "lucide-react";
import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";

export const metadata = {
  title: "Geocaching ab der Wiesenhütte · Wiesenhütte",
  description:
    "Anleitung zum Geocaching für Gruppen an der Hütte — Grundlagen, erster Cache Schritt für Schritt, eigener Parcours für die Klasse, Regeln für Natur und Sicherheit.",
};

const HERO_TAGS = ["ab ca. 8 Jahren", "1–3 Stunden", "ganzjährig", "Start an der Hütte"];

const CACHE_TYPES = [
  { name: "Traditional", desc: "Behälter liegt direkt an den angegebenen Koordinaten. Der Klassiker für den Einstieg." },
  { name: "Multi", desc: "Mehrere Stationen führen nacheinander zum Finale." },
  { name: "Mystery", desc: "Erst ein Rätsel lösen, das die echten Koordinaten liefert." },
  { name: "EarthCache", desc: "Keine Dose — eine geologische Aufgabe vor Ort." },
  { name: "Event", desc: "Reales Treffen von Geocacher:innen." },
];

const SIZES = [
  { name: "Micro", ex: "Filmdose", px: 16 },
  { name: "Small", ex: "Brotdose", px: 24 },
  { name: "Regular", ex: "Munikiste", px: 34 },
  { name: "Large", ex: "> 20 l", px: 46 },
];

const GLOSSARY = [
  ["GC-Code", "eindeutige Kennung eines Caches (z. B. GC12345)"],
  ["Muggel", "Nicht-Cacher:in; unauffällig bleiben, damit das Versteck geheim bleibt"],
  ["TFTC", "„Thanks for the cache“, freundlicher Log-Gruß"],
  ["CITO", "„Cache in, trash out“: Müll unterwegs mitnehmen"],
  ["Trackable", "reisender Gegenstand (Travel Bug), der weiterwandern soll"],
  ["Stashnote", "Zettel im Cache mit Zweck und Owner-Kontakt"],
  ["FTF", "„First to Find“, die erste Person am neuen Cache"],
  ["DNF", "„Did not find“: ehrlich loggen ist erwünscht"],
];

const STEPS = [
  { h: "App holen & Karte öffnen", p: "Die kostenlose Geocaching-App installieren und die Live-Karte rund um Langewiese laden. Entlang des Rothaarsteigs und der Wanderwege liegen erfahrungsgemäß etliche Caches." },
  { h: "Leichten Cache wählen", p: "Einen Traditional mit D/T unter 2/2 und Größe ab „Small“ aussuchen. Vorher das Listing lesen — Hinweise, Größe und ob er gerade aktiv ist." },
  { h: "Hinlaufen – dann Augen statt GPS", p: "Das GPS bringt euch auf etwa 5–10 Meter heran; die letzten Meter findet ihr mit Blick und Gefühl. Typische Verstecke: unter Steinen, an Wurzeln, in Astgabeln nahe am Weg." },
  { h: "Unauffällig bergen", p: "Sind Muggel in der Nähe, kurz warten. Cache vorsichtig herausnehmen, ohne das Versteck zu „verraten“." },
  { h: "Loggen & ggf. tauschen", p: "Ins Logbuch eintragen (Name + Datum), bei Bedarf gleich- oder höherwertig tauschen. Zu Hause oder direkt in der App online loggen — auch ein ehrliches DNF ist okay." },
  { h: "Exakt wieder verstecken", p: "Den Cache genau so zurücklegen, wie er lag, und gut tarnen. So bleibt der Schatz für die Nächsten erhalten." },
];

const RULES = [
  { h: "Eigene Caches nur mit Zustimmung", p: "Für dauerhafte Verstecke müssen Waldeigentümer:innen gefragt werden; im Naturschutzgebiet zusätzlich die Naturschutzbehörde, oft auch Förster:innen/Jäger:innen. Temporäre Gruppen-Parcours danach wieder einsammeln — dann entfällt das Problem." },
  { h: "Schutzgebiete meiden", p: "In Naturschutzgebieten und Naturwäldern gilt Wegegebot. Caches gehören nicht abseits der Wege — im Zweifel dort gar keine legen." },
  { h: "Keine sensiblen Verstecke", p: "Nichts in Baumhöhlen, an Felswänden oder in Erdhöhlen: dort leben Fledermäuse, Insekten und brütende Vögel. Nicht graben, Bäume nicht beschädigen, junge Aufforstungen nicht betreten." },
  { h: "Behälter & Inhalt", p: "Dose außen gut lesbar mit „Geocaching“ und Owner-Kontakt kennzeichnen. Keine Lebensmittel oder stark duftenden Dinge (locken Tiere an), kein Alkohol, keine gefährlichen Gegenstände." },
  { h: "Ruhezeiten achten", p: "Keine Nachtcaches — der Wald braucht Ruhephasen. Während der Brut- und Setzzeit besonders zurückhaltend. Unterwegs Müll mitnehmen (CITO)." },
  { h: "Reizklima & Wetter", p: "Die Hochlage bringt Wind und schnellen Wetterwechsel. Bei Sturm, Gewitter oder Glätte nicht durchführen; auf Totholzflächen droht zusätzlich Astbruch." },
];

const SOURCES = [
  { label: "Wald und Holz NRW: Geocaching – Fragen & Antworten (Regeln in NRW)", href: "https://www.wald-und-holz.nrw.de/fileadmin/Wald-erleben/Dokumente/Geocaching_-_Fragen_und_Antworten_Wald_und_Holz_NRW.docx.pdf" },
  { label: "Geocaching.com Wiki: Ansprechpartner & Erlaubnis in NRW", href: "https://wiki.groundspeak.com/display/GEO/NRW+Ansprechpartner+Erlaubnis" },
  { label: "Naturverträgliches Geocaching (RLP): Landesforsten – Regeln im Wald", href: "https://www.wald.rlp.de/erleben/waldbesuch/geocaching" },
  { label: "Einsteiger-Überblick: Cache-Arten & Regeln", href: "https://www.lernen.net/artikel/geocaching-15151/" },
  { label: "Größen & Wertung", href: "https://www.geocaching.at/geocaching-kategorien/" },
  { label: "Glossar: Geocaching-Begriffe A–Z", href: "https://geocaching.website/was-ist-geocaching/glossar-das-geocaching-wiki/" },
  { label: "Offiziell loggen: Geocaching-Etikette (Blog)", href: "https://www.geocaching.com/blog/2019/06/geocaching-etikette-201-finden-und-loggen/" },
];

export default async function GeocachingPage() {
  const locale = await getServerLocale();
  return (
    <div>
      <DeOnlyBanner locale={locale} />

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[900px] mx-auto">
          <Link
            href="/fahrten"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-wh-deep-green)] no-underline mb-6"
          >
            <ArrowLeft size={15} /> Zurück zu Fahrten &amp; Erlebnisse
          </Link>
          <div className="eyebrow mb-3">Selbst gestaltbar</div>
          <h1 className="text-[36px] sm:text-[52px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            Geocaching — die GPS-Schatzsuche
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0">
            Mit Smartphone oder GPS-Gerät versteckte „Schätze“ aufspüren — oder für die eigene
            Gruppe einen Parcours legen. Draußen, in Bewegung, mit Köpfchen: ideal für Klassen,
            Familien und Gruppen an der Wiesenhütte.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {HERO_TAGS.map((t) => (
              <span
                key={t}
                className="text-xs font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] border border-[var(--color-wh-deep-green)]/30 rounded-full px-3 py-1.5"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Grundlagen</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] text-[var(--color-wh-deep-green)] mt-0 mb-5">
            Was ist Geocaching?
          </h2>
          <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-[var(--color-wh-black)] max-w-[68ch]">
            <p className="m-0">
              Geocaching ist eine <strong>GPS-gestützte Schatzsuche</strong>. Menschen verstecken
              weltweit kleine, wasserdichte Behälter — die Caches — und veröffentlichen deren
              Koordinaten. Wer sucht, lässt sich per App oder GPS-Gerät zum Ort führen und stöbert
              die „Dose“ auf. Drin liegt immer ein <strong>Logbuch</strong> zum Eintragen, in
              größeren Behältern auch kleine Tauschgegenstände.
            </p>
            <p className="m-0">
              <strong>Das braucht ihr:</strong> ein Smartphone mit der kostenlosen
              Geocaching-App (oder ein GPS-Gerät), einen Stift fürs Logbuch und — optional — ein
              paar kleine Tauschsachen. Mehr nicht. Für eine erste Runde rund um Langewiese genügt
              die Gratis-Version völlig.
            </p>
            <p className="m-0">
              <strong>Die goldene Grundregel beim Tauschen:</strong> Wer etwas herausnimmt, legt
              etwas Gleich- oder Höherwertiges hinein. Und: Der Cache wird{" "}
              <strong>exakt so wieder versteckt</strong>, wie man ihn vorgefunden hat.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Die Sprache der Dose</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] text-[var(--color-wh-deep-green)] mt-0 mb-2">
            Typen, Größen &amp; Wertung
          </h2>
          <p className="text-[15px] text-[var(--color-wh-fg-muted)] max-w-2xl mb-8">
            Jedes Cache-Listing verrät vorab drei Dinge: welche Art von Cache es ist, wie groß der
            Behälter ist und wie anspruchsvoll er über die D/T-Wertung ausfällt. Das hilft bei der
            Auswahl — besonders am Anfang.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mt-0 mb-4">
                Häufige Cache-Arten
              </h3>
              <div className="flex flex-col gap-3">
                {CACHE_TYPES.map((t) => (
                  <div key={t.name} className="flex gap-3 items-baseline">
                    <span className="font-display font-semibold text-[var(--color-wh-deep-green)] text-sm min-w-[92px] shrink-0">
                      {t.name}
                    </span>
                    <span className="text-sm text-[var(--color-wh-fg-muted)]">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mt-0 mb-4">
                Behältergrößen
              </h3>
              <div className="flex items-end gap-4 flex-wrap">
                {SIZES.map((s) => (
                  <div key={s.name} className="text-center">
                    <div
                      className="bg-[var(--color-wh-green)] rounded-sm mx-auto mb-1.5"
                      style={{ width: s.px, height: s.px * 0.92 }}
                    />
                    <span className="block font-display font-semibold text-xs uppercase text-[var(--color-wh-deep-green)]">
                      {s.name}
                    </span>
                    <span className="block font-mono text-[11px] text-[var(--color-wh-fg-muted)]">{s.ex}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[var(--color-wh-fg-muted)] mt-4 mb-0">
                Für Kinder und Gruppen lohnt sich <strong className="text-[var(--color-wh-black)]">ab „Small“</strong>{" "}
                aufwärts — die sind leichter zu finden und bieten Platz zum Tauschen und Loggen.
              </p>
            </div>

            <div className="md:col-span-2 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mt-0 mb-4">
                D/T-Wertung (jeweils 1–5)
              </h3>
              <DTRow label="D · Difficulty" filled={2} note="wie knifflig das Finden/Rätsel ist" />
              <DTRow label="T · Terrain" filled={2} note="wie anspruchsvoll der Weg zum Ort ist" />
              <p className="text-sm text-[var(--color-wh-fg-muted)] mt-4 mb-0">
                <strong className="text-[var(--color-wh-black)]">Einsteiger-Tipp:</strong>{" "}
                Beginnt mit einem Traditional, D/T unter 2/2 und Größe mindestens „Small“. Diese
                Caches sind schnell und ohne Kletterei zu finden.
              </p>
            </div>

            <div className="md:col-span-2 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mt-0 mb-4">
                Wichtige Begriffe
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {GLOSSARY.map(([term, desc]) => (
                  <div key={term} className="text-sm">
                    <span className="font-mono text-[var(--color-wh-deep-green)] font-semibold">{term}</span>
                    <span className="text-[var(--color-wh-fg-muted)]"> — {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Schritt für Schritt</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] text-[var(--color-wh-deep-green)] mt-0 mb-8">
            Euer erster Cache
          </h2>
          <div className="flex flex-col gap-3">
            {STEPS.map((s, i) => (
              <div
                key={s.h}
                className="relative bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] py-4 pr-5 pl-16"
              >
                <span className="absolute left-4 top-4 w-7 h-7 rounded-full bg-[var(--color-wh-deep-green)] text-[var(--color-wh-beige)] font-display font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="font-display font-bold text-[16px] text-[var(--color-wh-deep-green)] m-0 mb-1">
                  {s.h}
                </h3>
                <p className="text-sm text-[var(--color-wh-fg-muted)] m-0">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-deep-green)] px-6 sm:px-8 py-14 sm:py-16">
        <div className="max-w-[900px] mx-auto text-white">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-wh-beige)] mb-2">
            Für Klassen &amp; Gruppen
          </div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] mt-0 mb-4">
            Ab der Hütte: euer eigener Parcours
          </h2>
          <p className="text-[15px] text-white/85 max-w-[64ch] mb-8">
            Statt fremde Caches zu suchen, könnt ihr für eine Gruppe einen{" "}
            <strong className="text-white">eigenen, zeitlich begrenzten Parcours</strong> ab der
            Hütte legen und danach wieder einsammeln. Das umgeht die Genehmigungsfragen für
            dauerhafte Caches, schont die Natur und lässt sich didaktisch füllen — als
            Team-Aufgabe, Fach-Rallye oder Kennenlern-Runde. Führt ihn bewusst{" "}
            <strong className="text-white">weg von der Bundesstraße</strong>, z. B. Richtung
            Ochsenstallsgraben oder in den Dorfbereich mit Barfußpfad.
          </p>

          <div className="flex flex-col gap-5 mb-8">
            <Waypoint code="Waypoint 01 · Start" title="An der Hütte briefen">
              Gruppen bilden, Regeln klären (auf den Wegen bleiben, Natur schonen, Sammelpunkt),
              Material verteilen. Ein Beispielversteck gemeinsam suchen, damit das Prinzip sitzt.
            </Waypoint>
            <Waypoint code="Waypoint 02–07 · Stationen" title="6–8 Stationen entlang eines Rundwegs">
              An jeder Station wartet eine Dose mit Aufgabe, Rätsel oder Hinweis auf den nächsten
              Punkt. Inhalte frei wählbar — Fachfragen, Naturbeobachtung, Team-Challenges.
              Behälter außen mit „Geocaching“ und Kontakt beschriften.
            </Waypoint>
            <Waypoint code="Waypoint 08 · Finale" title="Schatz & Ausklang">
              Am Ende ein „Schatz“ (z. B. für alle etwas Kleines) und eine kurze Auswertung.
              Wichtig: <strong className="text-white">alle Dosen wieder einsammeln</strong> — der
              Parcours war temporär.
            </Waypoint>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 border-l-[3px] border-[var(--color-wh-beige)] rounded-r-md px-4 py-3.5">
              <h4 className="font-display font-semibold text-[var(--color-wh-beige)] uppercase text-sm tracking-wide m-0 mb-1.5">
                Variante A · mit GPS
              </h4>
              <p className="text-sm text-white/90 m-0">
                Beim Auslegen an jeder Station die Koordinaten mit dem Handy abnehmen und der
                Gruppe geben. Trainiert Kartenlesen und Navigation.
              </p>
            </div>
            <div className="bg-white/10 border-l-[3px] border-[var(--color-wh-beige)] rounded-r-md px-4 py-3.5">
              <h4 className="font-display font-semibold text-[var(--color-wh-beige)] uppercase text-sm tracking-wide m-0 mb-1.5">
                Variante B · ohne GPS
              </h4>
              <p className="text-sm text-white/90 m-0">
                Klassische Hinweis-Kette: Jede Dose enthält den Hinweis zum nächsten Ort.
                Funktioniert überall, auch ohne Empfang — gut für jüngere Gruppen.
              </p>
            </div>
          </div>

          <p className="text-[15px] text-white/85 mt-7 mb-0">
            <strong className="text-white">Tipp:</strong> Wer Wald, Wasser und Wiederaufforstung
            fachlich einbinden will, kann den Parcours mit einer{" "}
            <Link href="/fahrten#ranger" className="text-[var(--color-wh-beige)] font-semibold">
              Ranger-Tour
            </Link>{" "}
            von Wald und Holz NRW koppeln — die starten nach Absprache ebenfalls ab der Hütte.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Naturverträglich &amp; erlaubt</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] text-[var(--color-wh-deep-green)] mt-0 mb-4">
            Rücksicht ist Pflicht
          </h2>
          <p className="text-[15px] text-[var(--color-wh-fg-muted)] max-w-[64ch] mb-8">
            Der Wald darf zur Erholung betreten werden — Caches suchen braucht keine
            Extra-Genehmigung. Wer aber selbst etwas versteckt, trägt Verantwortung: Wald gehört
            immer jemandem.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RULES.map((r) => (
              <div key={r.h} className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-wh-deep-green)] m-0 mb-2 flex items-center gap-2">
                  <span className="text-[var(--color-wh-sunset)]">›</span> {r.h}
                </h3>
                <p className="text-sm text-[var(--color-wh-fg-muted)] m-0">{r.p}</p>
              </div>
            ))}
            <div className="sm:col-span-2 bg-[var(--color-wh-deep-green)] text-white rounded-[var(--radius-card)] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-wh-beige)] m-0 mb-2 flex items-center gap-2">
                <TriangleAlert size={16} /> Sicherheit in der Gruppe
              </h3>
              <p className="text-sm text-white/85 m-0">
                Auf den Wegen bleiben, keine Verstecke an Straßen, Bahn oder Gefahrenstellen.
                Festen Sammelpunkt und Rückkehrzeit vereinbaren, Teilnahme in eigener
                Verantwortung. Bei Klassen gilt die übliche Aufsichtspflicht.
              </p>
            </div>
          </div>
          <div className="mt-5 bg-[var(--color-wh-beige)] border border-dashed border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 text-sm text-[var(--color-wh-fg-muted)]">
            <strong className="text-[var(--color-wh-black)]">Zwei Seiten:</strong> Geocaching
            weckt Interesse an der Natur und bringt Menschen nach draußen — kann aber, unbedacht
            betrieben, Lebensräume stören. Beides stimmt. Der verantwortungsvolle Umgang
            entscheidet, welche Seite überwiegt.
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-8 py-10 sm:py-12">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Weiterlesen &amp; Nachschlagen</div>
          <h2 className="font-display font-bold text-[20px] text-[var(--color-wh-deep-green)] mt-0 mb-4">
            Quellen
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 list-none p-0 m-0 text-sm">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener" className="text-[var(--color-wh-deep-green)] break-words">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-wh-fg-muted)] mt-8 mb-0 flex items-start gap-2">
            <MapPin size={14} className="shrink-0 mt-0.5" />
            Wegangaben zur Orientierung; die genaue Route bitte vor Ort abgehen. Dauerhafte
            Caches nur mit Zustimmung der Waldeigentümer:innen — für Gruppen den temporären
            Parcours nutzen und wieder einsammeln.
          </p>
        </div>
      </section>
    </div>
  );
}

function DTRow({ label, filled, note }: { label: string; filled: number; note: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <span className="font-display font-semibold uppercase text-xs tracking-wide text-[var(--color-wh-deep-green)] min-w-[130px]">
        {label}
      </span>
      <span className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full border-[1.5px] border-[var(--color-wh-sunset)] ${
              i < filled ? "bg-[var(--color-wh-sunset)]" : "bg-transparent"
            }`}
          />
        ))}
      </span>
      <span className="text-sm text-[var(--color-wh-fg-muted)]">{note}</span>
    </div>
  );
}

function Waypoint({ code, title, children }: { code: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-8">
      <Compass size={16} className="absolute left-0 top-0.5 text-[var(--color-wh-beige)]" />
      <span className="block font-mono text-[11px] uppercase tracking-wider text-[var(--color-wh-beige)] mb-1">
        {code}
      </span>
      <h3 className="font-display font-semibold text-white text-[17px] m-0 mb-1">{title}</h3>
      <p className="text-sm text-white/85 max-w-[64ch] m-0">{children}</p>
    </div>
  );
}
