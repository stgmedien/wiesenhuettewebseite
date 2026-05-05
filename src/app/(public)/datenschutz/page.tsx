export const metadata = {
  title: "Datenschutzerklärung · Wiesenhütte",
  description:
    "Datenschutzerklärung der Wiesenhütte (Skifreunde Gütersloh e.V.) — welche Daten wir verarbeiten, wie und warum.",
};

export default function Datenschutz() {
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[820px] mx-auto">
        <div className="eyebrow">Rechtliches</div>
        <h1 className="text-[40px] sm:text-[56px] mt-4 mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-[var(--color-wh-fg-muted)] mt-4">
          Stand: Mai 2026 · Version 1.0
        </p>

        <Block title="1. Verantwortlicher">
          <p>
            Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) und sonstiger
            datenschutzrechtlicher Bestimmungen ist:
          </p>
          <Address />
        </Block>

        <Block title="2. Allgemeines">
          <p>
            Wir verarbeiten Deine personenbezogenen Daten ausschließlich auf Grundlage der
            gesetzlichen Bestimmungen (DSGVO, BDSG, TTDSG, TMG). In dieser Datenschutzerklärung
            informieren wir Dich über die wichtigsten Aspekte der Datenverarbeitung im Rahmen
            unserer Webseite.
          </p>
        </Block>

        <Block title="3. Welche Daten wir verarbeiten">
          <h3>3.1 Beim Aufruf der Webseite (Server-Logs)</h3>
          <p>
            Beim Aufruf unserer Webseite werden durch unseren Hosting-Provider folgende Daten
            automatisch erhoben und in Server-Logfiles gespeichert:
          </p>
          <ul>
            <li>IP-Adresse (gekürzt bei Auswertung)</li>
            <li>Datum und Uhrzeit des Zugriffs</li>
            <li>Aufgerufene URL und HTTP-Statuscode</li>
            <li>Übertragene Datenmenge</li>
            <li>Referrer-URL (vorher besuchte Seite)</li>
            <li>User-Agent (Browser, Betriebssystem)</li>
          </ul>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
            stabiler, sicherer Auslieferung der Webseite). Logs werden 14 Tage aufbewahrt und dann
            automatisch gelöscht.
          </p>

          <h3>3.2 Bei Nutzung des Buchungs-Portals</h3>
          <p>Für die Vertragsabwicklung Deiner Buchung verarbeiten wir:</p>
          <ul>
            <li>Vor- und Nachname, ggf. Firma / Verein</li>
            <li>Anschrift</li>
            <li>E-Mail-Adresse, Telefonnummer</li>
            <li>Buchungsdaten (Zeitraum, Personenzahl, Anlass)</li>
            <li>Zahlungsdaten (über Stripe — siehe Abschnitt 4)</li>
            <li>Optional: Nachrichten an die Hüttenverwaltung</li>
          </ul>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) bzw.
            lit. c (steuer- und handelsrechtliche Aufbewahrung).
          </p>
          <p>
            <strong>Aufbewahrung:</strong> Buchungs- und Rechnungsdaten 10 Jahre (§ 147 AO, § 257
            HGB). Nicht-finanzielle Stammdaten werden nach Ende der Geschäftsbeziehung gelöscht,
            sofern keine gesetzliche Aufbewahrungspflicht besteht.
          </p>

          <h3>3.3 Bei Nutzung des Kontaktformulars / E-Mail-Kontakt</h3>
          <p>
            Bei Kontaktaufnahme verarbeiten wir Deinen Namen, E-Mail-Adresse und den Inhalt der
            Nachricht ausschließlich zur Beantwortung Deiner Anfrage. <strong>Rechtsgrundlage:</strong>{" "}
            Art. 6 Abs. 1 lit. b oder f DSGVO.
          </p>
        </Block>

        <Block title="4. Auftragsverarbeiter & Drittanbieter">
          <p>
            Folgende Anbieter verarbeiten in unserem Auftrag personenbezogene Daten. Mit allen ist
            ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO) geschlossen.
          </p>

          <Provider
            name="Vercel Inc."
            purpose="Webseiten-Hosting (Next.js Serverless-Hosting)"
            location="Region Frankfurt (Europa)"
            link="https://vercel.com/legal/privacy-policy"
          />
          <Provider
            name="Neon Inc."
            purpose="Datenbank-Hosting (PostgreSQL für Buchungen, Kunden, Blog)"
            location="EU Central (Frankfurt)"
            link="https://neon.tech/privacy-policy"
          />
          <Provider
            name="Stripe Payments Europe Ltd."
            purpose="Zahlungsabwicklung (Kreditkarten, SEPA, Anzahlung & Restzahlung)"
            location="Irland (EU)"
            link="https://stripe.com/de/privacy"
          />
          <Provider
            name="1&1 IONOS SE"
            purpose="E-Mail-Versand (Buchungsbestätigung, Mietvertrag, Kurtaxe-Hinweis, Manager-Korrespondenz)"
            location="Deutschland"
            link="https://www.ionos.de/terms-gtc/datenschutzerklaerung/"
          />
          <Provider
            name="Vercel Blob (Vercel Inc.)"
            purpose="Speicherung hochgeladener Bilder (Blog, Cover-Bilder)"
            location="Region Frankfurt"
            link="https://vercel.com/legal/privacy-policy"
          />
          <Provider
            name="OpenStreetMap Foundation"
            purpose={`Anzeige der Karte auf /lage. Wird erst geladen nachdem Du der Kategorie "Komfort & Einbettungen" zugestimmt hast.`}
            location="UK / Niederlande (Server)"
            link="https://wiki.openstreetmap.org/wiki/Privacy_Policy"
          />
        </Block>

        <Block title="5. Cookies & vergleichbare Technologien">
          <h3>5.1 Notwendige Cookies (immer aktiv)</h3>
          <ul>
            <li>
              <strong>next-auth.session-token</strong> — Authentifizierung des Manager-Logins (HTTPOnly,
              Secure, 30 Tage)
            </li>
            <li>
              <strong>__Host-csrf</strong> — Schutz gegen Cross-Site Request Forgery (Sitzungsdauer)
            </li>
            <li>
              <strong>wh_cookie_consent</strong> — Speichert Deine Cookie-Einstellungen lokal
              (LocalStorage, 12 Monate)
            </li>
          </ul>

          <h3>5.2 Optionale Cookies & Einbettungen</h3>
          <ul>
            <li>
              <strong>Komfort & Einbettungen:</strong> aktiviert die OpenStreetMap-Karte und (in
              Blog-Beiträgen) ggf. YouTube-/Vimeo-Embeds. Diese Drittanbieter setzen ihrerseits Cookies.
            </li>
            <li>
              <strong>Statistik:</strong> Reservierung für zukünftige privacy-freundliche Tools wie
              Plausible Analytics — derzeit nicht aktiv.
            </li>
            <li>
              <strong>Marketing:</strong> aktuell nicht aktiv und nicht geplant.
            </li>
          </ul>

          <p>
            <strong>Rechtsgrundlage:</strong> für notwendige Cookies § 25 Abs. 2 Nr. 2 TTDSG bzw. Art.
            6 Abs. 1 lit. b DSGVO; für optionale Cookies Deine Einwilligung gem. § 25 Abs. 1 TTDSG +
            Art. 6 Abs. 1 lit. a DSGVO. Du kannst Deine Einwilligung jederzeit über den Link „Cookie-
            Einstellungen" im Footer widerrufen.
          </p>
        </Block>

        <Block title="6. Deine Rechte">
          <p>Du hast nach DSGVO folgende Rechte gegenüber uns:</p>
          <ul>
            <li>
              <strong>Auskunftsrecht</strong> (Art. 15 DSGVO) — wir erteilen Auskunft über die zu
              Deiner Person gespeicherten Daten.
            </li>
            <li>
              <strong>Berichtigungsrecht</strong> (Art. 16 DSGVO).
            </li>
            <li>
              <strong>Recht auf Löschung</strong> (Art. 17 DSGVO) — soweit keine gesetzliche
              Aufbewahrungspflicht entgegensteht.
            </li>
            <li>
              <strong>Recht auf Einschränkung</strong> (Art. 18 DSGVO).
            </li>
            <li>
              <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO).
            </li>
            <li>
              <strong>Widerspruchsrecht</strong> (Art. 21 DSGVO) — gegen Verarbeitung auf Basis
              berechtigter Interessen.
            </li>
            <li>
              <strong>Widerruf der Einwilligung</strong> (Art. 7 Abs. 3 DSGVO) — jederzeit mit
              Wirkung für die Zukunft.
            </li>
            <li>
              <strong>Beschwerderecht</strong> bei einer Aufsichtsbehörde (Art. 77 DSGVO). In NRW:
              Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen,
              Kavalleriestraße 2-4, 40213 Düsseldorf.
            </li>
          </ul>
          <p>
            Anfragen richtest Du bitte formlos an{" "}
            <a href="mailto:info@skifreunde-gt.de">info@skifreunde-gt.de</a>.
          </p>
        </Block>

        <Block title="7. Datensicherheit">
          <p>
            Wir verwenden TLS/SSL-Verschlüsselung (HTTPS) für die gesamte Kommunikation. Passwörter
            werden ausschließlich als bcrypt-Hash gespeichert — Klartext-Passwörter liegen uns
            nirgendwo vor. Datenbank- und Datei-Backups werden verschlüsselt gespeichert.
          </p>
        </Block>

        <Block title="8. Datenübermittlung in Drittländer">
          <p>
            Eine Übermittlung Deiner Daten in Drittländer außerhalb der EU/des EWR findet nicht
            statt, mit folgender Ausnahme: Stripe verarbeitet zur Betrugserkennung Daten teilweise
            in den USA. Hierfür liegen Standardvertragsklauseln gem. Art. 46 DSGVO vor.
          </p>
        </Block>

        <Block title="9. Änderungen dieser Datenschutzerklärung">
          <p>
            Wir passen diese Datenschutzerklärung an, sobald sich Änderungen an der
            Datenverarbeitung ergeben. Die jeweils aktuelle Version findest Du auf dieser Seite mit
            entsprechendem Stand-Datum.
          </p>
        </Block>
      </div>
    </div>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-12">
    <h2 className="text-[28px] sm:text-[32px] mb-4">{title}</h2>
    <div className="space-y-3 text-[var(--color-wh-black)] leading-relaxed [&>ul]:list-disc [&>ul]:list-inside [&>ul]:marker:text-[var(--color-wh-green)] [&>ul]:space-y-1.5 [&>h3]:text-[20px] [&>h3]:mt-6 [&>h3]:mb-2">
      {children}
    </div>
  </section>
);

const Address = () => (
  <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-md)] p-4 my-3">
    <strong>Skifreunde Gütersloh e.V.</strong>
    <br />
    Postfach 2819
    <br />
    33258 Gütersloh
    <br />
    E-Mail: <a href="mailto:info@skifreunde-gt.de">info@skifreunde-gt.de</a>
    <br />
    <br />
    <em className="text-[var(--color-wh-fg-muted)]">
      Vertretungsberechtigter Vorstand: [BITTE ERGÄNZEN: Vorstandsvorsitzender / Geschäftsführer mit
      vollständigem Namen]
    </em>
  </div>
);

const Provider = ({
  name,
  purpose,
  location,
  link,
}: {
  name: string;
  purpose: string;
  location: string;
  link: string;
}) => (
  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] p-4 my-3">
    <div className="font-semibold text-[var(--color-wh-deep-green)]">{name}</div>
    <div className="text-sm text-[var(--color-wh-fg-muted)] mt-1">
      <div>
        <strong>Zweck:</strong> {purpose}
      </div>
      <div>
        <strong>Sitz / Server:</strong> {location}
      </div>
      <div className="mt-1">
        <a href={link} target="_blank" rel="noreferrer">
          Datenschutzerklärung des Anbieters ↗
        </a>
      </div>
    </div>
  </div>
);
