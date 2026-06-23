import Link from "next/link";
import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";

export const metadata = {
  title: "Datenschutzerklärung · Wiesenhütte",
  description:
    "Datenschutzerklärung der Wiesenhütte (Skifreunde Gütersloh e.V.) — welche Daten wir verarbeiten, wie und warum.",
};

export default async function Datenschutz() {
  const locale = await getServerLocale();
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <DeOnlyBanner locale={locale} />
      <div className="max-w-[860px] mx-auto">
        <div className="eyebrow">Rechtliches</div>
        <h1 className="text-[40px] sm:text-[56px] mt-4 mb-3">Datenschutzerklärung</h1>
        <div className="text-sm text-[var(--color-wh-fg-muted)] space-y-1 mt-2 mb-8">
          <div>
            <strong>Stand:</strong> Mai 2026 · <strong>Version:</strong> 1.0
          </div>
          <div>
            <strong>Geltungsbereich:</strong>{" "}
            <a href="https://wiesenhuette.vercel.app">wiesenhuette.vercel.app</a>{" "}
            (zukünftig www.skifreunde-gt.de) und alle Unterseiten
          </div>
        </div>

        <Callout>
          <p className="m-0">
            <strong>Vorbemerkung:</strong> Wir nehmen Datenschutz ernst. Diese Erklärung beschreibt,
            welche personenbezogenen Daten wir verarbeiten, warum, wie lange und mit wem. Wenn Du
            etwas nicht verstehst oder nicht einverstanden bist, schreib uns — wir antworten
            persönlich.
          </p>
          <p className="m-0 mt-2">
            <strong>Hinweis zur Sprache:</strong> Wir duzen unsere Gäste auf der Webseite, also auch
            hier.
          </p>
        </Callout>

        <Toc
          items={[
            ["1", "Verantwortlicher"],
            ["2", "Allgemeines zur Datenverarbeitung"],
            ["3", "Welche Daten wir verarbeiten"],
            ["4", "Auftragsverarbeiter & Drittanbieter"],
            ["5", "Cookies & vergleichbare Technologien"],
            ["6", "Übermittlung in Drittländer"],
            ["7", "Speicherdauer im Überblick"],
            ["8", "Datensicherheit"],
            ["9", "Deine Rechte"],
            ["10", "Keine automatisierte Entscheidungsfindung"],
            ["11", "Datenschutz von Minderjährigen"],
            ["12", "Änderungen dieser Datenschutzerklärung"],
          ]}
        />

        <Block id="1" title="1. Verantwortlicher">
          <p>
            Verantwortlicher im Sinne der <strong>Datenschutz-Grundverordnung (DSGVO)</strong> und
            sonstiger datenschutzrechtlicher Bestimmungen ist:
          </p>
          <Address>
            <strong>Skifreunde Gütersloh e.V.</strong>
            <br />
            Postfach 2819
            <br />
            33258 Gütersloh
            <br />
            E-Mail: <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a>
          </Address>
          <p>
            <strong>Vorstand (vertretungsberechtigt):</strong>
          </p>
          <ul>
            <li>
              <strong>Tanja Milse</strong> — Geschäftsführung
            </li>
            <li>
              <strong>Norbert Monscheidt</strong> — Finanzen
            </li>
            <li>
              <strong>Thorsten Lütgert</strong> — Sport und Bildung
            </li>
            <li>
              <strong>Horst Borcherding</strong> — Skihütte
            </li>
            <li>
              <strong>Johannes Leiskau</strong> — Kommunikation
            </li>
          </ul>
          <p>
            Die Vereinsdaten sind im Vereinsregister beim Amtsgericht Gütersloh eingetragen
            (Eintrag vom 4. November 1949).
          </p>
          <p>
            <strong>Datenschutzbeauftragter:</strong> Wir sind als gemeinnütziger Verein nicht zur
            Bestellung eines Datenschutzbeauftragten verpflichtet, da die Voraussetzungen nach Art.
            37 DSGVO und § 38 BDSG nicht erfüllt sind. Anfragen zum Datenschutz richtest Du bitte
            direkt an die oben genannte E-Mail-Adresse.
          </p>
        </Block>

        <Block id="2" title="2. Allgemeines zur Datenverarbeitung">
          <p>
            Wir verarbeiten Deine personenbezogenen Daten ausschließlich auf Grundlage der
            gesetzlichen Bestimmungen (insbesondere DSGVO, BDSG, TTDSG, TMG). Wir verfolgen dabei
            den Grundsatz der <strong>Datenminimierung</strong>: Wir erheben nur Daten, die wir für
            den jeweiligen Zweck wirklich brauchen, und speichern sie nur so lange, wie es nötig
            oder gesetzlich vorgeschrieben ist.
          </p>
          <p>
            In dieser Datenschutzerklärung informieren wir Dich darüber, welche Daten wann
            verarbeitet werden, auf welcher Rechtsgrundlage, an wen sie ggf. weitergegeben werden
            und wie lange wir sie aufbewahren.
          </p>
        </Block>

        <Block id="3" title="3. Welche Daten wir verarbeiten">
          <h3>3.1 Beim Aufruf der Webseite (Server-Logs)</h3>
          <p>
            Beim Aufruf unserer Webseite werden durch unseren Hosting-Provider folgende Daten{" "}
            <strong>automatisch</strong> erhoben und in Server-Logfiles gespeichert:
          </p>
          <ul>
            <li>IP-Adresse (für die Auswertung gekürzt)</li>
            <li>Datum und Uhrzeit des Zugriffs</li>
            <li>Aufgerufene URL und HTTP-Statuscode</li>
            <li>Übertragene Datenmenge</li>
            <li>Referrer-URL (vorher besuchte Seite)</li>
            <li>User-Agent (Browser, Betriebssystem)</li>
          </ul>
          <RuleBox>
            <strong>Zweck:</strong> Stabile und sichere Auslieferung der Webseite, Erkennen und
            Abwehren von Angriffen, Aufklärung im Schadensfall.
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
            stabiler, sicherer Webseite).
            <br />
            <strong>Speicherdauer:</strong> Logs werden 14 Tage aufbewahrt und dann automatisch
            gelöscht. Eine Zusammenführung mit anderen Datenquellen findet nicht statt.
          </RuleBox>

          <h3>3.2 Bei Nutzung des Buchungs-Portals (/buchen)</h3>
          <p>Für die Vertragsabwicklung Deiner Buchung verarbeiten wir:</p>
          <ul>
            <li>Vor- und Nachname, ggf. Firma / Verein / Schule</li>
            <li>Anschrift</li>
            <li>E-Mail-Adresse, Telefonnummer</li>
            <li>Buchungsdaten (Zeitraum, Personenzahl, Anlass, ggf. besondere Bedürfnisse)</li>
            <li>Zahlungsdaten (über Stripe — siehe Abschnitt 4)</li>
            <li>Optional: Nachrichten an die Hüttenverwaltung</li>
          </ul>
          <RuleBox>
            <strong>Zweck:</strong> Bearbeitung Deiner Buchung, Vertragsabschluss und -abwicklung,
            Rechnungserstellung, Kommunikation rund um den Aufenthalt (Anreise, Schlüsselübergabe,
            Kurkarten).
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie
            Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Aufbewahrungspflichten, insbesondere § 147 AO und
            § 257 HGB) für buchhaltungsrelevante Daten.
            <br />
            <strong>Speicherdauer:</strong>
            <ul>
              <li>Buchungs- und Rechnungsdaten: 10 Jahre (gesetzliche Aufbewahrungsfristen)</li>
              <li>
                Sonstige Stammdaten: bis zur Beendigung der Geschäftsbeziehung, anschließend
                Löschung, sofern keine Aufbewahrungspflicht entgegensteht
              </li>
              <li>Optionale Nachrichten: bis zum Abschluss der Bearbeitung, dann Löschung</li>
            </ul>
          </RuleBox>

          <h3>3.3 Bei Nutzung des Kontaktformulars / E-Mail-Kontakt (/kontakt)</h3>
          <p>
            Wenn Du uns über das Kontaktformular oder per E-Mail erreichst, verarbeiten wir:
          </p>
          <ul>
            <li>Deinen Namen</li>
            <li>Deine E-Mail-Adresse</li>
            <li>den Inhalt Deiner Nachricht</li>
            <li>ggf. weitere von Dir angegebene Informationen (z. B. Telefonnummer)</li>
          </ul>
          <RuleBox>
            <strong>Zweck:</strong> Bearbeitung und Beantwortung Deiner Anfrage.
            <br />
            <strong>Rechtsgrundlage:</strong> Bei vertragsbezogenen Anfragen Art. 6 Abs. 1 lit. b
            DSGVO; bei sonstigen Anfragen Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
            effektiver Kommunikation).
            <br />
            <strong>Speicherdauer:</strong> Bis zur abschließenden Bearbeitung Deiner Anfrage. Wenn
            aus der Anfrage ein Vertrag entsteht, gelten die Fristen aus 3.2.
          </RuleBox>

          <h3>3.4 Bei Anmeldung zum Newsletter</h3>
          <p>
            Für den Versand unseres Newsletters nutzen wir den Dienst{" "}
            <strong>Brevo</strong> (Sendinblue GmbH). Bei der Anmeldung verarbeiten wir Deine{" "}
            <strong>E-Mail-Adresse</strong> sowie ggf. Deinen <strong>Vornamen</strong> zur
            persönlichen Anrede. Die Anmeldung erfolgt im{" "}
            <strong>Double-Opt-in-Verfahren</strong>: Nach dem Eintragen erhältst Du eine
            Bestätigungsmail; erst nach Klick auf den darin enthaltenen Link wirst Du in den
            Verteiler aufgenommen.
          </p>
          <RuleBox>
            <strong>Zweck:</strong> Versand des Newsletters mit Tipps zur Region, Hütten-Updates und
            Veranstaltungen des Vereins.
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Deine Einwilligung),
            erteilt im Double-Opt-in-Verfahren.
            <br />
            <strong>Auftragsverarbeiter:</strong> Sendinblue GmbH (Brevo), Köln — Versand und
            Verwaltung des Verteilers; siehe Abschnitt 4.
            <br />
            <strong>Speicherdauer:</strong> Bis zur Abmeldung vom Newsletter. Du kannst Dich
            jederzeit über den Abmeldelink in jeder Newsletter-E-Mail oder per Mail an{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a> abmelden. Zum
            Nachweis der Einwilligung speichert Brevo den Anmelde- und Bestätigungszeitpunkt
            samt zugehöriger IP-Adresse.
          </RuleBox>

          <h3>3.4a Bei einer Vereinsmitgliedschaft</h3>
          <p>
            Wenn Du Mitglied der Skifreunde Gütersloh wirst, nehmen wir Deine{" "}
            <strong>E-Mail-Adresse</strong> und Deinen <strong>Namen</strong> in unsere bei{" "}
            <strong>Brevo</strong> geführte Mitgliederliste auf, um Dich über Vereinsangelegenheiten
            (Termine, Einladungen, organisatorische Hinweise) informieren zu können.
          </p>
          <RuleBox>
            <strong>Zweck:</strong> Kommunikation mit den Vereinsmitgliedern.
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Durchführung des
            Mitgliedschaftsverhältnisses).
            <br />
            <strong>Auftragsverarbeiter:</strong> Sendinblue GmbH (Brevo); siehe Abschnitt 4.
            <br />
            <strong>Speicherdauer:</strong> Für die Dauer der Mitgliedschaft. Vereinsbezogenen
            Mitteilungen kannst Du jederzeit per Mail an{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a> widersprechen.
          </RuleBox>

          <h3>3.4b Bei Anmeldung zu Vereinsveranstaltungen</h3>
          <p>
            Wenn Du Dich über unsere Webseite zu einer Vereinsveranstaltung (z. B. dem
            Wapelbad-Vereinsfest) anmeldest, verarbeiten wir folgende Daten:
          </p>
          <RuleBox>
            <strong>Daten:</strong> Name, E-Mail-Adresse, Personenanzahl, ggf. Teilnahme an
            optionalen Zusatzleistungen (z. B. Grillbuffet).
            <br />
            <strong>Zweck:</strong> Durchführung und Organisation der Veranstaltung, Kontaktaufnahme
            bei kurzfristigen Änderungen (z. B. wetterbedingter Absage).
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche bzw.
            vertragliche Maßnahme) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse des
            Vereins an der Veranstaltungsorganisation).
            <br />
            <strong>Speicherdauer:</strong> Bis zu 30 Tage nach der Veranstaltung, danach
            vollständige Löschung. Es erfolgt keine Weitergabe der Daten an Dritte.
          </RuleBox>

          <h3>3.5 Beim Manager-Login (Backend)</h3>
          <p>
            Für die Pflege der Webseite und die Verwaltung der Buchungen gibt es einen geschützten
            Login-Bereich, der ausschließlich vom Vorstand und beauftragten Helfer:innen genutzt
            wird. Beim Login verarbeiten wir:
          </p>
          <ul>
            <li>E-Mail-Adresse</li>
            <li>Passwort (gespeichert ausschließlich als bcrypt-Hash)</li>
            <li>Sitzungs-Cookie (siehe Abschnitt 5.1)</li>
            <li>Zeitpunkt und IP-Adresse des Logins (für Sicherheits-Audit)</li>
          </ul>
          <RuleBox>
            <strong>Zweck:</strong> Zugangssicherung des nicht-öffentlichen Bereichs, Schutz vor
            unbefugtem Zugriff.
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
            einer sicheren Verwaltung der Webseite).
            <br />
            <strong>Speicherdauer:</strong> Sicherheits-Audit-Logs 90 Tage, dann automatische
            Löschung. Klartext-Passwörter liegen uns niemals vor.
          </RuleBox>

          <h3>3.6 Bei Veröffentlichung im Blog</h3>
          <p>
            Falls wir im Blog Beiträge mit personenbezogenen Inhalten (Fotos, Zitate, Namen)
            veröffentlichen, geschieht dies nur mit ausdrücklicher Einwilligung der betroffenen
            Personen.
          </p>
          <RuleBox>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
            <br />
            <strong>Speicherdauer:</strong> Bis zum Widerruf der Einwilligung. Du kannst die
            Einwilligung jederzeit widerrufen — schreib uns einfach an{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a>.
          </RuleBox>

          <h3>3.7 Beim Radtouren-Matching (/radtouren)</h3>
          <p>
            Wenn Du Dich für gemeinsame Rad-Wochenenden einträgst, verarbeiten wir:
          </p>
          <ul>
            <li>Deine E-Mail-Adresse</li>
            <li>Deinen Vornamen (sofern angegeben)</li>
            <li>die von Dir gewählten Wunsch-Wochenenden</li>
            <li>ob Du Interesse an einem Lunchpaket hast</li>
            <li>Zeitpunkt von Eintrag und Bestätigung</li>
          </ul>
          <RuleBox>
            <strong>Zweck:</strong> Zusammenführung von Interessierten zu gemeinsamen
            Radtouren-Gruppen an der Wiesenhütte. Kommt eine Gruppe von mindestens 8
            bestätigten Personen für denselben Zeitraum zustande, geben wir Deine
            E-Mail-Adresse an die übrigen Teilnehmer:innen genau dieses Zeitraums weiter,
            damit Ihr Euch direkt abstimmen könnt.
            <br />
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Deine Einwilligung),
            erteilt im Double-Opt-in-Verfahren; in die Weitergabe an die Gruppe willigst Du
            beim Eintragen ausdrücklich ein.
            <br />
            <strong>Speicherdauer:</strong> Bis zum Widerruf bzw. bis der gewählte Zeitraum
            verstrichen ist. Du kannst Dich jederzeit per Mail an{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a> austragen.
          </RuleBox>
        </Block>

        <Block id="4" title="4. Auftragsverarbeiter & Drittanbieter">
          <p>
            Folgende Anbieter verarbeiten in unserem Auftrag personenbezogene Daten. Mit allen ist
            — soweit erforderlich — ein{" "}
            <strong>Auftragsverarbeitungsvertrag (AVV) gem. Art. 28 DSGVO</strong> geschlossen.
          </p>

          <Provider
            name="Vercel Inc."
            purpose="Webseiten-Hosting (Next.js Serverless-Hosting)"
            location="Region Frankfurt (Europa)"
            avv="geschlossen"
            link="https://vercel.com/legal/privacy-policy"
          />
          <Provider
            name="Neon Inc."
            purpose="Datenbank-Hosting (PostgreSQL für Buchungen, Kunden, Blog)"
            location="EU Central (Frankfurt)"
            avv="geschlossen"
            link="https://neon.tech/privacy-policy"
          />
          <Provider
            name="Stripe Payments Europe Ltd."
            purpose="Zahlungsabwicklung (Kreditkarten, SEPA, Anzahlung & Restzahlung, Mitgliedsbeiträge, Spenden)"
            location="Irland (EU). Im Rahmen der Betrugserkennung erfolgt eine teilweise Verarbeitung in den USA — siehe Abschnitt 6."
            avv="geschlossen"
            link="https://stripe.com/de/privacy"
          />
          <Provider
            name="1&1 IONOS SE"
            purpose="E-Mail-Versand (Buchungsbestätigung, Mietvertrag, Kurtaxe-Hinweis, Manager-Korrespondenz)"
            location="Deutschland"
            avv="geschlossen"
            link="https://www.ionos.de/terms-gtc/datenschutzerklaerung/"
          />
          <Provider
            name="Sendinblue GmbH (Brevo)"
            purpose="Newsletter-Versand und Verwaltung der Newsletter- sowie Mitgliederliste"
            location="Köln (Deutschland); Konzern mit Sitz in Frankreich (EU)"
            avv="geschlossen"
            link="https://www.brevo.com/de/legal/privacypolicy/"
          />
          <Provider
            name="Vercel Blob (Vercel Inc.)"
            purpose="Speicherung hochgeladener Bilder (Blog, Cover-Bilder)"
            location="Region Frankfurt"
            avv="geschlossen"
            link="https://vercel.com/legal/privacy-policy"
          />
          <Provider
            name="OpenStreetMap Foundation"
            purpose={`Anzeige der Karte auf /lage. Wird erst geladen, nachdem Du der Kategorie "Komfort & Einbettungen" zugestimmt hast.`}
            location="UK / Niederlande (Server)"
            avv="Art. 6 Abs. 1 lit. a DSGVO i. V. m. § 25 Abs. 1 TTDSG (Einwilligung)"
            link="https://wiki.openstreetmap.org/wiki/Privacy_Policy"
          />
          <Provider
            name="komoot GmbH"
            purpose={`Eingebettete Wanderkarten auf /lage (interaktive Tour-Karten). Werden erst geladen, nachdem Du der Kategorie "Komfort & Einbettungen" zugestimmt hast. Dabei kann u. a. Deine IP-Adresse an komoot übermittelt werden.`}
            location="Potsdam (Deutschland)"
            avv="Art. 6 Abs. 1 lit. a DSGVO i. V. m. § 25 Abs. 1 TTDSG (Einwilligung)"
            link="https://www.komoot.com/legal/privacy"
          />
        </Block>

        <Block id="5" title="5. Cookies & vergleichbare Technologien">
          <p>
            Auf unserer Webseite kommen Cookies und ähnliche Speichermechanismen (z. B.
            LocalStorage) zum Einsatz. Wir unterscheiden klar zwischen{" "}
            <strong>technisch notwendigen</strong> und <strong>optionalen</strong> Cookies.
          </p>

          <h3>5.1 Technisch notwendige Cookies (immer aktiv)</h3>
          <p>
            Diese Cookies sind für den Betrieb der Webseite zwingend erforderlich. Eine Einwilligung
            ist hierfür nicht nötig (§ 25 Abs. 2 Nr. 2 TTDSG).
          </p>
          <Table
            head={["Cookie / Speicherung", "Zweck", "Speicherdauer", "Anbieter"]}
            rows={[
              [
                "next-auth.session-token",
                "Authentifizierung des Manager-Logins (HTTPOnly, Secure)",
                "30 Tage",
                "erstanbieter",
              ],
              [
                "__Host-csrf",
                "Schutz gegen Cross-Site Request Forgery",
                "Sitzungsdauer",
                "erstanbieter",
              ],
              [
                "wh_cookie_consent (LocalStorage)",
                "Speichert Deine Cookie-Einstellungen lokal",
                "12 Monate",
                "erstanbieter",
              ],
            ]}
          />

          <h3>5.2 Optionale Cookies & Einbettungen</h3>
          <p>
            Diese werden ausschließlich nach Deiner ausdrücklichen Einwilligung geladen. Du erteilst
            sie über unser Cookie-Banner; Du kannst sie jederzeit über den Link{" "}
            <strong>„Cookie-Einstellungen"</strong> im Footer widerrufen.
          </p>
          <Table
            head={["Kategorie", "Was wird aktiviert?", "Anbieter", "Status"]}
            rows={[
              [
                "Komfort & Einbettungen",
                "OpenStreetMap-Karte auf /lage, komoot-Wanderkarten auf /lage, ggf. YouTube-/Vimeo-Embeds in Blogbeiträgen",
                "OpenStreetMap, komoot, Google (YouTube), Vimeo",
                "aktiv",
              ],
              [
                "Statistik",
                "Reservierung für zukünftige privacy-freundliche Tools (z. B. Plausible Analytics)",
                "n. a.",
                "derzeit nicht aktiv",
              ],
              [
                "Marketing",
                "n. a.",
                "n. a.",
                "aktuell nicht aktiv und nicht geplant",
              ],
            ]}
          />

          <p>
            <strong>Rechtsgrundlage:</strong>
          </p>
          <ul>
            <li>
              für notwendige Cookies: § 25 Abs. 2 Nr. 2 TTDSG bzw. Art. 6 Abs. 1 lit. b DSGVO
            </li>
            <li>
              für optionale Cookies: Deine Einwilligung gem. § 25 Abs. 1 TTDSG i. V. m. Art. 6 Abs.
              1 lit. a DSGVO
            </li>
          </ul>
        </Block>

        <Block id="6" title="6. Übermittlung in Drittländer">
          <p>
            Eine Übermittlung Deiner Daten in Länder außerhalb der EU/des EWR (sog. Drittländer)
            findet grundsätzlich <strong>nicht</strong> statt. Eine Ausnahme:
          </p>
          <ul>
            <li>
              <strong>Stripe</strong> verarbeitet zur Betrugserkennung Daten teilweise in den USA.
              Hierfür liegen <strong>Standardvertragsklauseln gem. Art. 46 DSGVO</strong> vor;
              zudem ist Stripe nach dem EU-US-Datenschutzrahmen zertifiziert. Details in der{" "}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noreferrer">
                Datenschutzerklärung von Stripe
              </a>
              .
            </li>
          </ul>
          <p>
            Wenn Du eingebettete Inhalte (z. B. YouTube-Videos in Blogbeiträgen) durch Deine
            Einwilligung aktivierst, kann es zu einer Übermittlung in Drittländer (USA) kommen.
            Diese Verarbeitung erfolgt ausschließlich auf Grundlage Deiner Einwilligung.
          </p>
        </Block>

        <Block id="7" title="7. Speicherdauer im Überblick">
          <Table
            head={["Datenkategorie", "Speicherdauer", "Rechtsgrundlage"]}
            rows={[
              ["Server-Logs", "14 Tage", "Art. 6 Abs. 1 lit. f DSGVO"],
              ["Buchungs- und Rechnungsdaten", "10 Jahre", "§ 147 AO, § 257 HGB"],
              [
                "Sonstige Buchungs-Stammdaten",
                "bis Ende Geschäftsbeziehung",
                "Art. 6 Abs. 1 lit. b DSGVO",
              ],
              ["Kontaktanfragen", "bis zur Bearbeitung", "Art. 6 Abs. 1 lit. b/f DSGVO"],
              [
                "Newsletter-Daten",
                "bis Abmeldung; Nachweis-Log 3 Jahre",
                "Art. 6 Abs. 1 lit. a DSGVO",
              ],
              [
                "Veranstaltungsanmeldungen",
                "bis 30 Tage nach der Veranstaltung",
                "Art. 6 Abs. 1 lit. b/f DSGVO",
              ],
              ["Manager-Login Audit-Logs", "90 Tage", "Art. 6 Abs. 1 lit. f DSGVO"],
              ["Blog-Einwilligungen (Foto/Zitat)", "bis Widerruf", "Art. 6 Abs. 1 lit. a DSGVO"],
              [
                "Cookie-Einstellungen (LocalStorage)",
                "12 Monate",
                "Einwilligung / TTDSG",
              ],
            ]}
          />
        </Block>

        <Block id="8" title="8. Datensicherheit">
          <p>
            Wir setzen technisch und organisatorisch angemessene Maßnahmen ein, um Deine Daten
            gegen Verlust, Manipulation und unberechtigten Zugriff zu schützen:
          </p>
          <ul>
            <li>
              <strong>TLS/SSL-Verschlüsselung (HTTPS)</strong> für die gesamte Kommunikation
              zwischen Deinem Browser und unserer Webseite.
            </li>
            <li>
              <strong>Bcrypt-Hashing</strong> aller Passwörter — Klartext-Passwörter liegen uns
              nirgendwo vor.
            </li>
            <li>
              <strong>Verschlüsselte Backups</strong> für Datenbank- und Dateispeicher.
            </li>
            <li>
              <strong>Strikte Zugriffsbeschränkungen</strong> im Manager-Bereich; Zugang nur für
              Vorstand und ausdrücklich beauftragte Personen.
            </li>
            <li>
              <strong>Regelmäßige Sicherheits-Updates</strong> der eingesetzten Komponenten
              (Next.js, Authentifizierung, Datenbank).
            </li>
          </ul>
          <p>
            Trotz aller Sorgfalt ist eine vollständige Sicherheit bei der Datenübertragung im
            Internet nicht garantierbar. Solltest Du den Verdacht haben, dass mit Deinen Daten
            etwas nicht stimmt, melde Dich bitte umgehend bei uns.
          </p>
        </Block>

        <Block id="9" title="9. Deine Rechte">
          <p>Du hast nach DSGVO folgende Rechte gegenüber uns:</p>
          <ul>
            <li>
              <strong>Auskunftsrecht (Art. 15 DSGVO)</strong> — Du kannst Auskunft darüber
              verlangen, welche Daten wir zu Deiner Person verarbeiten.
            </li>
            <li>
              <strong>Berichtigungsrecht (Art. 16 DSGVO)</strong> — unrichtige Daten musst Du nicht
              hinnehmen.
            </li>
            <li>
              <strong>Recht auf Löschung (Art. 17 DSGVO)</strong> — soweit keine gesetzliche
              Aufbewahrungspflicht entgegensteht.
            </li>
            <li>
              <strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO).</strong>
            </li>
            <li>
              <strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</strong> — Du kannst Deine
              Daten in einem maschinenlesbaren Format erhalten.
            </li>
            <li>
              <strong>Widerspruchsrecht (Art. 21 DSGVO)</strong> — gegen Verarbeitungen, die wir auf
              berechtigte Interessen stützen.
            </li>
            <li>
              <strong>Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)</strong> —
              jederzeit, mit Wirkung für die Zukunft.
            </li>
            <li>
              <strong>Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO).</strong>
            </li>
          </ul>
          <p>
            Anfragen richtest Du formlos an{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a>. Wir antworten{" "}
            <strong>innerhalb eines Monats</strong>, in der Regel deutlich schneller. Eine
            Identitätsprüfung kann erforderlich sein, wenn Zweifel an Deiner Identität bestehen.
          </p>

          <h3>Zuständige Aufsichtsbehörde</h3>
          <p>
            Du kannst Dich jederzeit bei der für uns zuständigen Datenschutz-Aufsichtsbehörde
            beschweren:
          </p>
          <Address>
            <strong>
              Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen
            </strong>
            <br />
            Kavalleriestraße 2–4
            <br />
            40213 Düsseldorf
            <br />
            Telefon: 0211 38424-0
            <br />
            E-Mail: <a href="mailto:poststelle@ldi.nrw.de">poststelle@ldi.nrw.de</a>
            <br />
            Web:{" "}
            <a href="https://www.ldi.nrw.de/" target="_blank" rel="noreferrer">
              ldi.nrw.de
            </a>
          </Address>
        </Block>

        <Block id="10" title="10. Keine automatisierte Entscheidungsfindung">
          <p>
            Wir nutzen <strong>keine automatisierten Entscheidungsfindungen oder Profiling</strong>{" "}
            im Sinne von Art. 22 DSGVO. Buchungs-, Vertrags- und Verwaltungsentscheidungen werden
            ausschließlich durch Menschen (Vorstand, Hüttenwart) getroffen.
          </p>
        </Block>

        <Block id="11" title="11. Datenschutz von Minderjährigen">
          <p>
            Unsere Webseite richtet sich nicht gezielt an Personen unter 16 Jahren. Buchungen
            können nur von Personen ab 18 Jahren bzw. mit Zustimmung der Sorgeberechtigten
            vorgenommen werden. Sollte uns bekannt werden, dass wir Daten einer Person unter 16
            Jahren ohne entsprechende Einwilligung verarbeiten, löschen wir diese unverzüglich.
          </p>
          <p>
            Bei Klassenfahrten und Schulgruppen werden personenbezogene Daten der Schüler:innen
            ausschließlich über die jeweilige Schule erhoben und nicht direkt durch uns
            verarbeitet.
          </p>
        </Block>

        <Block id="12" title="12. Änderungen dieser Datenschutzerklärung">
          <p>
            Wir passen diese Datenschutzerklärung an, sobald sich an der Datenverarbeitung etwas
            ändert — etwa weil wir neue Tools einsetzen oder bestehende abschalten. Die jeweils
            aktuelle Fassung findest Du immer auf dieser Seite mit dem entsprechenden Stand-Datum
            oben.
          </p>
          <p>
            Wesentliche Änderungen kündigen wir — sofern Du registriert bist oder regelmäßig mit
            uns kommunizierst — per E-Mail an. Eine erneute Einwilligung holen wir ein, sofern
            dies rechtlich erforderlich ist.
          </p>
        </Block>

        <Callout className="mt-12">
          <p className="m-0">
            <strong>Fragen?</strong> Schreib uns:{" "}
            <a href="mailto:skifreunde@wiesenhuette.de">skifreunde@wiesenhuette.de</a>. Wir antworten
            persönlich.
          </p>
        </Callout>

        <p className="text-xs text-[var(--color-wh-fg-muted)] mt-12 italic">
          Skifreunde Gütersloh e.V. · Postfach 2819 · 33258 Gütersloh · Vereinsregister: AG
          Gütersloh
        </p>
      </div>
    </div>
  );
}

const Block = ({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="mt-12 scroll-mt-20">
    <h2 className="text-[28px] sm:text-[32px] mb-4">{title}</h2>
    <div className="space-y-3 text-[var(--color-wh-black)] leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:marker:text-[var(--color-wh-green)] [&_ul]:space-y-1.5 [&_h3]:text-[20px] [&_h3]:mt-7 [&_h3]:mb-2">
      {children}
    </div>
  </section>
);

const Toc = ({ items }: { items: [string, string][] }) => (
  <nav
    aria-label="Inhaltsverzeichnis"
    className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 sm:p-6 my-10"
  >
    <div className="eyebrow mb-3">Inhalt</div>
    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 list-none p-0 m-0 text-sm">
      {items.map(([num, label]) => (
        <li key={num}>
          <Link
            href={`#${num}`}
            className="text-[var(--color-wh-deep-green)] no-underline hover:underline"
          >
            {num}. {label}
          </Link>
        </li>
      ))}
    </ol>
  </nav>
);

const Callout = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={
      "border-l-4 border-[var(--color-wh-green)] bg-[var(--color-wh-green-soft)]/40 rounded-r-[var(--radius-md)] px-5 py-4 my-6 " +
      className
    }
  >
    {children}
  </div>
);

const RuleBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] p-4 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:marker:text-[var(--color-wh-green)] [&_ul]:mt-2 [&_ul]:space-y-1">
    {children}
  </div>
);

const Address = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-md)] p-4 my-3">{children}</div>
);

const Provider = ({
  name,
  purpose,
  location,
  avv,
  link,
}: {
  name: string;
  purpose: string;
  location: string;
  avv: string;
  link: string;
}) => (
  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] p-4 my-3">
    <div className="font-semibold text-[var(--color-wh-deep-green)]">{name}</div>
    <div className="text-sm text-[var(--color-wh-fg-muted)] mt-1 space-y-1">
      <div>
        <strong>Zweck:</strong> {purpose}
      </div>
      <div>
        <strong>Sitz / Server:</strong> {location}
      </div>
      <div>
        <strong>AVV:</strong> {avv}
      </div>
      <div>
        <a href={link} target="_blank" rel="noreferrer">
          Datenschutzerklärung des Anbieters ↗
        </a>
      </div>
    </div>
  </div>
);

const Table = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto my-3 -mx-2 sm:mx-0">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-[var(--color-wh-snow)] border-b border-[var(--color-wh-winter-grey)]">
          {head.map((h) => (
            <th
              key={h}
              className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            className="border-b border-[var(--color-wh-winter-grey)] last:border-b-0 align-top"
          >
            {r.map((c, j) => (
              <td key={j} className="px-3 py-2.5 leading-relaxed">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
