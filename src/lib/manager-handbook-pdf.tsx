/**
 * Manager-Handbuch als PDF — generiert via @react-pdf/renderer.
 *
 * Stylisierte Schirm-Mockups statt echter Screenshots: dadurch bleibt das
 * Handbuch versionsfest auch wenn UI-Details sich aendern, und Klick-Pfade
 * sind text-basiert nachvollziehbar.
 */

import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";

const C = {
  green: "#2F4A35",
  greenLight: "#EFE6D8",
  textBlack: "#111111",
  textMuted: "#5b5b56",
  border: "#C8CEC4",
  white: "#ffffff",
  amber: "#fbbf24",
  amberBg: "#fef3c7",
  red: "#dc2626",
  redBg: "#fee2e2",
  emerald: "#059669",
  emeraldBg: "#d1fae5",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontSize: 10,
    color: C.textBlack,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  cover: {
    paddingTop: 180,
    paddingHorizontal: 60,
    backgroundColor: C.green,
    color: C.white,
    height: "100%",
  },
  coverEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.greenLight,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.1,
    marginBottom: 14,
  },
  coverSubtitle: {
    fontSize: 16,
    color: C.greenLight,
    marginBottom: 36,
    lineHeight: 1.4,
  },
  coverFooter: {
    position: "absolute",
    bottom: 50,
    left: 60,
    right: 60,
    fontSize: 10,
    color: C.greenLight,
    borderTopColor: C.greenLight,
    borderTopWidth: 0.5,
    paddingTop: 14,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomColor: C.green,
    borderBottomWidth: 1.5,
  },
  pageHeaderTitle: { fontSize: 9, color: C.green, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1 },
  pageHeaderRight: { fontSize: 8, color: C.textMuted },
  h1: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    marginTop: 4,
    marginBottom: 8,
  },
  h2: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    marginTop: 18,
    marginBottom: 6,
  },
  h3: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.textBlack,
    marginTop: 12,
    marginBottom: 4,
  },
  p: { marginBottom: 6, fontSize: 10, lineHeight: 1.55 },
  pMuted: { marginBottom: 6, fontSize: 9, color: C.textMuted, lineHeight: 1.5 },
  bullet: { flexDirection: "row", marginBottom: 3, fontSize: 10 },
  bulletDot: { width: 12, color: C.green, fontFamily: "Helvetica-Bold" },
  bulletText: { flex: 1, lineHeight: 1.5 },
  pageFooter: {
    position: "absolute",
    bottom: 28,
    left: 50,
    right: 50,
    fontSize: 8,
    color: C.textMuted,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopColor: C.border,
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  // Mockup
  mockup: {
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 8,
    backgroundColor: "#FAFAF8",
  },
  mockupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.green,
    color: C.white,
    padding: 6,
    marginHorizontal: -8,
    marginTop: -8,
    marginBottom: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  mockupHeaderTitle: { color: C.white, fontSize: 8, fontFamily: "Helvetica-Bold" },
  mockupHeaderRight: { color: C.greenLight, fontSize: 7 },
  mockupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomColor: C.border,
    borderBottomWidth: 0.4,
  },
  mockupCol: { flex: 1 },
  mockupLabel: { fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  mockupValue: { fontSize: 9, color: C.textBlack },
  mockupValueBold: { fontSize: 9, color: C.textBlack, fontFamily: "Helvetica-Bold" },
  // Callouts
  tip: {
    borderLeftColor: C.emerald,
    borderLeftWidth: 3,
    backgroundColor: C.emeraldBg,
    padding: 8,
    marginVertical: 8,
    fontSize: 9,
  },
  warning: {
    borderLeftColor: C.amber,
    borderLeftWidth: 3,
    backgroundColor: C.amberBg,
    padding: 8,
    marginVertical: 8,
    fontSize: 9,
  },
  danger: {
    borderLeftColor: C.red,
    borderLeftWidth: 3,
    backgroundColor: C.redBg,
    padding: 8,
    marginVertical: 8,
    fontSize: 9,
  },
  calloutLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  // Tables
  table: {
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 4,
    marginVertical: 8,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.greenLight,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomColor: C.border,
    borderBottomWidth: 0.4,
  },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green, textTransform: "uppercase", letterSpacing: 0.4 },
  td: { fontSize: 9, color: C.textBlack },
  // Codeblock
  code: {
    fontFamily: "Courier",
    fontSize: 9,
    backgroundColor: "#F5F5F0",
    padding: 6,
    borderRadius: 3,
    marginVertical: 4,
    color: C.green,
  },
  // Sidebar-Layout-Page
  toc: { paddingVertical: 4 },
  tocItem: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomColor: C.border,
    borderBottomWidth: 0.4,
  },
  tocNum: { width: 28, fontFamily: "Courier", fontSize: 9, color: C.green },
  tocTitle: { flex: 1, fontSize: 11, color: C.textBlack },
  tocPage: { fontSize: 9, color: C.textMuted },
});

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={s.bullet}>
    <Text style={s.bulletDot}>·</Text>
    <Text style={s.bulletText}>{children}</Text>
  </View>
);

const Tip = ({ label = "Tipp", children }: { label?: string; children: React.ReactNode }) => (
  <View style={s.tip}>
    <Text style={s.calloutLabel}>{label}</Text>
    <Text>{children}</Text>
  </View>
);
const Warning = ({ children }: { children: React.ReactNode }) => (
  <View style={s.warning}>
    <Text style={s.calloutLabel}>Wichtig</Text>
    <Text>{children}</Text>
  </View>
);
const Danger = ({ children }: { children: React.ReactNode }) => (
  <View style={s.danger}>
    <Text style={s.calloutLabel}>Vorsicht</Text>
    <Text>{children}</Text>
  </View>
);

const PageHeader = ({ section, page }: { section: string; page: number }) => (
  <View style={s.pageHeader} fixed>
    <Text style={s.pageHeaderTitle}>Wiesenhütte · Manager-Handbuch · {section}</Text>
    <Text style={s.pageHeaderRight}>S. {page}</Text>
  </View>
);

const Footer = () => (
  <View style={s.pageFooter} fixed>
    <Text>Wiesenhütte Manager-Handbuch · Skifreunde Gütersloh e.V.</Text>
    <Text
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
  </View>
);

const Mockup = ({
  title,
  rightTop,
  children,
}: {
  title: string;
  rightTop?: string;
  children: React.ReactNode;
}) => (
  <View style={s.mockup} wrap={false}>
    <View style={s.mockupHeader}>
      <Text style={s.mockupHeaderTitle}>🏔  Wiesenhütte · {title}</Text>
      {rightTop && <Text style={s.mockupHeaderRight}>{rightTop}</Text>}
    </View>
    {children}
  </View>
);

export type HandbookProps = {
  baseUrl: string;
  generatedAt: string;
};

export function ManagerHandbook({ baseUrl, generatedAt }: HandbookProps) {
  return (
    <Document
      title="Wiesenhütte Manager-Handbuch"
      author="Skifreunde Gütersloh e.V."
      subject="Bedienungsanleitung Manager-Backend"
    >
      {/* === COVER === */}
      <Page size="A4" style={s.cover}>
        <Text style={s.coverEyebrow}>Wiesenhütte · Manager-Backend</Text>
        <Text style={s.coverTitle}>Manager-{"\n"}Handbuch</Text>
        <Text style={s.coverSubtitle}>
          Bedienungsanleitung für Buchungsmanagerinnen und Buchungsmanager —
          Buchungen, Zahlungen, Übergabeprotokolle, Mitgliedschaften, Mails.
        </Text>
        <View style={s.coverFooter}>
          <Text style={{ marginBottom: 4 }}>
            Skifreunde Gütersloh e.V. · Wiesenhütte 1, 59955 Winterberg-Langewiese
          </Text>
          <Text>
            {baseUrl} · Stand: {generatedAt}
          </Text>
        </View>
      </Page>

      {/* === TOC === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="Inhalt" page={2} />
        <Text style={s.h1}>Inhaltsverzeichnis</Text>
        <View style={s.toc}>
          <TocRow num="01" title="Einstieg & Login (mit 2FA)" page="3" />
          <TocRow num="02" title="Dashboard — Tagesansicht" page="4" />
          <TocRow num="03" title="Buchungen verwalten" page="5" />
          <TocRow num="04" title="Manuelle Buchung anlegen" page="7" />
          <TocRow num="05" title="Kalender & Sperrzeiten" page="8" />
          <TocRow num="06" title="Mitgliedschafts-Verifizierung" page="9" />
          <TocRow num="07" title="Stammdaten — Saisons, Tarife, Extras" page="10" />
          <TocRow num="08" title="Mail-Templates — Editor + Versionen" page="12" />
          <TocRow num="09" title="Übergabeprotokoll (Tablet-First)" page="14" />
          <TocRow num="10" title="Zahlungen, Stripe & Rechnungen" page="16" />
          <TocRow num="11" title="Lifecycle-Mails (T-14 / T-7 / T-1 / T+5)" page="18" />
          <TocRow num="12" title="Audit-Log & DSGVO" page="19" />
          <TocRow num="13" title="FAQ & Troubleshooting" page="20" />
        </View>
        <Footer />
      </Page>

      {/* === 01 LOGIN === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="01 · Einstieg & Login" page={3} />
        <Text style={s.h1}>Einstieg & Login</Text>
        <Text style={s.p}>
          Das Manager-Backend ist erreichbar unter:
        </Text>
        <Text style={s.code}>{baseUrl}/m/login</Text>

        <Text style={s.h2}>Login mit Passwort + optional 2FA</Text>
        <Bullet>E-Mail und Passwort eingeben</Bullet>
        <Bullet>
          Wenn 2FA aktiviert ist: zusätzlich 6-stelligen TOTP-Code aus der
          Authenticator-App eintragen (Google Authenticator, Authy, 1Password)
        </Bullet>
        <Bullet>
          Backup-Codes: Eine Mitgliedsstufe hat 10 einmalige Backup-Codes für den
          Notfall — bei Verlust des Telefons im Profil neu generieren lassen
        </Bullet>

        <Mockup title="Login" rightTop="Manager">
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>E-Mail</Text>
            <Text style={s.mockupValue}>jonathan@stg-medien.com</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Passwort</Text>
            <Text style={s.mockupValue}>••••••••••</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>2FA-Code</Text>
            <Text style={s.mockupValue}>123 456</Text>
          </View>
        </Mockup>

        <Text style={s.h2}>2FA aktivieren (empfohlen für Admins, Pflicht beim ersten Setup)</Text>
        <Bullet>Im Manager-Backend: Klick auf den Profil-Avatar (Sidebar links unten)</Bullet>
        <Bullet>Tab „Zwei-Faktor-Authentifizierung"</Bullet>
        <Bullet>QR-Code mit Authenticator-App scannen</Bullet>
        <Bullet>6-stelligen Code zur Bestätigung eingeben</Bullet>
        <Bullet>Backup-Codes <Text style={{ fontFamily: "Helvetica-Bold" }}>vor dem Schließen herunterladen</Text></Bullet>

        <Warning>
          Beim ersten Login mit einem vom Admin angelegten Account oder nach
          Passwort-Reset wirst Du automatisch auf das Profil umgeleitet und musst
          ein neues Passwort setzen, bevor Du irgendwo anders hin kommst.
        </Warning>

        <Tip label="Kennwort vergessen">
          Auf der Login-Seite den Tab „Per E-Mail-Link" wählen, E-Mail
          eingeben — Du erhältst einen Magic-Link zum Login. Im Profil kannst Du
          dann ein neues Passwort setzen.
        </Tip>

        <Footer />
      </Page>

      {/* === 02 DASHBOARD === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="02 · Dashboard" page={4} />
        <Text style={s.h1}>Dashboard — Tagesansicht</Text>
        <Text style={s.p}>
          Die Startseite nach dem Login (<Text style={s.code}>/m/dashboard</Text>) zeigt alle
          Echt­zeit-Kennzahlen und das, was gerade Aufmerksamkeit braucht.
        </Text>

        <Mockup title="Dashboard" rightTop="Heute · 06.05.2026">
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Anreisen heute / nächste 7 Tage</Text>
            <Text style={s.mockupValueBold}>2 / 5</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Abreisen heute / morgen</Text>
            <Text style={s.mockupValueBold}>1 / 3</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Offene Zahlungen (Restzahlung fällig)</Text>
            <Text style={s.mockupValueBold}>3</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Offene Anfragen (noch nicht beantwortet)</Text>
            <Text style={s.mockupValueBold}>4</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Letzte Aktivität (Activity-Log)</Text>
            <Text style={s.mockupValue}>… letzte 30 Tage</Text>
          </View>
        </Mockup>

        <Text style={s.h2}>Was gehört wo hin?</Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Anreisen / Abreisen:</Text> direkt
          klickbar — führt zur Buchungs-Detailseite mit Übergabeprotokoll-Buttons.
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Offene Zahlungen:</Text> Buchungen
          mit ausstehender Restzahlung. Bei T-7 versucht das System automatisch eine Off-Session-Abbuchung.
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Offene Anfragen:</Text> über das
          Buchen-Formular eingegangene, noch nicht in Buchungen umgewandelte Anfragen.
        </Bullet>

        <Tip>
          Der Sidebar-Eintrag „Mitgliedschaften" zeigt eine Zahl, falls Anträge
          zur Verifizierung anstehen — bitte regelmäßig durchklicken.
        </Tip>

        <Footer />
      </Page>

      {/* === 03 BUCHUNGEN === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="03 · Buchungen" page={5} />
        <Text style={s.h1}>Buchungen verwalten</Text>

        <Text style={s.h2}>Liste · {"`"}/m/buchungen{"`"}</Text>
        <Text style={s.p}>
          Tabellarische Übersicht aller Buchungen mit Filter-Bar (Status, Zeitraum,
          Suche nach Buchungsnr. oder Kundenname). Klick auf Zeile öffnet das Detail.
        </Text>

        <Text style={s.h2}>Detail-Seite · {"`"}/m/buchungen/[id]{"`"}</Text>
        <Mockup title="Buchung WH-2026-1042" rightTop="bezahlt">
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Kunde</Text>
            <Text style={s.mockupValue}>Maren Holtkamp · Mitglied ✓</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Anreise / Abreise</Text>
            <Text style={s.mockupValue}>Fr 06.02. → Mo 09.02.2026 (3 Nächte)</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Belegung</Text>
            <Text style={s.mockupValue}>12 Personen (4 Mitglieder, 6 Kinder, 2 Erw.)</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Preis (Subtotal / Bezahlt / Offen)</Text>
            <Text style={s.mockupValue}>1.420,00 € / 710,00 € / 710,00 €</Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupLabel}>Aktionen</Text>
            <Text style={s.mockupValue}>
              ▸ Mail an Bucher  ▸ Anreise-Übergabe  ▸ Abreise-Übernahme
            </Text>
          </View>
        </Mockup>

        <Text style={s.h2}>Status-Workflow</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "22%" }]}>Status</Text>
            <Text style={[s.th, { width: "78%" }]}>Bedeutung / wann automatisch / wann manuell</Text>
          </View>
          {[
            ["angefragt", "Buchung angelegt, aber Anzahlung noch nicht eingegangen. Geht automatisch auf 'bezahlt' bei Stripe-Webhook."],
            ["bestaetigt", "Manueller Status, falls eine Buchung extern (z.B. Telefon) angelegt wurde."],
            ["bezahlt", "Anzahlung erhalten — Bestätigungs-, Mietvertrags-, Kurtaxe-Mails sind raus."],
            ["angereist", "Beim Check-in im Übergabeprotokoll auf 'angereist' setzen."],
            ["abgereist", "Beim Check-out auf 'abgereist'. Triggert Loyalty-Code (ab 3. Aufenthalt) + Bewertungsanfrage T+5."],
            ["storniert", "Selbst-Storno via Kundenkonto oder durch Manager. Storno-Gebühr nach Tier."],
            ["wartung", "Interne Sperrzeit für Renovierung, Heizungs-Service etc."],
          ].map(([status, desc]) => (
            <View style={s.tableRow} key={status}>
              <Text style={[s.td, { width: "22%", fontFamily: "Helvetica-Bold", color: C.green }]}>
                {status}
              </Text>
              <Text style={[s.td, { width: "78%" }]}>{desc}</Text>
            </View>
          ))}
        </View>

        <Footer />
      </Page>

      {/* === 03 BUCHUNGEN — Manager-Mail === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="03 · Buchungen" page={6} />
        <Text style={s.h2}>Mail an Bucher senden</Text>
        <Text style={s.p}>
          Auf der Buchungs-Detail-Seite klick auf <Text style={{ fontFamily: "Helvetica-Bold" }}>„Mail an Bucher senden"</Text>.
          Dann öffnet sich eine Maske mit:
        </Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Vorlage einsetzen</Text> — Dropdown mit allen aktivierten Mail-Templates;
          beim Auswählen werden Subject + Body automatisch mit den Buchungs-Daten gefüllt.
          Du kannst danach weiter editieren bevor Du sendest.
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Subject + Body</Text> — frei
          formuliert oder aus Vorlage übernommen. Markdown ist erlaubt: <Text style={s.code}>**fett**</Text>,{" "}
          <Text style={s.code}>*kursiv*</Text>, <Text style={s.code}>- Listen</Text>.
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Zahlungslink dazu erzeugen</Text> —
          Checkbox aktivieren, Betrag + Zweck eingeben. Erstellt eine Stripe-Checkout-URL,
          die in die Mail eingefügt wird. Nutzbar für Schadensersatz, Zusatzleistungen etc.
        </Bullet>

        <Tip>
          Die Mail wird per IONOS-SMTP unter <Text style={s.code}>hello@wiesenhütte.com</Text> versendet,
          mit Reply-To auf Deine eigene Manager-Mail-Adresse — Antworten landen direkt bei Dir.
        </Tip>

        <Text style={s.h2}>Übergabeprotokoll</Text>
        <Text style={s.p}>
          Zwei Buttons: „📋 Anreise-Übergabe" und „📋 Abreise-Übernahme" — siehe Abschnitt 09.
          Funktioniert auf Tablet und Smartphone (Touch-optimiert, mit Foto-Upload und Unterschrift).
        </Text>

        <Text style={s.h2}>Sonstige Aktionen auf der Detail-Seite</Text>
        <Bullet>Status manuell ändern via Dropdown oben rechts</Bullet>
        <Bullet>Kautions-Hold setzen (verhindert automatische Erstattung bei Schaden)</Bullet>
        <Bullet>Notizen anlegen (intern, nicht für Kunden sichtbar)</Bullet>
        <Bullet>PDF-Rechnung herunterladen (sobald Anzahlung erhalten)</Bullet>

        <Footer />
      </Page>

      {/* === 04 MANUELLE BUCHUNG === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="04 · Manuelle Buchung" page={7} />
        <Text style={s.h1}>Manuelle Buchung anlegen</Text>
        <Text style={s.p}>
          Pfad: <Text style={s.code}>/m/manuell</Text> · Sidebar-Eintrag „Manuelle Buchung".
        </Text>
        <Text style={s.p}>
          Verwende diese Maske, wenn jemand telefonisch oder per Mail eine Buchung
          anfragt und nicht selbst online bucht. Vorgehen:
        </Text>
        <Bullet>1. Datum (Anreise + Abreise) auswählen — Belegung wird live geprüft</Bullet>
        <Bullet>2. Personen-Anzahl je Kategorie eintragen</Bullet>
        <Bullet>3. Kunden-Daten ergänzen (oder bestehenden Kunden via Email finden)</Bullet>
        <Bullet>4. Anlass + ggf. Manager-Notizen eintragen</Bullet>
        <Bullet>5. „Anlegen" — Buchung wird mit Status <Text style={s.code}>angefragt</Text> erstellt</Bullet>

        <Tip>
          Manuelle Buchungen erzeugen <Text style={{ fontFamily: "Helvetica-Bold" }}>keinen
          Stripe-Checkout</Text> — sie sind reine DB-Einträge. Wenn der Kunde
          später bezahlen soll, schicke ihm aus dem Buchungs-Detail eine Mail mit Zahlungslink.
        </Tip>

        <Warning>
          Mitglieds-Tarife (7,50 €/Nacht) lassen sich auch manuell nur eintragen,
          wenn der Customer als verifiziertes Mitglied im System hinterlegt ist —
          sonst zählt er als Nichtmitglied.
        </Warning>
        <Footer />
      </Page>

      {/* === 05 KALENDER + SPERRZEITEN === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="05 · Kalender & Sperrzeiten" page={8} />
        <Text style={s.h1}>Kalender & Sperrzeiten</Text>

        <Text style={s.h2}>Kalender · {"`"}/m/kalender{"`"}</Text>
        <Text style={s.p}>
          Visuelle Belegungs-Übersicht. Buchungen werden farbig dargestellt:
        </Text>
        <Bullet>
          <Text style={{ color: C.green, fontFamily: "Helvetica-Bold" }}>Grün</Text> — bestätigte/bezahlte Buchung
        </Bullet>
        <Bullet>
          <Text style={{ color: C.amber, fontFamily: "Helvetica-Bold" }}>Gelb</Text> — angefragte Buchung
        </Bullet>
        <Bullet>
          <Text style={{ color: "#888", fontFamily: "Helvetica-Bold" }}>Grau gestreift</Text> — Reinigungs-Pufferzeit nach Abreise
        </Bullet>
        <Bullet>
          <Text style={{ color: C.red, fontFamily: "Helvetica-Bold" }}>Rot</Text> — Wartungs-Sperrzeit
        </Bullet>

        <Text style={s.h2}>Sperrzeiten · {"`"}/m/sperrzeiten{"`"}</Text>
        <Text style={s.p}>
          Sperrt die Hütte für externe Buchungen während Renovierung, Heizungs-Service,
          Vereinsfeiern etc.
        </Text>
        <Bullet>Datum-Range auswählen, Anlass eintragen, „Sperren"</Bullet>
        <Bullet>Sperrzeit erscheint im öffentlichen Kalender als „nicht buchbar"</Bullet>
        <Bullet>Kann jederzeit gelöscht werden, falls sich der Termin ändert</Bullet>

        <Tip label="Reinigungs-Pufferzeit konfigurieren">
          Die automatische Sperre nach jeder Abreise ist konfigurierbar in{" "}
          <Text style={s.code}>/m/einstellungen</Text> → „Reinigung &amp; Pufferzeit".
          Default: 1 Tag. Kann auf 0–7 Tage gesetzt werden.
        </Tip>
        <Footer />
      </Page>

      {/* === 06 MITGLIEDSCHAFTEN === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="06 · Mitgliedschaften" page={9} />
        <Text style={s.h1}>Mitgliedschafts-Verifizierung</Text>
        <Text style={s.p}>
          Pfad: <Text style={s.code}>/m/mitgliedschaften</Text>. Hier verifizierst Du
          die von Kunden beantragten Vereinsmitgliedschaften.
        </Text>

        <Text style={s.h2}>Workflow</Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Schritt 1 — Antrag eingeht:</Text> Kunde
          füllt im eigenen Konto-Profil das Formular aus, klickt „Mitgliedschaft beantragen".
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Schritt 2 — Mail-Benachrichtigung:</Text> Du
          erhältst automatisch eine Mail an <Text style={s.code}>hello@wiesenhütte.com</Text> mit
          Antragsteller-Daten, optionaler Mitgliedsnummer und Notiz.
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Schritt 3 — Prüfung:</Text> Im Manager-Backend
          unter „Mitgliedschaften" siehst Du alle offenen Anträge. Vergleich mit dem
          Vereinsverzeichnis.
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Schritt 4a — Bestätigen:</Text> Mitgliedsnummer
          eintragen (oder vom Antrag übernehmen) und „✓ Bestätigen" klicken. Customer-Status
          wechselt auf <Text style={s.code}>verified</Text>; ab sofort ist der Mitglieds-Tarif
          (7,50 €/Nacht) für ihn freigeschaltet.
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Schritt 4b — Ablehnen:</Text> Grund
          eintragen, „Ablehnen" klicken. Customer-Status auf <Text style={s.code}>rejected</Text>.
          Kunde kann erneut beantragen.
        </Bullet>

        <Mockup title="Mitgliedschaften" rightTop="3 offene Verifizierungen">
          <View style={s.mockupRow}>
            <Text style={[s.mockupValue, { flex: 2 }]}>
              Maren Holtkamp · maren@example.com
            </Text>
            <Text style={[s.mockupValue, { flex: 1, textAlign: "right" }]}>
              Mitgl.-Nr. 0421 · Beantragt am 04.05.2026
            </Text>
          </View>
          <View style={s.mockupRow}>
            <Text style={s.mockupValue}>[ Mitgliedsnr ____ ]  ✓ Bestätigen   |   [ Grund ____ ]  Ablehnen</Text>
          </View>
        </Mockup>

        <Tip>
          Bei jeder Bestätigung/Ablehnung gehen automatisch zwei Mails raus: an den
          Antragsteller (Status-Update) und intern (für Audit-Spur). Beide werden im
          Activity-Log erfasst.
        </Tip>
        <Footer />
      </Page>

      {/* === 07 STAMMDATEN === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="07 · Stammdaten" page={10} />
        <Text style={s.h1}>Stammdaten — Saisons, Tarife, Extras</Text>
        <Text style={s.p}>
          Pfad: <Text style={s.code}>/m/stammdaten</Text>. Diese Seite ist die
          Single-Source-of-Truth für die Pricing-Engine.
        </Text>

        <Text style={s.h2}>Saisons</Text>
        <Text style={s.p}>
          Zeitliche Tarif-Perioden. Bei jeder Buchung wird je nach Anreisedatum die
          aktive Saison bestimmt; höhere Priorität gewinnt bei Überschneidungen.
        </Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Format MM-DD:</Text> z.B. 12-15 → 03-15
          (Jahreswechsel funktioniert: Saison gilt 15.12. bis 15.03.)
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Priorität 0-100:</Text> bei zwei sich
          überschneidenden Saisons gewinnt die mit der höchsten Zahl
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Aktiv-Toggle:</Text> Saison ist nur
          wirksam, wenn Häkchen gesetzt
        </Bullet>

        <Text style={s.h2}>Tarife</Text>
        <Text style={s.p}>
          Pro Personenkategorie ein Tarif mit Preis pro Nacht. Optional an eine Saison
          gebunden — wenn ja, gilt der Tarif nur in dieser Saison; ansonsten ganzjährig.
        </Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "30%" }]}>Kategorie</Text>
            <Text style={[s.th, { width: "30%" }]}>Default-Preis / Nacht</Text>
            <Text style={[s.th, { width: "40%" }]}>Wann angewendet</Text>
          </View>
          {[
            ["mitglied", "7,50 €", "Verifizierte Vereinsmitglieder"],
            ["nichtmitglied", "18,00 €", "Erwachsene ohne Mitgliedschaft"],
            ["kind", "10,00 €", "4-15 Jahre"],
            ["schueler", "7,50 €", "Schulgruppen"],
            ["lehrer", "18,00 €", "Lehrkräfte (= Nichtmitglieder)"],
          ].map(([cat, price, when]) => (
            <View style={s.tableRow} key={cat}>
              <Text style={[s.td, { width: "30%", fontFamily: "Helvetica-Bold" }]}>
                {cat}
              </Text>
              <Text style={[s.td, { width: "30%" }]}>{price}</Text>
              <Text style={[s.td, { width: "40%" }]}>{when}</Text>
            </View>
          ))}
        </View>

        <Tip>
          Tarif-Änderungen wirken sich nur auf <Text style={{ fontFamily: "Helvetica-Bold" }}>neue
          Buchungen</Text> aus — bestehende behalten ihren Snapshot-Preis. Jede
          Änderung landet im Audit-Log.
        </Tip>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <PageHeader section="07 · Stammdaten" page={11} />
        <Text style={s.h2}>Extras</Text>
        <Text style={s.p}>
          Optionale Zusatzleistungen, die Kunden beim Buchen wählen können. Manager kann
          sie aktivieren / deaktivieren / Preise anpassen.
        </Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Code:</Text> technischer Schlüssel (z.B.{" "}
          <Text style={s.code}>holz_buendel</Text>)
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Label + Beschreibung:</Text> was Kunde
          sieht
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Preis-Multiplikatoren:</Text> per
          Nacht oder per Person aktivierbar
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Sortier-Reihenfolge:</Text> bestimmt
          die Anzeige im Buchen-Formular
        </Bullet>

        <Text style={s.h2}>Vor-konfigurierte Extras</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "35%" }]}>Code · Label</Text>
            <Text style={[s.th, { width: "20%" }]}>Preis</Text>
            <Text style={[s.th, { width: "45%" }]}>Default-Status</Text>
          </View>
          {[
            ["holz_buendel · Brennholz", "8,00 €", "✓ aktiv"],
            ["handtuchset · Handtuch-Set", "6,00 €/Person", "✓ aktiv"],
            ["bettwaesche · Bettwäsche-Set", "12,00 €/Person", "✓ aktiv"],
            ["fruehstueck_paket · Frühstücks-Starterpaket", "65,00 €", "deaktiviert"],
            ["skiservice_termin · Skiservice-Termin", "kostenlos", "deaktiviert"],
          ].map(([cl, p, st]) => (
            <View style={s.tableRow} key={cl}>
              <Text style={[s.td, { width: "35%" }]}>{cl}</Text>
              <Text style={[s.td, { width: "20%" }]}>{p}</Text>
              <Text style={[s.td, { width: "45%" }]}>{st}</Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* === 08 MAIL-TEMPLATES === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="08 · Mail-Templates" page={12} />
        <Text style={s.h1}>Mail-Templates — Editor mit Versionen</Text>
        <Text style={s.p}>
          Pfad: <Text style={s.code}>/m/mail-templates</Text>. Versionierte Vorlagen mit
          Markdown-Body, Drag-and-Drop-Variablen und Live-Preview.
        </Text>

        <Text style={s.h2}>Aufbau des Editors</Text>
        <Mockup title="Mail-Editor · 3-Spalten" rightTop="Editor / Diff">
          <View style={s.mockupRow}>
            <View style={[s.mockupCol, { flex: 1 }]}>
              <Text style={s.mockupLabel}>Linke Spalte</Text>
              <Text style={s.mockupValue}>Variablen-Palette (gruppiert)</Text>
              <Text style={s.mockupValue}>Format-Toolbar (H1/H2/Bold/…)</Text>
            </View>
            <View style={[s.mockupCol, { flex: 1 }]}>
              <Text style={s.mockupLabel}>Mitte</Text>
              <Text style={s.mockupValue}>Subject-Feld</Text>
              <Text style={s.mockupValue}>Body (Markdown)</Text>
              <Text style={s.mockupValue}>Änderungs-Notiz</Text>
            </View>
            <View style={[s.mockupCol, { flex: 1 }]}>
              <Text style={s.mockupLabel}>Rechte Spalte</Text>
              <Text style={s.mockupValue}>Live-Preview (iframe)</Text>
              <Text style={s.mockupValue}>Toggle: Mit Beispielwerten / Roh</Text>
            </View>
          </View>
        </Mockup>

        <Text style={s.h2}>Variablen einsetzen</Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Drag-and-Drop:</Text> Variablen-Pille aus
          der Palette ins Subject- oder Body-Feld ziehen → an exakter Drop-Position eingefügt
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Klick:</Text> auf eine Pille → fügt am
          Cursor (oder Ende) ein, je nachdem welches Feld zuletzt fokussiert war
        </Bullet>
        <Bullet>
          Hover über die Pille zeigt Beschreibung und Beispielwert
        </Bullet>

        <Text style={s.h2}>Verfügbare Variablen</Text>
        <Text style={s.p}>
          21 Standard-Variablen in 4 Gruppen — werden zur Sendezeit aus der Buchung gefüllt.
        </Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "20%" }]}>Gruppe</Text>
            <Text style={[s.th, { width: "80%" }]}>Variablen</Text>
          </View>
          {[
            ["Kunde", "{{firstName}}, {{lastName}}, {{guestName}}, {{email}}, {{phone}}, {{salutation}}"],
            ["Buchung", "{{bookingNumber}}, {{arrival}}, {{departure}}, {{arrivalShort}}, {{departureShort}}, {{nights}}, {{persons}}, {{purpose}}, {{bookingUrl}}"],
            ["Zahlung", "{{totalAmount}}, {{paidAmount}}, {{remainderAmount}}, {{depositAmount}}, {{invoiceNumber}}"],
            ["Sonstiges", "{{today}}, {{baseUrl}}"],
          ].map(([grp, list]) => (
            <View style={s.tableRow} key={grp}>
              <Text style={[s.td, { width: "20%", fontFamily: "Helvetica-Bold", color: C.green }]}>
                {grp}
              </Text>
              <Text style={[s.td, { width: "80%", fontFamily: "Courier", fontSize: 8 }]}>
                {list}
              </Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <PageHeader section="08 · Mail-Templates" page={13} />
        <Text style={s.h2}>Versionierung</Text>
        <Bullet>Jeder Klick auf „Neue Version speichern" erzeugt eine neue Version (1, 2, 3, …)</Bullet>
        <Bullet>Alte Versionen bleiben im Versions-Verlauf erhalten</Bullet>
        <Bullet>„Diff vs. letzte Version"-Tab zeigt zeilenweise Änderungen (grün/rot)</Bullet>
        <Bullet>
          Beliebige Version kann jederzeit zurück-aktiviert werden (Rollback) via „Als aktiv setzen"
        </Bullet>
        <Bullet>Pro Speicherung: optionale Änderungs-Notiz für die Audit-Spur</Bullet>

        <Text style={s.h2}>Vorlagen im Buchungs-Mail-Versand</Text>
        <Text style={s.p}>
          Auf der Buchungs-Detail-Seite, im „Mail an Bucher senden"-Block, gibt's einen
          Dropdown <Text style={{ fontFamily: "Helvetica-Bold" }}>„Vorlage einsetzen"</Text>.
          Beim Auswählen werden Subject und Body automatisch mit den Buchungs-Variablen
          gefüllt — Du kannst danach noch frei editieren bevor Du sendest.
        </Text>

        <Text style={s.h2}>Markdown-Syntax</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "30%" }]}>Was</Text>
            <Text style={[s.th, { width: "70%" }]}>Markdown</Text>
          </View>
          {[
            ["Heading", "# Titel    ## Untertitel    ### klein"],
            ["Bold / Italic", "**fett**   *kursiv*"],
            ["Liste", "- Punkt 1\\n- Punkt 2"],
            ["Link", "[Text](https://...)"],
            ["Zitat", "> abgesetzter Block"],
            ["Inline-Code", "`monospace`"],
          ].map(([w, md]) => (
            <View style={s.tableRow} key={w}>
              <Text style={[s.td, { width: "30%" }]}>{w}</Text>
              <Text style={[s.td, { width: "70%", fontFamily: "Courier", fontSize: 9 }]}>{md}</Text>
            </View>
          ))}
        </View>

        <Tip>
          Keyboard-Shortcuts im Editor: <Text style={s.code}>⌘B</Text> Bold,{" "}
          <Text style={s.code}>⌘I</Text> Italic, <Text style={s.code}>⌘K</Text> Link.
        </Tip>

        <Text style={s.h2}>Templates löschen</Text>
        <Text style={s.p}>
          In der Liste pro Zeile gibt's einen „Löschen"-Link mit Sicherheits-Dialog.
          Cascading: alle Versionen des Templates werden mitgelöscht.{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Versendete Mails bleiben im email_log
          erhalten</Text> — Du verlierst keine Audit-Daten.
        </Text>
        <Footer />
      </Page>

      {/* === 09 ÜBERGABEPROTOKOLL === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="09 · Übergabeprotokoll" page={14} />
        <Text style={s.h1}>Übergabeprotokoll (Tablet-First)</Text>
        <Text style={s.p}>
          Pfad: <Text style={s.code}>/m/buchungen/[id]/uebergabe/checkin</Text> bzw.{" "}
          <Text style={s.code}>/uebergabe/checkout</Text>. Erreichbar über die Buttons
          „📋 Anreise-Übergabe" und „📋 Abreise-Übernahme" auf der Buchungs-Detail-Seite.
        </Text>

        <Text style={s.h2}>Aufbau (von oben nach unten)</Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Sticky-Header:</Text> Buchungsnummer
          + Counter „X/Y Punkte ok"
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Gast-Name:</Text> Vor-/Nachname der
          verantwortlichen Person (vorausgefüllt aus Buchung)
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Checkliste:</Text> 12 Punkte bei
          Anreise / 10 bei Abreise — große Touch-Target-Checkboxen, automatisch öffnendes
          Anmerkungs-Feld bei „nicht ok"
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Foto-Upload:</Text> mehrere Bilder
          gleichzeitig, auf Mobile öffnet die Kamera direkt; Vorschau-Grid mit Lösch-X
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Notiz-Feld:</Text> freie Bemerkung
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Zwei Unterschriften:</Text> Gast und
          Wirt, beide auf dem Tablet/Smartphone signiert
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Sticky Submit-Button:</Text> bestätigt
          + speichert das Protokoll
        </Bullet>

        <Text style={s.h2}>Anreise-Checkliste (12 Punkte)</Text>
        <Bullet>Schlüssel übergeben / Code übermittelt</Bullet>
        <Bullet>Eingangstür funktioniert</Bullet>
        <Bullet>Licht in allen Räumen funktioniert</Bullet>
        <Bullet>Heizung läuft</Bullet>
        <Bullet>Wasser läuft (Küche + Bad)</Bullet>
        <Bullet>Küche sauber & vollständig</Bullet>
        <Bullet>Schlafräume sauber, Matratzen ohne Flecken</Bullet>
        <Bullet>Bad/Toilette sauber</Bullet>
        <Bullet>Brennholz vorhanden</Bullet>
        <Bullet>Müll-Behälter leer</Bullet>
        <Bullet>Feuerlöscher sichtbar &amp; geprüft</Bullet>
        <Bullet>Erste-Hilfe-Set komplett</Bullet>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <PageHeader section="09 · Übergabeprotokoll" page={15} />
        <Text style={s.h2}>Abreise-Checkliste (10 Punkte)</Text>
        <Bullet>Küche besenrein hinterlassen</Bullet>
        <Bullet>Schlafräume aufgeräumt, Bettwäsche abgezogen</Bullet>
        <Bullet>Bad/Toilette gereinigt</Bullet>
        <Bullet>Müll fachgerecht entsorgt</Bullet>
        <Bullet>Alle Fenster geschlossen</Bullet>
        <Bullet>Heizung auf Frostschutz reduziert</Bullet>
        <Bullet>Licht überall aus</Bullet>
        <Bullet>Brennholz nachgelegt</Bullet>
        <Bullet>Schlüssel im Schlüsselsafe zurückgelegt</Bullet>
        <Bullet>Keine sichtbaren Schäden</Bullet>

        <Text style={s.h2}>Was passiert beim Abschließen?</Text>
        <Bullet>Checkliste, Fotos und beide Unterschriften werden in der DB gespeichert</Bullet>
        <Bullet>Fotos und Unterschriften landen in Vercel-Blob (öffentlich abrufbar via URL)</Bullet>
        <Bullet>Activity-Log: „Anreise/Abreise-Übergabe abgeschlossen — X/Y OK, Z Fotos"</Bullet>
        <Bullet>Die Buchungs-Detail-Seite zeigt zukünftig den grünen „bereits dokumentiert"-Block</Bullet>

        <Tip>
          Falls Du nach abgeschlossener Übergabe nochmal eines erfassen möchtest (z.B. weil
          ein Punkt nachgereicht wird): unten gibt's einen{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{`<details>`}</Text>-Toggle „Neues Protokoll
          erfassen". Das alte bleibt erhalten — beide stehen in der History.
        </Tip>

        <Warning>
          Beide Unterschriften sind Pflicht. Ohne Gast- UND Wirts-Signatur kann das
          Protokoll nicht abgeschlossen werden — das ist die rechtliche Anforderung
          an eine Übergabe.
        </Warning>
        <Footer />
      </Page>

      {/* === 10 ZAHLUNGEN === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="10 · Zahlungen" page={16} />
        <Text style={s.h1}>Zahlungen, Stripe & Rechnungen</Text>

        <Text style={s.h2}>Zahlungs-Lifecycle einer Buchung</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "22%" }]}>Phase</Text>
            <Text style={[s.th, { width: "78%" }]}>Was passiert</Text>
          </View>
          {[
            ["Bei Buchung", "Stripe-Checkout für Anzahlung 50% + Kaution 300 € (gleichzeitig). Stripe-Customer wird angelegt, Payment-Method gespeichert für späteren Off-Session-Charge."],
            ["Anzahlung-Webhook", "checkout.session.completed → Booking auf 'bezahlt'. Bestätigungs-, Mietvertrags-, Kurtaxe-Mails werden versendet (idempotent). GoBD-Rechnung wird via Postgres-SEQUENCE erzeugt."],
            ["T-14 vor Anreise", "Cron daily-mail-jobs sendet Zahlungserinnerung mit Hinweis auf den automatischen Einzug bei T-7."],
            ["T-7 vor Anreise", "Cron sendet Anreise-Info-Mail (Anschrift, Anfahrt, Packliste). Versucht Off-Session-Charge der Restzahlung gegen die gespeicherte Karte. Bei Erfolg: Status auf 'erhalten'. Bei Fehler: Mail mit manuellem Zahlungslink."],
            ["T-1 vor Anreise", "Cron sendet Schlüssel-Code-Mail mit dem HUETTE_KEY_SAFE_CODE."],
            ["Bei Abreise", "Manager setzt Status auf 'abgereist' (oder via Übergabeprotokoll). Triggert Loyalty-Code-Vergabe ab 3. Aufenthalt."],
            ["T+5 nach Abreise", "Cron sendet Bewertungsanfrage."],
            ["T+14 nach Abreise", "Cron release-deposits erstattet die 300 € Kaution automatisch via Stripe Refund. Falls Manager 'deposit_hold' gesetzt hat: Skip — Manager refundet manuell."],
          ].map(([phase, what]) => (
            <View style={s.tableRow} key={phase}>
              <Text style={[s.td, { width: "22%", fontFamily: "Helvetica-Bold", color: C.green }]}>
                {phase}
              </Text>
              <Text style={[s.td, { width: "78%" }]}>{what}</Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <PageHeader section="10 · Zahlungen" page={17} />
        <Text style={s.h2}>Webhook-Events, die wir verarbeiten</Text>
        <Bullet>
          <Text style={s.code}>checkout.session.completed</Text> — Anzahlung erhalten, Booking
          auf 'bezahlt'. Mails werden versendet (idempotent via emailLog).
        </Bullet>
        <Bullet>
          <Text style={s.code}>checkout.session.async_payment_succeeded</Text> — gleiche Logik
          wie completed, für asynchrone Zahlungsmethoden (SEPA etc.)
        </Bullet>
        <Bullet>
          <Text style={s.code}>checkout.session.async_payment_failed</Text> — Booking-Status
          zurück auf 'angefragt'.
        </Bullet>
        <Bullet>
          <Text style={s.code}>charge.refunded</Text> — Refund vom Stripe-Dashboard oder
          unserer Cron wird als <Text style={s.code}>payment.status='erstattet'</Text> + negative
          Refund-Row erfasst, paidCents wird angepasst.
        </Bullet>
        <Bullet>
          <Text style={s.code}>payment_intent.succeeded</Text> — Off-Session-Charges der
          Restzahlung werden hier erfasst, falls sie nicht synchron beim Cron-Lauf bestätigt
          wurden.
        </Bullet>

        <Text style={s.h2}>Rechnungen (GoBD-konform)</Text>
        <Bullet>
          Atomare Rechnungsnummer via Postgres-Sequence{" "}
          <Text style={s.code}>invoice_seq</Text>: Format <Text style={s.code}>WH-2026-00001</Text>
        </Bullet>
        <Bullet>
          Ausstellung automatisch beim Anzahlungs-Webhook — sobald die Anzahlung erhalten
          wurde, ist die Rechnung da
        </Bullet>
        <Bullet>
          PDF-Download über die Buchungs-Detail-Seite („Rechnung als PDF · WH-YYYY-NNNNN")
        </Bullet>
        <Bullet>
          Steuer-Hinweis im PDF: „Skifreunde Gütersloh e.V. ist gemeinnütziger Verein,
          Vermietung steuerfrei nach §4 UStG"
        </Bullet>

        <Text style={s.h2}>Kautions-Hold setzen</Text>
        <Text style={s.p}>
          Auf der Buchungs-Detail-Seite gibt's einen Toggle „Kaution einbehalten":
        </Text>
        <Bullet>Setze ihn, wenn ein Schaden festgestellt wurde</Bullet>
        <Bullet>Verhindert die automatische Refund-Cron bei T+14</Bullet>
        <Bullet>Du musst den Refund (oder Teil-Refund) manuell im Stripe-Dashboard auslösen</Bullet>
        <Bullet>Activity-Log wird mit Begründung gefüllt</Bullet>

        <Tip>
          Refund vom Stripe-Dashboard? Kein Problem. Der <Text style={s.code}>charge.refunded</Text>-Webhook
          fängt das auf und passt die Booking-DB automatisch an.
        </Tip>
        <Footer />
      </Page>

      {/* === 11 LIFECYCLE-MAILS === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="11 · Lifecycle-Mails" page={18} />
        <Text style={s.h1}>Lifecycle-Mails — täglicher Cron um 08:00</Text>
        <Text style={s.p}>
          Cron <Text style={s.code}>/api/cron/daily-mail-jobs</Text> läuft täglich um 08:00 Uhr
          und versendet datums-basierte Lifecycle-Mails. Idempotent über{" "}
          <Text style={s.code}>email_log</Text>: jede Mail geht pro Buchung pro Template nur
          einmal raus.
        </Text>

        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "12%" }]}>Trigger</Text>
            <Text style={[s.th, { width: "30%" }]}>Mail</Text>
            <Text style={[s.th, { width: "58%" }]}>Inhalt</Text>
          </View>
          {[
            ["T-14", "payment-reminder", "Restzahlung in 14 Tagen, mit Hinweis auf automatischen Einzug."],
            ["T-7", "arrival-info", "Anschrift, Anfahrt (Auto+ÖPNV), Packliste. Plus: Off-Session-Charge der Restzahlung wird versucht."],
            ["T-1", "key-handover", "Großer Code-Block mit Schlüssel-Code (HUETTE_KEY_SAFE_CODE), Anweisungen Schlüsselsafe, Notfall-Nummern."],
            ["T+5", "review-request", "Bewertungs-Mail mit Link zur Buchung. Triggert nur, wenn Status='abgereist'."],
          ].map(([trig, tpl, body]) => (
            <View style={s.tableRow} key={trig}>
              <Text style={[s.td, { width: "12%", fontFamily: "Helvetica-Bold", color: C.green }]}>
                {trig}
              </Text>
              <Text style={[s.td, { width: "30%", fontFamily: "Courier", fontSize: 9 }]}>
                {tpl}
              </Text>
              <Text style={[s.td, { width: "58%" }]}>{body}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Schlüssel-Code konfigurieren</Text>
        <Text style={s.p}>
          Im Vercel-Dashboard unter Environment Variables:
        </Text>
        <Text style={s.code}>HUETTE_KEY_SAFE_CODE = 1234</Text>
        <Bullet>Default ist „0000" — bitte vor Live-Betrieb echten Code setzen</Bullet>
        <Bullet>Code wird in der T-1-Mail an alle ausgehenden Buchungen verschickt</Bullet>
        <Bullet>Bei Code-Änderung: ab dem nächsten Cron-Lauf gilt der neue Code</Bullet>

        <Tip>
          Falls Du eine zukünftige Mail manuell auslösen willst (z.B. weil Du den Code-Mail
          neu schicken musst): einfach den entsprechenden Activity-Log-Eintrag in der DB
          löschen oder den emailLog-Eintrag für diese Buchung — beim nächsten Cron-Lauf wird
          die Mail dann erneut versendet.
        </Tip>
        <Footer />
      </Page>

      {/* === 12 AUDIT + DSGVO === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="12 · Audit-Log & DSGVO" page={19} />
        <Text style={s.h1}>Audit-Log & DSGVO</Text>

        <Text style={s.h2}>Audit-Log · {"`"}/m/audit{"`"} (Admin-only)</Text>
        <Text style={s.p}>
          Lückenlose Activity-History aller Manager-Aktionen. Jeder Login, Buchungs-Status-Wechsel,
          Mail-Versand, Manager-Edit, Mitgliedschafts-Verifizierung etc. wird automatisch
          geloggt.
        </Text>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Filter:</Text> Wer (E-Mail), Was
          (Such-Text), Buchungs-Nr., Datum-Range
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Pagination:</Text> 50 Einträge pro
          Seite, neueste zuerst
        </Bullet>
        <Bullet>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Unveränderbar:</Text> Activity-Log-Einträge
          können nicht editiert werden — auch nicht von Admins
        </Bullet>

        <Text style={s.h2}>DSGVO-Workflows</Text>
        <Text style={s.h3}>Daten-Export (Recht auf Auskunft)</Text>
        <Bullet>
          Kunde klickt im Konto-Profil auf „Daten-Export"
        </Bullet>
        <Bullet>
          ZIP-Download mit allen Customer-Daten, Buchungen, Zahlungen, Rechnungen
        </Bullet>
        <Bullet>
          Manager kann das Gleiche im Backend für jeden Customer auslösen
        </Bullet>

        <Text style={s.h3}>Konto-Löschung (Recht auf Vergessen)</Text>
        <Bullet>
          Customer im Konto-Profil → „Konto löschen" → 30-Tage-Soft-Delete (Reaktivierungs-Frist)
        </Bullet>
        <Bullet>
          Nach 30 Tagen: Customer-Daten werden anonymisiert. Buchungen bleiben für GoBD
          erhalten, aber ohne PII.
        </Bullet>

        <Text style={s.h3}>Mail-Log</Text>
        <Bullet>
          Jede versendete Mail wird in <Text style={s.code}>email_log</Text> erfasst (an wen,
          welcher Template, Zeitstempel, Status sent/failed)
        </Bullet>
        <Bullet>
          Hilft bei Beschwerden („Diese Mail ist nie gekommen!") — Du siehst sofort ob &
          wann die Mail rausging
        </Bullet>

        <Danger>
          Backup-Strategie: Neon-Postgres macht automatische Daily-Backups. Bei Verdacht auf
          Datenpanne sofort Vercel + Neon kontaktieren — Activity-Log dient als forensische
          Spur.
        </Danger>
        <Footer />
      </Page>

      {/* === 13 FAQ === */}
      <Page size="A4" style={s.page}>
        <PageHeader section="13 · FAQ" page={20} />
        <Text style={s.h1}>FAQ & Troubleshooting</Text>

        <Text style={s.h3}>Eine Buchungs-Mail kam doppelt an</Text>
        <Text style={s.p}>
          Sollte seit dem Idempotenz-Fix nicht mehr passieren. Falls doch: Schau im
          email_log, ob zwei Einträge mit gleichem Template + bookingId existieren. Das
          ist ein Bug — bitte melden.
        </Text>

        <Text style={s.h3}>Restzahlung wurde nicht automatisch eingezogen</Text>
        <Text style={s.p}>
          Mögliche Ursachen: Karte hat nicht genug Deckung, Bank verlangt 3DS, oder die
          Stripe-Customer ist nicht korrekt verknüpft. Workflow: Cron protokolliert den
          Versuch im Activity-Log. Manager muss dann eine Mail mit manuellem Zahlungslink
          schicken (siehe Abschnitt 03).
        </Text>

        <Text style={s.h3}>Kunde will Mitglieds-Tarif aber ist noch nicht verifiziert</Text>
        <Text style={s.p}>
          System erlaubt das nicht: das „Vereinsmitglieder"-Eingabefeld im Buchungs-Formular
          ist gesperrt für nicht-verifizierte. Workflow: Kunde im Konto Mitgliedschaft beantragen,
          Manager verifiziert, danach kann er buchen.
        </Text>

        <Text style={s.h3}>Tarif-Änderungen wirken nicht</Text>
        <Text style={s.p}>
          Bestehende Buchungen behalten ihren Snapshot-Preis. Tarif-Änderungen wirken nur auf
          neue Buchungen. Falls die Änderung gar nicht greift: prüfe, ob „Aktiv" gesetzt ist
          und ob ein Saison-spezifischer Tarif (höhere Priorität) den Standard-Tarif überschreibt.
        </Text>

        <Text style={s.h3}>Übergabeprotokoll ohne Internet?</Text>
        <Text style={s.p}>
          Das Tablet-UI funktioniert nur online — Foto-Upload und Submit gehen direkt an die
          DB. Bei schlechter Verbindung: warten bis Empfang da ist. Form-Daten bleiben im
          Browser-State erhalten, solange die Seite nicht neu geladen wird.
        </Text>

        <Text style={s.h3}>Wie wird die Pufferzeit nach Abreise angepasst?</Text>
        <Text style={s.p}>
          In <Text style={s.code}>/m/einstellungen</Text> → „Reinigung &amp; Pufferzeit". Default
          1 Tag, kann auf 0–7 Tage gesetzt werden. Wirkt auf alle zukünftigen Verfügbarkeits-Checks.
        </Text>

        <Text style={s.h3}>Wo finde ich den Activity-Log einer einzelnen Buchung?</Text>
        <Text style={s.p}>
          Auf der Buchungs-Detail-Seite scrolle ganz nach unten — der „Aktivitäts-Verlauf"
          zeigt alle Einträge mit Bezug zu dieser Buchung. Im{" "}
          <Text style={s.code}>/m/audit</Text> kannst Du sie nach <Text style={s.code}>bookingId</Text>{" "}
          filtern.
        </Text>

        <Text style={s.h3}>Was tun bei einer Stornierung in letzter Minute?</Text>
        <Text style={s.p}>
          Kunde kann selbst stornieren via{" "}
          <Text style={s.code}>/konto/buchungen/[id]</Text> (Storno-Button mit Tier-Anzeige).
          Manager kann manuell stornieren via Status-Dropdown auf der Detail-Seite. Der Refund
          (abzgl. Storno-Gebühr) muss derzeit manuell im Stripe-Dashboard ausgelöst werden.
        </Text>

        <Tip label="Kontakt bei Bug-Verdacht">
          Beschreibe den Vorgang möglichst genau (was hast Du geklickt? Welche Buchungs-Nr.?
          Welche Fehlermeldung?). Mit Buchungs-Nr. und Zeitstempel können wir den Vorgang
          im Activity-Log + email_log + Vercel-Logs reproduzieren.
        </Tip>
        <Footer />
      </Page>
    </Document>
  );
}

const TocRow = ({ num, title, page }: { num: string; title: string; page: string }) => (
  <View style={s.tocItem}>
    <Text style={s.tocNum}>{num}</Text>
    <Text style={s.tocTitle}>{title}</Text>
    <Text style={s.tocPage}>S. {page}</Text>
  </View>
);
