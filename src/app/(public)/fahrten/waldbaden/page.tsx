import Link from "next/link";
import { ArrowLeft, TriangleAlert, MapPin } from "lucide-react";
import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";

export const metadata = {
  title: "Waldbaden ab der Wiesenhütte · Wiesenhütte",
  description:
    "Anleitung für Lehrkräfte: eine Waldbaden-Runde ab der Hütte Richtung Ochsenstallsgraben, mit sieben Stationen und Einladungen zum Vorlesen.",
};

const HERO_TAGS = ["60–120 Minuten", "ganzjährig", "ohne Vorkenntnisse", "Start direkt an der Hütte"];

const EVIDENCE = [
  "niedrigerer Blutdruck & Puls, sinkendes Cortisol – teils schon nach einer Stunde",
  "Verschiebung zum entspannenden Teil des Nervensystems (Parasympathikus)",
  "bessere Stimmung, geringere Grübelneigung",
  "Erholung der Aufmerksamkeit (Attention-Restoration-Theorie)",
];

const STOPS: { num: string; phase: string; title: string; text: string; invite: string; inviteLabel?: string }[] = [
  {
    num: "0",
    phase: "Schwelle · an der Hütte",
    title: "Ankommen",
    text: "Bevor es losgeht, ein bewusster Übergang: Rucksack leicht, Schuhe fest. Handys bleiben am besten in der Hütte — falls sie doch dabei sind, ganz ausschalten (nicht nur stumm). Kurz stehen bleiben und mit dem Blick den Waldrand absuchen.",
    invite: "Drei langsame Atemzüge. Beim Ausatmen jeweils ein „Muss“ gedanklich an der Hütte lassen. Ab jetzt gilt: langsamer als sich richtig anfühlt.",
  },
  {
    num: "1",
    phase: "Aufbruch · weg vom Verkehr",
    title: "Weg vom Weg",
    text: "Von der Hütte in die vom Verkehr abgewandte Richtung starten und die ersten Meter auf dem steigungsarmen Plateau gehen, hinaus Richtung Ochsenstallsgraben. Hier passiert das Tempo-Umschalten.",
    invite: "Das Gehen selbst spüren — wie der Fuß abrollt, wie sich der Boden verändert. Nichts kommentieren, nur bemerken.",
  },
  {
    num: "2",
    phase: "Abstieg · hinein ins Tal",
    title: "Der Hang",
    text: "Der Weg fällt zum Talgrund ab. Es gibt eine steilere Linie und — auf halber Hanghöhe — eine flachere, hangparallele Variante; wählt nach Kondition und Gruppe.",
    invite: "Kurz die Augen schließen und zählen, wie viele verschiedene Geräusche sich unterscheiden lassen. Wind, Wasser, Vögel, die eigenen Schritte.",
    inviteLabel: "Hören",
  },
  {
    num: "3",
    phase: "Waldkante · offene Fläche",
    title: "Lichtung & Wandel",
    text: "Unterwegs öffnen sich Kahl- und Aufforstungsflächen — abgestorbene Fichten, Totholz, dazwischen junge Bäume und Pionierpflanzen. Kein Schaden, den man wegschauen muss, sondern ein Waldbild im Umbruch.",
    invite: "Einen Kontrast suchen: altes Grau neben jungem Grün. Was verändert sich hier gerade? Wer ist zuerst zurückgekehrt? Ein Bild auch für Belastung und Erholung.",
    inviteLabel: "Sehen",
  },
  {
    num: "4",
    phase: "Talgrund · Wendepunkt",
    title: "Der stille Wendepunkt",
    text: "Weiter unten wird es ruhiger und kühler — hier liegt der natürliche Wendepunkt und das Herzstück der Runde. Sucht euch eine geeignete Stelle: Führt der Graben Wasser, ist das Ufer ideal; ist er trocken, geht einfach ein Stück weiter, bis ihr einen ruhigen, einladenden Ort findet. Dort verteilt sich die Gruppe, jede:r kommt für sich zur Ruhe.",
    invite:
      "„Sucht euch jetzt jede:r einen Platz, der dich besonders anspricht — ein Stein, ein Baumstumpf, eine weiche Stelle im Moos, das Ufer, falls Wasser da ist. Geht ruhig so weit auseinander, dass ihr für euch seid, aber in Rufweite bleibt. Setz oder stell dich hin und bleib fünf bis zehn Minuten einfach da: den Geräuschen lauschen, Rinde und Moos ertasten, an Erde oder Nadeln riechen, den Blick weich werden lassen. Du musst nichts leisten und nichts richtig machen — wenn die Gedanken abschweifen, kehr freundlich zu einem Geräusch zurück.“ Ein leises, vorher vereinbartes Signal holt am Ende alle wieder zusammen.",
    inviteLabel: "der eigene Platz",
  },
  {
    num: "5",
    phase: "Rückweg · bergan",
    title: "Schweigend zurück",
    text: "Zurück geht es wieder bergauf — ruhiger Puls, aufrechter Gang. Der Rückweg ist bewusst ohne Gespräch, damit die Wirkung nicht gleich „zerredet“ wird.",
    invite: "Ein Detail von deinem Platz mitnehmen (ein Wort, ein Bild) und es beim Aufstieg immer wieder aufrufen, statt zu planen.",
  },
  {
    num: "6",
    phase: "Ausklang · an der Hütte",
    title: "Zurück an der Hütte",
    text: "Ankommen, Schuhe aus, etwas Warmes trinken. Erst jetzt — wenn gewünscht — ein kurzer, freiwilliger Austausch.",
    invite: "Reihum ein Satz: „Woran erinnere ich mich am stärksten?“ Kein Bewerten, kein Ratschlag — nur Wahrnehmungen nebeneinander.",
  },
];

const PRAXIS = [
  { h: "Dauer & Tempo", p: "60–120 Minuten reichen. Bewusst langsam — die kurze Strecke ist Absicht, kein Mangel. Keine Leistungsziele." },
  { h: "Ausrüstung", p: "Festes, wetterfestes Schuhwerk und Kleidung nach Zwiebelprinzip. Der Talgrund ist kühler und feuchter als das Plateau. Wenig mitnehmen." },
  { h: "Reizklima & Wetter", p: "Die Hochlage bringt Wind und Wetterwechsel. Bei Sturm, Gewitter oder Glätte nicht durchführen — Totholzflächen bergen zusätzlich Astbruchgefahr." },
  { h: "Stille & Handy", p: "Handy aus, nicht nur lautlos. In der Gruppe möglichst schweigend gehen; Gespräche erst am Ende. Fotografieren stört den Fluss — bewusst sparsam." },
  { h: "Barrierearmut & Varianten", p: "Wer den Abstieg meiden will, bleibt auf der hangparallelen Variante oder auf dem Plateau und macht dort den Sitzplatz. Der Rückweg ist bergauf — Tempo anpassen." },
  { h: "Fachliche Ergänzung", p: "Wer die Themen Wald, Wasser und Wiederaufforstung vertiefen will: Ranger-Touren von Wald und Holz NRW starten nach Absprache ebenfalls ab der Hütte — gut kombinierbar, aber inhaltlich eigenständig." },
];

const SOURCES = [
  { label: "Wikipedia: Waldbaden / Shinrin-yoku – Begriff, Definition, Waldmedizin", href: "https://de.wikipedia.org/wiki/Waldbaden" },
  { label: "ZHAW-Publikation: Waldbaden & Waldtherapie – Wirkungen auf Herz, Atmung, Nervensystem", href: "https://digitalcollection.zhaw.ch/bitstreams/0a3ac9b0-0c7c-4da5-8af4-1ee01c358060/download" },
  { label: "MindfulMind: Wissenschaft & Waldbaden – Studienübersicht, auch widersprechende Befunde", href: "https://mindfulmind.ch/wissenschaft-und-waldbaden/" },
  { label: "Wald und Holz NRW: Borkenkäfer im Fichtenwald – Landschaftswandel & Ökologie", href: "https://www.wald-und-holz.nrw.de/forstwirtschaft/borkenkaefer" },
  { label: "Radio Sauerland: Fichtensterben im Sauerland – Ausmaß der Kahlflächen", href: "https://www.radiosauerland.de/artikel/ein-drittel-der-fichten-im-sauerland-ist-zerstoert-1541010.html" },
  { label: "Langewiese: Lage & Reizklima", href: "https://www.langewiese.de/lage-umgebung/" },
  { label: "Rothaarsteig: Ochsenstallsgraben (N1)", href: "https://www.rothaarsteig.de/de/Outdooractive-Touren/Zwistmuehle-Weg-N1-Start-Winterberg-Neuastenberg" },
];

export default async function WaldbadenPage() {
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
          <div className="eyebrow mb-3">Selbst gestaltbar · für Lehrkräfte</div>
          <h1 className="text-[36px] sm:text-[52px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            Waldbaden ab der Hütte
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0">
            Bewusst und langsam durch den Wald gehen und ihn mit allen Sinnen aufnehmen. Schon ein
            ruhiger Aufenthalt unter Bäumen kann Anspannung lösen, den Kopf klären und die
            Stimmung heben. Diese Anleitung führt Schritt für Schritt — damit ihr eure Klasse ab
            der Hütte durch eine kleine Waldbaden-Runde Richtung Ochsenstallsgraben begleiten
            könnt.
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
          <div className="eyebrow mb-2">Einordnung</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] text-[var(--color-wh-deep-green)] mt-0 mb-6">
            Was Waldbaden ist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 items-start">
            <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-[var(--color-wh-black)]">
              <p className="m-0">
                <strong>Waldbaden</strong> meint den bewussten, verlangsamten Aufenthalt im Wald
                mit dem Ziel, Stress zu senken und die Wahrnehmung zu öffnen. Der Begriff{" "}
                <em>Shinrin-yoku</em> (森林浴, „Waldbaden“) kommt aus Japan — er geht nicht auf
                eine uralte Tradition zurück, sondern auf eine staatliche Gesundheitskampagne von
                1982. Daraus entstand der Forschungszweig „Waldmedizin“ (u. a. Qing Li, Yoshifumi
                Miyazaki).
              </p>
              <p className="m-0">
                Entscheidend ist die Haltung: Es ist <strong>kein Sport und keine Wanderung mit
                Streckenziel</strong>. Kein Schrittzähler, kein Tempo, keine To-do-Liste im Kopf.
                Man geht ein Vielfaches langsamer als gewohnt, hält oft an und lässt die Umgebung
                auf sich wirken. Genau diese Absicht unterscheidet es vom beiläufigen Spaziergang.
              </p>
            </div>
            <div>
              <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-wh-deep-green)] m-0 mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-wh-green)] inline-block" />
                  Gut gestützt
                </h3>
                <ul className="m-0 pl-4 text-sm text-[var(--color-wh-fg-muted)] flex flex-col gap-1.5">
                  {EVIDENCE.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
              <p className="text-[13px] italic text-[var(--color-wh-fg-muted)] mt-3">
                Ein einfaches Ritual, das keine Ausrüstung braucht und sich gut mit einer Gruppe
                umsetzen lässt — Erholung und Gesundheitsförderung zugleich.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Ort &amp; Anlass</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] text-[var(--color-wh-deep-green)] mt-0 mb-6">
            Warum hier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--color-wh-deep-green)] text-white rounded-[var(--radius-card)] px-5 py-4">
              <span className="block font-display font-bold text-[26px] text-[var(--color-wh-beige)] leading-none">
                540–741 m
              </span>
              <span className="block text-sm text-white/80 mt-1.5">
                Höhenlage Langewiese, auf dem Rothaarkamm
              </span>
            </div>
            <div className="bg-[var(--color-wh-deep-green)] text-white rounded-[var(--radius-card)] px-5 py-4">
              <span className="block font-display font-bold text-[26px] text-[var(--color-wh-beige)] leading-none">
                Luftkurort
              </span>
              <span className="block text-sm text-white/80 mt-1.5">
                staatlich anerkannt · anregendes Reizklima
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-[var(--color-wh-black)] max-w-[68ch]">
            <p className="m-0">
              Langewiese liegt als Höhendorf direkt am Rothaarsteig; das Reizklima der Winterberger
              Hochebene gilt als anregend und kreislaufwirksam. Die Wege sind steigungsarm — ideal,
              um langsam und ohne Anstrengung unterwegs zu sein.
            </p>
            <p className="m-0">
              <strong>Zum Wald gehört heute die Wahrheit:</strong> Trockenheit, Stürme und der
              Borkenkäfer haben den Fichtenwald tiefgreifend verändert. Im Regionalforstamt Oberes
              Sauerland (mit Winterberg) ist binnen weniger Jahre fast ein Drittel der Fichtenfläche
              abgestorben; große Kahlflächen werden nun mit klimastabileren Mischbaumarten
              wiederaufgeforstet. Das ist <strong>kein Makel für das Waldbaden, sondern ein Teil
              davon</strong>: Wandel, Verlust und junges Werden lassen sich hier unmittelbar
              wahrnehmen — statt einer Postkarten-Idylle.
            </p>
            <p className="m-0">
              <strong>Für die Schüler:innen:</strong> Achtsame Zeit im Wald hilft, zur Ruhe zu
              kommen, sich zu sammeln und die eigene Wahrnehmung zu schärfen — ein wohltuender
              Gegenpol zum getakteten Schulalltag. Vorkenntnisse oder Ausrüstung braucht es dafür
              nicht.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-deep-green)] px-6 sm:px-8 py-14 sm:py-16">
        <div className="max-w-[900px] mx-auto text-white">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-wh-beige)] mb-2">
            Der Weg als Anleitung
          </div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] mt-0 mb-4">
            Ab der Hütte Richtung Ochsenstallsgraben
          </h2>
          <p className="text-[15px] text-white/85 max-w-[64ch] mb-3">
            Die Route führt bewusst <strong className="text-white">nicht</strong> über den Weg an
            der Bundesstraße, sondern von der Hütte weg vom Verkehr, ostwärts vom Hochplateau
            hinab in Richtung Ochsenstallsgraben — in einen ruhigen, tiefer gelegenen
            Waldabschnitt — und denselben Weg wieder zurück. Der Abstieg gliedert die sieben
            Stationen von selbst. An jeder Station lädst du die Schüler:innen zu einer kurzen
            Übung ein und gibst ihnen Zeit — die Sätze unter „Einladung“ kannst du direkt vorlesen
            oder frei nachsprechen.
          </p>
          <div className="flex justify-between max-w-[420px] font-display text-xs uppercase tracking-wide text-[var(--color-wh-beige)] mb-8">
            <span>▲ Start · Hochplateau</span>
            <span>Talgrund · Wendepunkt ▼</span>
          </div>

          <div className="relative pl-11 flex flex-col gap-8 before:content-[''] before:absolute before:left-[13px] before:top-1.5 before:bottom-6 before:w-[2px] before:bg-[repeating-linear-gradient(var(--color-wh-beige)_0_10px,transparent_10px_18px)]">
            {STOPS.map((s) => (
              <div key={s.num} className="relative">
                <span className="absolute -left-11 -top-0.5 w-8 h-8 rounded-full bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)] font-display font-bold flex items-center justify-center ring-4 ring-[var(--color-wh-deep-green)]">
                  {s.num}
                </span>
                <span className="block font-mono text-[11px] uppercase tracking-wider text-[var(--color-wh-beige)] mb-1">
                  {s.phase}
                </span>
                <h3 className="font-display font-semibold text-white text-[19px] m-0 mb-1.5">{s.title}</h3>
                <p className="text-sm text-white/85 max-w-[64ch] mb-3">{s.text}</p>
                <div className="bg-white/10 border-l-[3px] border-[var(--color-wh-beige)] rounded-r-md px-4 py-3 max-w-[64ch] text-[14px] text-white/95">
                  <strong className="text-[var(--color-wh-beige)] font-display">
                    Einladung{s.inviteLabel ? ` – ${s.inviteLabel}` : ""}:
                  </strong>{" "}
                  {s.invite}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-[var(--color-wh-beige)]/10 border border-dashed border-[var(--color-wh-beige)]/50 rounded-[var(--radius-card)] px-5 py-4 text-[14px] text-white/90">
            <strong className="text-[var(--color-wh-beige)]">Vor Ort festlegen:</strong> Der genaue
            Pfad von der Hüttentür bis zum Wendepunkt sollte einmal abgegangen und — wo nötig —
            dezent markiert werden (Abzweige, die steilere vs. die hangparallele Variante, ein
            guter, ruhiger Wendepunkt — idealerweise am Wasser, falls der Graben welches führt).
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Praktisches</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[30px] text-[var(--color-wh-deep-green)] mt-0 mb-6">
            Damit es gelingt
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRAXIS.map((c) => (
              <div key={c.h} className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-wh-deep-green)] m-0 mb-2 flex items-center gap-2">
                  <span className="text-[var(--color-wh-sunset)]">›</span> {c.h}
                </h3>
                <p className="text-sm text-[var(--color-wh-fg-muted)] m-0">{c.p}</p>
              </div>
            ))}
            <div className="sm:col-span-2 bg-[var(--color-wh-deep-green)] text-white rounded-[var(--radius-card)] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-wh-beige)] m-0 mb-2 flex items-center gap-2">
                <TriangleAlert size={16} /> Gesundheit &amp; Aufsicht
              </h3>
              <p className="text-sm text-white/85 m-0">
                Waldbaden ist Erholung, <strong className="text-white">kein Ersatz für eine
                ärztliche oder psychotherapeutische Behandlung</strong>. Bei Klassen gilt die
                übliche Aufsichtspflicht: Sammelpunkt und Rückkehrzeit vereinbaren, die Gruppe
                auch in der stillen Phase im Blick behalten. Wer nicht mag, muss nicht mitmachen.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-8 py-10 sm:py-12">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-2">Zum Weiterlesen &amp; Einordnen</div>
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
            Anleitung für Lehrkräfte. Wegangaben zur Orientierung — die genaue Führung bitte vor
            Ort abgehen und markieren. Kein medizinisches Angebot.
          </p>
        </div>
      </section>
    </div>
  );
}
