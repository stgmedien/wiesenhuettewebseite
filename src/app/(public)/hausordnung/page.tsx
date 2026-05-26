import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";

export const metadata = {
  title: "Hausordnung · Wiesenhütte",
  description:
    "Hausordnung der Wiesenhütte: Anreise-Hinweise, Verhalten in der Hütte, Abreise-Checkliste. Gilt verbindlich für alle Gäste.",
};

export default async function HausordnungPage() {
  const locale = await getServerLocale();
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <DeOnlyBanner locale={locale} />
      <div className="max-w-[820px] mx-auto">
        <div className="eyebrow">Hausordnung</div>
        <h1 className="text-[44px] sm:text-[56px] mt-4 mb-2">Damit's für alle gut wird.</h1>
        <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] mt-4">
          Die folgende Hausordnung gilt verbindlich für alle Gäste der Wiesenhütte. Sie wird mit
          der Buchungsbestätigung als Bestandteil des Mietvertrags übermittelt.
        </p>

        <Block title="Charakter der Hütte">
          <div className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-beige)] px-4 py-3">
            <p className="m-0">
              Die Wiesenhütte ist eine{" "}
              <strong>Selbstversorgerhütte für Vereins-, Schul-, Klassen- und Gruppenfahrten</strong> —
              bewusst einfach, naturnah und getragen vom Verein Skifreunde Gütersloh e.V. Sie ist{" "}
              <strong>keine Eventlocation und kein Partyort</strong>: übermäßiger Alkoholkonsum,
              laute Feiern und Verhalten, das andere im Ort stört oder die Hütte schädigt, sind
              ausdrücklich nicht gewünscht und können zum Verweis und zur Einbehaltung der Kaution
              führen. Buchungen mit privatem Feier-Anlass (JGA, runder Geburtstag etc.) werden vom
              Vorstand vorab individuell geprüft und können abgelehnt werden.
            </p>
          </div>
        </Block>

        <Block title="Vor Eurer Anreise">
          <p>
            Bitte teilt spätestens 2 Tage vor Anreise dem Hüttenwart Toni Klauke telefonisch
            Eure genaue Ankunftszeit mit. Er nimmt Euch an der Hütte in Empfang und überreicht
            Schlüssel und Kurkarten.
          </p>
          <Address />
          <ul>
            <li>
              Die zugeschickte Feuerwehr-Meldeliste hängt zu Eurer Sicherheit ausgefüllt am
              Klemmbrett hinter der ersten Eingangstür links oben — bitte auch nach der Abreise
              dort hängen lassen.
            </li>
            <li>Mängel bitte sofort nach Anreise beim Hüttenwart melden und protokollieren lassen.</li>
          </ul>
        </Block>

        <Block title="Während Eures Aufenthalts">
          <ul>
            <li>
              <strong>Kein Partyort:</strong> übermäßiger Alkoholkonsum und laute private Feiern
              sind nicht erlaubt — die Hütte ist eine ruhige Gruppenunterkunft im Dorf, mit
              Nachbarn ringsum.
            </li>
            <li>Tiere aller Art sind zu keiner Zeit erlaubt.</li>
            <li>Alle Räume bitte nur mit Hausschuhen begehen.</li>
            <li>Mit Skischuhen ausschließlich den Kellereingang benutzen.</li>
            <li>
              Für die Benutzung der Betten sind mitzubringen: 1 Bettlaken, 1 Kopfkissenbezug, 1
              Schlafsack <em>oder</em> Decke mit Bettbezug.
            </li>
            <li>
              Aus hygienischen Gründen keine Lebensmittel, Süßigkeiten oder Getränke in die
              Schlafräume.
            </li>
            <li>Müll muss getrennt werden — in Winterberg gibt es strenge Kontrollen.</li>
            <li>Mobiltelefone aus Sicherheitsgründen nicht in den Schlafräumen aufladen.</li>
            <li>
              Ab <strong>22:00 Uhr gilt Ruhezeit</strong> im Ort.
            </li>
          </ul>
        </Block>

        <Block title="Checkliste für Eure Abreise">
          <p className="text-sm text-[var(--color-wh-fg-muted)]">
            Eventuell angerichtete Schäden sind dem Hüttenwart vor der Schlüsselabgabe zu melden
            und zu protokollieren. Sachschäden werden in Rechnung gestellt.{" "}
            <strong>
              Bei Mehraufwand (Reinigung, Aufräumen, fehlende Müllentsorgung etc.) behalten wir
              uns vor, einen entsprechenden Anteil der Kaution einzubehalten.
            </strong>
          </p>
          <ul className="space-y-1.5">
            <li>Hütte besenrein hinterlassen</li>
            <li>Einrichtung an den ursprünglichen Platz zurück</li>
            <li>Stühle bitte nicht auf die Tische hochstellen</li>
            <li>Geschirrspüler inklusive Besteckschublade ausgeräumt</li>
            <li>Geschirr an seinem Platz</li>
            <li>Kühlschränke leer — und die Türen bitte offen lassen (verhindert Schimmel/Geruch)</li>
            <li>Alle Heizkörper auf Stufe 1 stellen (Frostschutz)</li>
            <li>Restmüll in die schwarzen Mülltonnen am Parkplatz oben</li>
            <li>Papiermüll und Kartons in die Tonne mit blauem Deckel</li>
            <li>
              Gelbe Wertstoff-Säcke unter den Carport von Frau Brunhilde Hennecke, Bundesstraße 10
            </li>
            <li>Sämtliche Lebensmittel, Reste, Getränke, Leergut und sonstigen Müll mitnehmen</li>
            <li>
              <strong>Hütte bis 12:00 Uhr verlassen.</strong>
            </li>
            <li>
              Schlüssel beim Hüttenwart Toni Klauke, Vorm Rohrbach 1 (um die Ecke), in den
              Briefkasten werfen.
            </li>
          </ul>
        </Block>

        <p className="mt-12 text-center text-[var(--color-wh-fg-muted)] italic">
          Die Skifreunde Gütersloh e.V. wünschen Euch einen angenehmen Aufenthalt!
        </p>
      </div>
    </div>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-12">
    <h2 className="text-[26px] sm:text-[30px] mb-4">{title}</h2>
    <div className="space-y-3 text-[var(--color-wh-black)] leading-relaxed [&>ul]:list-disc [&>ul]:list-inside [&>ul]:marker:text-[var(--color-wh-green)] [&>ul]:space-y-1.5">
      {children}
    </div>
  </section>
);

const Address = () => (
  <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-md)] p-4 mb-2">
    <strong>Toni Klauke</strong>
    <br />
    Vorm Rohrbach 1
    <br />
    59955 Winterberg-Langewiese
    <br />
    Festnetz: <a href="tel:+4927582014822">02758 / 2014822</a>
    <br />
    Mobil: <a href="tel:+4915167448273">0151 / 67 44 82 73</a>
  </div>
);
