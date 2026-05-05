export const metadata = {
  title: "Impressum · Wiesenhütte",
  description: "Impressum gem. § 5 DDG der Wiesenhütte (Skifreunde Gütersloh e.V.).",
};

export default function Impressum() {
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[760px] mx-auto">
        <div className="eyebrow">Rechtliches</div>
        <h1 className="text-[40px] sm:text-[56px] mt-4 mb-2">Impressum</h1>
        <p className="text-sm text-[var(--color-wh-fg-muted)] mt-4">
          Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
        </p>

        <Block title="Anbieter">
          <p>
            <strong>Skifreunde Gütersloh e.V.</strong>
            <br />
            Postfach 2819
            <br />
            33258 Gütersloh
          </p>
        </Block>

        <Block title="Kontakt">
          <p>
            E-Mail: <a href="mailto:info@skifreunde-gt.de">info@skifreunde-gt.de</a>
            <br />
            Buchungsanfragen: <a href="mailto:vorstand@skifreunde-gt.de">vorstand@skifreunde-gt.de</a>
            <br />
            Hüttenwart vor Ort: Werner Klauke,{" "}
            <a href="tel:+4927582014822">02758 / 2014822</a> ·{" "}
            <a href="tel:+4915167448273">0151 / 67 44 82 73</a>
          </p>
        </Block>

        <Block title="Vertretungsberechtigter Vorstand">
          <p className="text-[var(--color-wh-fg-muted)] italic">
            [BITTE ERGÄNZEN: Vor- und Nachname der vertretungsberechtigten Vorstandsmitglieder gemäß
            aktueller Satzung. Bei Bedarf Funktionen angeben — z. B. „1. Vorsitzender: Norbert
            Monscheidt"; „Schatzmeister: …"]
          </p>
        </Block>

        <Block title="Vereinsregister">
          <p>
            Registergericht: <strong>Amtsgericht Gütersloh</strong>
            <br />
            Registernummer: <em className="text-[var(--color-wh-fg-muted)]">[BITTE ERGÄNZEN: VR-Nummer]</em>
            <br />
            Eingetragen: 4. November 1949
          </p>
        </Block>

        <Block title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <p className="text-[var(--color-wh-fg-muted)] italic">
            [BITTE ERGÄNZEN: Vor- und Nachname + Anschrift einer in Deutschland wohnhaften Person,
            die für die journalistisch-redaktionellen Inhalte verantwortlich zeichnet. Üblicherweise
            ein Vorstandsmitglied.]
          </p>
        </Block>

        <Block title="Verbraucherstreitbeilegung">
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). Die Plattform der EU-Kommission
            zur Online-Streitbeilegung findest Du unter{" "}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </Block>

        <Block title="Haftung für Inhalte">
          <p>
            Als Diensteanbieter sind wir gem. § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen. Bei Bekanntwerden entsprechender Rechtsverletzungen entfernen wir
            diese Inhalte umgehend.
          </p>
        </Block>

        <Block title="Haftung für Links">
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
            verantwortlich. Bei Bekanntwerden von Rechtsverstößen werden wir derartige Links
            umgehend entfernen.
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
        </Block>

        <Block title="Bildnachweise">
          <ul>
            <li>Eigene Aufnahmen Skifreunde Gütersloh e.V.</li>
            <li>Drohnenaufnahmen: STG Medien (mit Verwendungsrecht)</li>
            <li>Logo „175 Jahre Evangelisch Stiftisches Gymnasium": © ESG Gütersloh, mit Genehmigung</li>
          </ul>
        </Block>

        <p className="text-xs text-[var(--color-wh-fg-muted)] mt-12">Stand: Mai 2026</p>
      </div>
    </div>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-[24px] sm:text-[28px] mb-3">{title}</h2>
    <div className="space-y-3 text-[var(--color-wh-black)] leading-relaxed [&>ul]:list-disc [&>ul]:list-inside [&>ul]:marker:text-[var(--color-wh-green)] [&>ul]:space-y-1.5">
      {children}
    </div>
  </section>
);
