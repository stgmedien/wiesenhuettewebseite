export const metadata = {
  title: "Impressum · Wiesenhütte",
  description: "Impressum gem. § 5 DDG der Wiesenhütte (Skifreunde Gütersloh e.V.).",
};

/*
  PRIVATER HINWEIS — nicht öffentlich:
  Nach § 5 DDG ist eine "Anschrift, unter der sie niedergelassen sind" anzugeben.
  Postfach allein wird zunehmend kritisch gesehen. Für einen Verein mit
  Buchungsfunktion (Stripe, Mietverträge) wird eine ladungsfähige Anschrift
  empfohlen. Drei Varianten:
   1. Geschäftsadresse über ein Vorstandsmitglied (Standardlösung), z. B.
      "c/o Norbert Monscheidt, Oesternforth-West 28, 33397 Rietberg"
      — bei Norbert klären, ob er einverstanden ist
   2. Adresse der Wiesenhütte als geschäftliche Niederlassung
      ("Bundesstraße 6, 59955 Winterberg-Langewiese") — rechtlich nicht eindeutig
   3. Eigene Geschäftsadresse beim Verein bzw. Vorstandsmitglied
  Empfehlung: Variante 1. Sobald entschieden, hier ergänzen. Bis dahin bleibt
  das Postfach — abmahn-anfällig, aber nicht akut illegal.
*/

import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";

export default async function Impressum() {
  const locale = await getServerLocale();
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <DeOnlyBanner locale={locale} />
      <div className="max-w-[820px] mx-auto">
        <div className="eyebrow">Rechtliches</div>
        <h1 className="text-[40px] sm:text-[56px] mt-4 mb-3">Impressum</h1>
        <p className="text-sm text-[var(--color-wh-fg-muted)] mt-2 mb-8">
          Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG) · Stand: Mai 2026
        </p>

        <Block title="Anbieter">
          <Address>
            <strong>Skifreunde Gütersloh e.V.</strong>
            <br />
            Postfach 2819
            <br />
            33258 Gütersloh
            <br />
            Deutschland
          </Address>
        </Block>

        <Block title="Kontakt">
          <p>
            <strong>E-Mail:</strong>{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a>
            <br />
            <strong>Buchungsanfragen:</strong>{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a>
            <br />
            <strong>Hüttenwart vor Ort:</strong> Toni Klauke,{" "}
            <a href="tel:+4927582014822">02758 / 2014822</a> ·{" "}
            <a href="tel:+4915167448273">0151 / 67 44 82 73</a>
          </p>
        </Block>

        <Block title="Vertretungsberechtigter Vorstand">
          <p>
            Der Vorstand des Vereins setzt sich aus fünf Ressorts zusammen.{" "}
            <strong>Jeweils zwei Vorstandsmitglieder vertreten den Verein gemeinsam.</strong>
          </p>
          <ul>
            <li>
              <strong>Tanja Milse</strong> — Vorstand Geschäftsführung
            </li>
            <li>
              <strong>Norbert Monscheidt</strong> — Vorstand Vereinsfinanzen
            </li>
            <li>
              <strong>Thorsten Lütgert</strong> — Vorstand Sport und Bildung
            </li>
            <li>
              <strong>Dr. Horst Borcherding</strong> — Vorstand Skihütte
            </li>
            <li>
              <strong>Johannes Leiskau</strong> — Vorstand Kommunikation
            </li>
          </ul>
        </Block>

        <Block title="Vereinsregister">
          <p>
            <strong>Registergericht:</strong> Amtsgericht Gütersloh
            <br />
            <strong>Registernummer:</strong> VR 320
            <br />
            <strong>Erstmalig eingetragen:</strong> 4. November 1949
            <br />
            <strong>Letzte Eintragungsänderung:</strong> 9. Juli 2024 (Neufassung der Satzung vom
            15. April 2024)
          </p>
        </Block>

        <Block title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <Address>
            <strong>Johannes Leiskau</strong> (Vorstand Kommunikation)
            <br />
            c/o Skifreunde Gütersloh e.V.
            <br />
            Postfach 2819
            <br />
            33258 Gütersloh
          </Address>
        </Block>

        <Block title="Verbraucherstreitbeilegung">
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
          </p>
          <p>
            Die Plattform der EU-Kommission zur <strong>Online-Streitbeilegung</strong> findest Du
            unter{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </Block>

        <Block title="Haftung für Inhalte">
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
            allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
            erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte umgehend
            entfernen.
          </p>
        </Block>

        <Block title="Haftung für Links">
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
            übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
            Betreiber der Seiten verantwortlich.
          </p>
          <p>
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
            überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
            Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
            Rechtsverstößen werden wir derartige Links umgehend entfernen.
          </p>
        </Block>

        <Block title="Urheberrecht">
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke (Texte, Fotos, Grafiken,
            Videos) auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung,
            Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
            Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw.
            Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten,
            nicht-kommerziellen Gebrauch gestattet.
          </p>
          <p>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
            Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
            gekennzeichnet. Solltest Du trotzdem auf eine Urheberrechtsverletzung aufmerksam
            werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
            Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
          </p>
        </Block>

        <Block title="Bildnachweise">
          <ul>
            <li>Eigene Aufnahmen Skifreunde Gütersloh e.V.</li>
            <li>Drohnenaufnahmen: STG Medien (mit Verwendungsrecht)</li>
            <li>
              Logo „175 Jahre Evangelisch Stiftisches Gymnasium": © ESG Gütersloh, mit Genehmigung
            </li>
            <li>
              Bildmaterial der Region (Lage-Seite und Blog): mit Genehmigung der jeweiligen
              Anbieter (Winterberg Touristik und Wirtschaft GmbH, Sauerland-Tourismus e.V.,
              Postwiese, Erlebnisberg Kappe u. a.); konkrete Quellenangabe direkt am Bild.
            </li>
          </ul>
        </Block>

        <Block title="Hinweis zur Streitschlichtung">
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            . Unsere E-Mail-Adresse für Anfragen findest Du oben unter „Kontakt".
          </p>
        </Block>

        <p className="text-xs text-[var(--color-wh-fg-muted)] mt-12 italic">
          Stand: Mai 2026 · Skifreunde Gütersloh e.V. · Vereinsregister AG Gütersloh VR 320
        </p>
      </div>
    </div>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-[26px] sm:text-[30px] mb-3">{title}</h2>
    <div className="space-y-3 text-[var(--color-wh-black)] leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:marker:text-[var(--color-wh-green)] [&_ul]:space-y-1.5">
      {children}
    </div>
  </section>
);

const Address = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-md)] p-4 my-3">{children}</div>
);
