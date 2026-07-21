/**
 * Manager-Handbuch — strukturierte Inhalte. Jede Section hat eine ID
 * (URL-Hash-Anker), Titel, Suchtext (für Volltextsuche im Client) und
 * den eigentlichen Body als JSX.
 */

import type React from "react";

export type DocSection = {
  id: string;
  title: string;
  group: string;
  /** Flat-Text fuer die Volltextsuche (Titel + alle wichtigen Begriffe). */
  searchText: string;
  body: React.ReactNode;
};

// Hilfs-Komponenten — werden in body unten verwendet
const H = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h3
    id={id}
    className="font-display font-bold text-xl text-[var(--color-wh-deep-green)] mt-8 mb-3 scroll-mt-24"
  >
    {children}
  </h3>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[15px] leading-relaxed mb-3">{children}</p>
);

const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc pl-6 mb-3 space-y-1.5 text-[15px] leading-relaxed">
    {children}
  </ul>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-[13px] bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)] px-1.5 py-0.5 rounded">
    {children}
  </code>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-4 rounded-r-lg">
    <p className="text-xs uppercase tracking-wider font-bold text-emerald-800 mb-1">
      💡 Tipp
    </p>
    <div className="text-[14px] text-emerald-900 leading-relaxed">{children}</div>
  </div>
);

const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4 rounded-r-lg">
    <p className="text-xs uppercase tracking-wider font-bold text-amber-800 mb-1">
      ⚠ Wichtig
    </p>
    <div className="text-[14px] text-amber-900 leading-relaxed">{children}</div>
  </div>
);

const Danger = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-lg">
    <p className="text-xs uppercase tracking-wider font-bold text-red-800 mb-1">
      🛑 Vorsicht
    </p>
    <div className="text-[14px] text-red-900 leading-relaxed">{children}</div>
  </div>
);

const Table = ({
  head,
  rows,
}: {
  head: string[];
  rows: (React.ReactNode | string)[][];
}) => (
  <div className="overflow-x-auto my-4">
    <table className="w-full text-sm border-collapse border border-[var(--color-wh-winter-grey)] rounded-lg">
      <thead className="bg-[var(--color-wh-beige)]">
        <tr>
          {head.map((h) => (
            <th
              key={h}
              className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] border-b border-[var(--color-wh-winter-grey)]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className="border-b border-[var(--color-wh-winter-grey)]/30 last:border-0 hover:bg-[var(--color-wh-snow)]"
          >
            {row.map((cell, j) => (
              <td key={j} className="p-3 align-top text-[14px]">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// =============================================================
// Section-Definitionen
// =============================================================

export const DOC_GROUPS = [
  "Einstieg",
  "Tagesgeschäft",
  "Konfiguration",
  "Kommunikation",
  "Vor Ort",
  "Finanzen",
  "Datenschutz & Audit",
  "Hilfe",
] as const;

export const DOC_SECTIONS: DocSection[] = [
  // -----------------------------------------------------------
  // Einstieg
  // -----------------------------------------------------------
  {
    id: "willkommen",
    title: "Willkommen",
    group: "Einstieg",
    searchText:
      "Willkommen Manager Handbuch Übersicht Dashboard Rollen Manager Admin",
    body: (
      <>
        <P>
          Willkommen im <strong>Manager-Backend</strong> der Wiesenhütte. Diese
          Dokumentation erklärt jeden Bereich Schritt für Schritt — durchsuchbar
          oben rechts.
        </P>
        <P>Du findest hier:</P>
        <UL>
          <li>Wie Du Dich anmeldest und Zwei-Faktor-Authentifizierung einrichtest</li>
          <li>Wie Du Buchungen, Anfragen, Übergaben und Mitgliedschaften verwaltest</li>
          <li>Wie das Zahlungs-, Mahn- und Rechnungssystem im Hintergrund funktioniert</li>
          <li>Wie Du Tarife, Saisons und Mail-Vorlagen änderst, ohne den Code anzufassen</li>
          <li>Wie Du im Notfall im Audit-Log nachsiehst, was wann passiert ist</li>
        </UL>
        <Tip>
          Jede Sektion hat einen eigenen Link — der Permalink-Button rechts neben
          der Überschrift kopiert die URL, damit Du Kolleg:innen direkt auf den
          relevanten Abschnitt verweisen kannst.
        </Tip>
        <H>Rollen</H>
        <UL>
          <li>
            <strong>Manager</strong>: Voller Zugriff auf Buchungen, Mitgliedschaften,
            Stammdaten, Mail-Templates, Übergaben.
          </li>
          <li>
            <strong>Admin</strong>: zusätzlich Zugriff auf Audit-Log, Benutzer-
            verwaltung, granulare Permissions.
          </li>
          <li>
            <strong>Customer</strong>: Endkunden-Konten — kommen ins Manager-Backend
            nicht rein.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: "login",
    title: "Login & Passwort",
    group: "Einstieg",
    searchText:
      "Login Anmelden Passwort vergessen Magic Link Email Link Force Password Change",
    body: (
      <>
        <P>
          Login-Seite: <Code>/m/login</Code>. Du brauchst Deine E-Mail-Adresse und
          Dein Passwort. Wenn 2FA aktiv ist, zusätzlich der 6-stellige Code aus
          Deiner Authenticator-App.
        </P>
        <H>Erste Anmeldung mit erzwungenem Passwort-Wechsel</H>
        <P>
          Wenn ein Admin Dir den Account angelegt hat oder Dein Passwort
          zurückgesetzt wurde, wird beim nächsten Login das Profil aufgerufen und
          alle anderen Routen umgeleitet — bis Du ein neues Passwort gesetzt hast.
          Das ist <strong>Pflicht</strong>, kein Bug.
        </P>
        <H>Passwort vergessen</H>
        <UL>
          <li>
            Auf der Login-Seite den Tab <strong>„Per E-Mail-Link"</strong> wählen
          </li>
          <li>E-Mail eintragen → 15-Min-Magic-Link kommt in Dein Postfach</li>
          <li>Klick auf den Link → Du bist eingeloggt</li>
          <li>Im Profil unter „Passwort ändern" ein neues vergeben</li>
        </UL>
        <Warn>
          Magic-Link ist Rate-limited (max. 5 Versuche pro Stunde). Tappst Du den
          Knopf zu oft, kommt 1 Stunde lang nichts mehr durch.
        </Warn>
      </>
    ),
  },
  {
    id: "2fa",
    title: "Zwei-Faktor-Authentifizierung (2FA)",
    group: "Einstieg",
    searchText:
      "2FA Two Factor TOTP Authenticator Google Authenticator Authy 1Password Backup Codes QR",
    body: (
      <>
        <P>
          2FA ist für Admin-Rollen praktisch Pflicht. Aktiviere sie in Deinem
          Profil unter <Code>/m/profil</Code>.
        </P>
        <H>Einrichtung</H>
        <UL>
          <li>Profil öffnen, Tab „Zwei-Faktor-Authentifizierung"</li>
          <li>
            QR-Code mit einer Authenticator-App scannen (Google Authenticator,
            Authy, 1Password, Bitwarden …)
          </li>
          <li>6-stelligen Code aus der App eintippen → Bestätigen</li>
          <li>
            <strong>10 Backup-Codes</strong> erscheinen — JETZT herunterladen oder
            ausdrucken. Sie werden nur einmal gezeigt.
          </li>
        </UL>
        <H>Login mit 2FA</H>
        <P>
          Beim nächsten Login wird zusätzlich zum Passwort der TOTP-Code
          abgefragt. Falls Du Dein Telefon verloren hast: einen der 10 Backup-Codes
          eingeben — jeder ist nur einmal verwendbar.
        </P>
        <Warn>
          Wenn Backup-Codes UND Telefon weg sind: Admin muss Dich manuell von 2FA
          befreien. Direkt in der Datenbank über <Code>users.twoFactorEnabled = false</Code>.
        </Warn>
      </>
    ),
  },

  // -----------------------------------------------------------
  // Tagesgeschäft
  // -----------------------------------------------------------
  {
    id: "dashboard",
    title: "Dashboard — Tagesübersicht",
    group: "Tagesgeschäft",
    searchText:
      "Dashboard Tagesansicht Anreisen Abreisen offene Zahlungen Anfragen Activity Log",
    body: (
      <>
        <P>
          <Code>/m/dashboard</Code> ist Dein täglicher Einstieg. Eine Spalte
          Echtzeit-Kennzahlen, eine Spalte Activity-Log.
        </P>
        <Table
          head={["Kachel", "Klick führt zu", "Was Du danach tun kannst"]}
          rows={[
            [
              "Anreisen heute / nächste 7 Tage",
              "Buchungs-Liste, gefiltert auf 'arrival'",
              "Übergabeprotokoll vorbereiten",
            ],
            [
              "Abreisen heute / morgen",
              "Buchungs-Liste, gefiltert auf 'departure'",
              "Abreise-Übernahme starten, Kautions-Hold setzen falls Schaden",
            ],
            [
              "Offene Zahlungen",
              "Buchungen mit Restzahlung-Status 'offen'",
              "Manuelle Zahlungserinnerung, Status prüfen",
            ],
            [
              "Offene Anfragen",
              "Anfragen-Liste",
              "Anfrage beantworten oder in Buchung umwandeln",
            ],
            [
              "Letzte Aktivität",
              "Activity-Log, Zeitfenster 30 Tage",
              "Wer hat wann was getan",
            ],
          ]}
        />
        <Tip>
          Sidebar zeigt eine Zahl neben „Mitgliedschaften", wenn Anträge zur
          Verifizierung anstehen — bitte mindestens 1× pro Woche durchklicken.
        </Tip>
      </>
    ),
  },
  {
    id: "buchungen",
    title: "Buchungen verwalten",
    group: "Tagesgeschäft",
    searchText:
      "Buchungen Liste Detail Status Filter Suche bookingNumber Kunde Anreise Abreise",
    body: (
      <>
        <H>Liste</H>
        <P>
          <Code>/m/buchungen</Code> zeigt alle Buchungen tabellarisch. Filter-Bar
          oben für Status, Zeitraum, Suche nach Buchungsnr. oder Kundenname. Klick
          auf Zeile öffnet die Detail-Seite.
        </P>

        <H>Detail-Seite</H>
        <P>
          <Code>/m/buchungen/[id]</Code>. Enthält:
        </P>
        <UL>
          <li>Kunden-Daten + Mitgliedsstatus</li>
          <li>An-/Abreise + Belegung (gewichtete Personen-Anzahl)</li>
          <li>Komplette Preis-Aufschlüsselung (Übernachtung, Reinigung, Solo, Extras)</li>
          <li>Zahlungs-Tabelle (erhalten/offen/erstattet) + Saldo</li>
          <li>Status-Dropdown zum manuellen Ändern</li>
          <li>Buttons: Mail an Bucher, Anreise-Übergabe, Abreise-Übernahme, PDF-Rechnung</li>
          <li>Kautions-Hold-Toggle (verhindert Auto-Refund bei Schaden)</li>
          <li>Notizen-Sektion (intern, nicht für Kunden sichtbar)</li>
          <li>Activity-Log dieser Buchung am Ende</li>
        </UL>

        <H>Status-Workflow</H>
        <Table
          head={["Status", "Wann automatisch", "Wann manuell"]}
          rows={[
            [
              "angefragt",
              "Beim Anlegen (vor Anzahlung)",
              "Manuelle Buchung ohne sofortige Zahlung",
            ],
            [
              "bestaetigt",
              "—",
              "Bei extern erfolgter Buchung (Telefon, Mail) ohne Online-Anzahlung",
            ],
            ["bezahlt", "Stripe-Webhook checkout.session.completed", "—"],
            ["angereist", "Über Anreise-Übergabe", "Status-Dropdown"],
            [
              "abgereist",
              "Über Abreise-Übernahme",
              "Status-Dropdown — triggert Loyalty-Code + T+5 Bewertungs-Mail",
            ],
            ["storniert", "Self-Storno via /konto", "Status-Dropdown"],
            ["wartung", "—", "Interne Sperrzeit (Heizung, Reinigung, Vereinsfeier)"],
          ]}
        />
      </>
    ),
  },
  {
    id: "manager-mail",
    title: "Mail an Bucher senden",
    group: "Kommunikation",
    searchText:
      "Mail Bucher senden Vorlage Template Picker Markdown Zahlungslink Stripe Reply To",
    body: (
      <>
        <P>
          Auf der Buchungs-Detail-Seite klick „Mail an Bucher senden". Du bekommst
          ein Formular mit:
        </P>
        <H>Vorlage einsetzen</H>
        <P>
          Dropdown mit allen aktivierten Mail-Templates. Auswahl füllt Subject und
          Body automatisch mit den Buchungs-Daten (Vorname, Buchungsnr., Daten,
          Beträge etc.). Du kannst danach noch frei editieren — Du bleibst Herr im
          Haus.
        </P>
        <H>Subject + Body</H>
        <P>Markdown ist erlaubt:</P>
        <UL>
          <li>
            <Code>**fett**</Code>, <Code>*kursiv*</Code>, <Code>`Code`</Code>
          </li>
          <li>
            <Code># Heading</Code>, <Code>## Sub-Heading</Code>
          </li>
          <li>
            <Code>- Listenpunkt</Code>
          </li>
          <li>
            <Code>[Linktext](https://...)</Code>
          </li>
          <li>
            <Code>{`> Zitat-Block`}</Code>
          </li>
        </UL>

        <H>Zahlungslink dazu erzeugen</H>
        <P>
          Checkbox aktivieren → Eingabefelder für Betrag und Zweck erscheinen. Bei
          Versand wird eine <strong>Stripe-Checkout-URL</strong> generiert und in
          die Mail eingefügt. Verwendbar für Schadensersatz, Restzahlung,
          Zusatzleistungen.
        </P>

        <Tip>
          Die Mail wird über <Code>hello@wiesenhuette.de</Code> versendet, mit{" "}
          <strong>Reply-To auf Deine Manager-Mail</strong> — Antworten landen
          direkt bei Dir.
        </Tip>
      </>
    ),
  },
  {
    id: "manuelle-buchung",
    title: "Manuelle Buchung anlegen",
    group: "Tagesgeschäft",
    searchText:
      "Manuelle Buchung anlegen Telefon Email Customer Mitglied Tarif",
    body: (
      <>
        <P>
          Pfad: <Code>/m/manuell</Code>. Verwende diese Maske, wenn jemand
          telefonisch oder per Mail eine Buchung anfragt und nicht selbst online
          bucht.
        </P>
        <H>Vorgehen</H>
        <UL>
          <li>Datum auswählen — Belegung wird live geprüft</li>
          <li>Personen-Anzahl je Kategorie eintragen</li>
          <li>
            Kunden-Daten ergänzen (oder bestehenden Customer via Email finden)
          </li>
          <li>Anlass + ggf. Manager-Notizen</li>
          <li>
            „Anlegen" → Buchung wird mit Status <Code>angefragt</Code> erstellt
          </li>
        </UL>
        <Tip>
          Manuelle Buchungen erzeugen <strong>keinen Stripe-Checkout</strong> —
          sie sind reine DB-Einträge. Wenn der Kunde später bezahlen soll, schick
          ihm aus der Buchungs-Detail-Seite eine Mail mit Zahlungslink.
        </Tip>
        <Warn>
          Mitglieds-Tarife (−50 %, z. B. 11,00 €/Nacht für Erwachsene) lassen sich auch manuell nur eintragen,
          wenn der Customer als verifiziertes Mitglied im System hinterlegt ist —
          sonst zählt er als Nichtmitglied.
        </Warn>
      </>
    ),
  },
  {
    id: "kalender-sperrzeiten",
    title: "Kalender & Sperrzeiten",
    group: "Tagesgeschäft",
    searchText:
      "Kalender Sperrzeiten Wartung Reinigung Pufferzeit Belegung",
    body: (
      <>
        <H>Kalender</H>
        <P>
          <Code>/m/kalender</Code> — visuelle Belegungs-Übersicht. Buchungen sind
          farbig dargestellt:
        </P>
        <UL>
          <li>
            <span style={{ color: "#2F4A35", fontWeight: 700 }}>Grün</span> —
            bestätigte/bezahlte Buchung
          </li>
          <li>
            <span style={{ color: "#d97706", fontWeight: 700 }}>Gelb</span> —
            angefragte Buchung
          </li>
          <li>
            <span style={{ color: "#888", fontWeight: 700 }}>Grau gestreift</span>{" "}
            — Reinigungs-Pufferzeit nach Abreise
          </li>
          <li>
            <span style={{ color: "#dc2626", fontWeight: 700 }}>Rot</span> —
            Wartungs-Sperrzeit
          </li>
        </UL>

        <H>Sperrzeiten</H>
        <P>
          <Code>/m/sperrzeiten</Code> — sperrt die Hütte für externe Buchungen
          während Renovierung, Heizungs-Service, Vereinsfeiern.
        </P>
        <UL>
          <li>Datum-Range auswählen, Anlass eintragen, „Sperren"</li>
          <li>Erscheint im öffentlichen Kalender als „nicht buchbar"</li>
          <li>Kann jederzeit gelöscht werden</li>
        </UL>

        <Tip>
          Reinigungs-Pufferzeit konfigurieren: <Code>/m/einstellungen</Code> →
          „Reinigung & Pufferzeit". Default 1 Tag, kann auf 0–7 Tage gesetzt
          werden. Wirkt auf alle zukünftigen Verfügbarkeits-Checks.
        </Tip>
      </>
    ),
  },

  // -----------------------------------------------------------
  // Kommunikation
  // -----------------------------------------------------------
  {
    id: "mitgliedschaften",
    title: "Mitgliedschafts-Verifizierung",
    group: "Konfiguration",
    searchText:
      "Mitgliedschaft Verifizierung Vereinsmitglied bestätigen ablehnen Mitgliedsnummer",
    body: (
      <>
        <P>
          <Code>/m/mitgliedschaften</Code>. Hier verifizierst Du die von Kunden
          beantragten Vereinsmitgliedschaften.
        </P>
        <H>Workflow</H>
        <Table
          head={["Schritt", "Was passiert"]}
          rows={[
            [
              "1 · Antrag eingeht",
              "Kunde füllt im /konto/profil das Formular aus → membershipStatus='pending'",
            ],
            [
              "2 · Mail-Benachrichtigung",
              "Manager bekommt Mail an hello@wiesenhuette.de mit Antrags-Daten + Notiz; Antragsteller bekommt Bestätigungs-Mail",
            ],
            [
              "3 · Prüfung",
              "Im Backend: Liste aller offenen Anträge; Manager vergleicht mit Vereinsverzeichnis",
            ],
            [
              "4a · Bestätigen",
              "Mitgliedsnummer eintragen, ✓ Bestätigen → Status verified, Mitglieds-Tarif freigeschaltet",
            ],
            [
              "4b · Ablehnen",
              "Grund eintragen, Ablehnen → Status rejected; Kunde kann erneut beantragen",
            ],
          ]}
        />
        <Tip>
          Bei jeder Bestätigung/Ablehnung gehen automatisch zwei Mails raus
          (Antragsteller + intern), beide werden im Activity-Log erfasst.
        </Tip>
      </>
    ),
  },
  {
    id: "mail-templates",
    title: "Mail-Templates — Editor",
    group: "Kommunikation",
    searchText:
      "Mail Template Editor Versionen Variablen Drag Drop Live Preview Markdown Diff",
    body: (
      <>
        <P>
          <Code>/m/mail-templates</Code>. Versionierte Vorlagen mit Markdown-Body,
          Drag-and-Drop-Variablen und Live-Preview.
        </P>
        <H>3-Spalten-Aufbau</H>
        <Table
          head={["Spalte", "Inhalt"]}
          rows={[
            [
              "Links",
              "Variablen-Palette (gruppiert: Kunde, Buchung, Zahlung, Sonstiges) + Format-Toolbar (H1/H2/H3, Bold, Italic, Code, Link, Liste, Zitat)",
            ],
            [
              "Mitte",
              "Subject-Feld + Body-Markdown-Textarea + Änderungs-Notiz",
            ],
            [
              "Rechts",
              "Live-Preview als iframe (echter Email-Wrapper). Toggle 'Mit Beispielwerten' / 'Roh'.",
            ],
          ]}
        />

        <H>Variablen einsetzen</H>
        <UL>
          <li>
            <strong>Drag-and-Drop</strong>: Variablen-Pille aus der Palette ins
            Subject- oder Body-Feld ziehen → an exakter Drop-Position eingefügt
          </li>
          <li>
            <strong>Klick</strong>: auf eine Pille → fügt am Cursor (oder Ende)
            ein
          </li>
          <li>Hover über Pille zeigt Beschreibung + Beispielwert</li>
        </UL>

        <H>Verfügbare Variablen</H>
        <Table
          head={["Gruppe", "Variablen"]}
          rows={[
            [
              "Kunde",
              <Code key="k">{`{{firstName}} {{lastName}} {{guestName}} {{email}} {{phone}} {{salutation}}`}</Code>,
            ],
            [
              "Buchung",
              <Code key="b">{`{{bookingNumber}} {{arrival}} {{departure}} {{arrivalShort}} {{departureShort}} {{nights}} {{persons}} {{purpose}} {{bookingUrl}}`}</Code>,
            ],
            [
              "Zahlung",
              <Code key="z">{`{{totalAmount}} {{paidAmount}} {{remainderAmount}} {{depositAmount}} {{invoiceNumber}}`}</Code>,
            ],
            ["Sonstiges", <Code key="s">{`{{today}} {{baseUrl}}`}</Code>],
          ]}
        />

        <H>Versionierung</H>
        <UL>
          <li>Jeder Klick auf „Neue Version speichern" erzeugt eine neue Version</li>
          <li>Alte Versionen bleiben im Versions-Verlauf erhalten</li>
          <li>„Diff vs. letzte Version"-Tab zeigt zeilenweise Änderungen</li>
          <li>Beliebige Version kann jederzeit re-aktiviert werden (Rollback)</li>
          <li>Pro Speicherung: optionale Änderungs-Notiz für die Audit-Spur</li>
        </UL>

        <Tip>
          Keyboard-Shortcuts im Editor: <Code>⌘B</Code> Bold, <Code>⌘I</Code>{" "}
          Italic, <Code>⌘K</Code> Link.
        </Tip>

        <H>Templates löschen</H>
        <P>
          In der Liste pro Zeile gibt's einen „Löschen"-Link mit Sicherheits-
          Dialog. Cascading: alle Versionen des Templates werden mitgelöscht.{" "}
          <strong>Versendete Mails bleiben im email_log erhalten</strong> — keine
          Audit-Daten verloren.
        </P>
      </>
    ),
  },
  {
    id: "lifecycle-mails",
    title: "Lifecycle-Mails (T-14 / T-7 / T-1 / T+5)",
    group: "Kommunikation",
    searchText:
      "Lifecycle Mail Cron T-14 T-7 T-1 T+5 Anreise Schlüssel Bewertung payment reminder",
    body: (
      <>
        <P>
          Cron <Code>/api/cron/daily-mail-jobs</Code> läuft täglich um 08:00 Uhr
          und versendet datums-basierte Mails. Idempotent über{" "}
          <Code>email_log</Code> — keine Doppel-Mails.
        </P>
        <Table
          head={["Trigger", "Template", "Inhalt + Effekt"]}
          rows={[
            [
              "T-14",
              "payment-reminder",
              "Restzahlung in 14 Tagen, mit Hinweis auf automatischen Einzug bei T-7",
            ],
            [
              "T-7",
              "arrival-info",
              "Anschrift, Anfahrt (Auto + ÖPNV), Packliste. Plus: Off-Session-Charge der Restzahlung wird versucht.",
            ],
            [
              "T+5",
              "review-request",
              "Bewertungs-Mail mit Link zur Buchung. Triggert nur, wenn Status='abgereist'",
            ],
          ]}
        />
        <H>Schlüsselübergabe</H>
        <P>
          <strong>Die automatische Schlüssel-Code-Mail (T-1) ist entfallen.</strong>{" "}
          Schlüsselübergabe wird persönlich mit dem Hüttenwart Toni Klauke geregelt
          — er nimmt die Gäste an der Hütte in Empfang. Die Umgebungsvariable
          <Code>HUETTE_KEY_SAFE_CODE</Code> wird nicht mehr verwendet und kann
          aus Vercel entfernt werden.
        </P>
        <Tip>
          Falls Du eine bereits versendete Mail manuell erneut auslösen willst
          (z. B. arrival-info weil sich Daten geändert haben): den entsprechenden
          <Code>email_log</Code>-Eintrag löschen → beim nächsten Cron-Lauf wird
          die Mail erneut versendet.
        </Tip>
      </>
    ),
  },

  // -----------------------------------------------------------
  // Konfiguration
  // -----------------------------------------------------------
  {
    id: "stammdaten",
    title: "Stammdaten — Saisons, Tarife, Extras",
    group: "Konfiguration",
    searchText:
      "Stammdaten Tarife Saisons Extras Preise Pricing Engine Single Source of Truth",
    body: (
      <>
        <P>
          <Code>/m/stammdaten</Code>. Diese Seite ist die Single-Source-of-Truth
          für die Pricing-Engine. Alle Buchungen ziehen ihre Preise live von hier.
        </P>

        <H>Saisons</H>
        <P>
          Zeitliche Tarif-Perioden. Bei jeder Buchung wird je nach Anreisedatum
          die aktive Saison bestimmt; höhere Priorität gewinnt bei
          Überschneidungen.
        </P>
        <UL>
          <li>
            <strong>Format MM-DD</strong>: z.B. 12-15 → 03-15 (Wintersaison über
            Jahreswechsel funktioniert)
          </li>
          <li>
            <strong>Priorität 0-100</strong>: bei zwei sich überschneidenden
            Saisons gewinnt die mit der höchsten Zahl
          </li>
          <li>
            <strong>Aktiv-Toggle</strong>: Saison ist nur wirksam wenn gesetzt
          </li>
        </UL>

        <H>Tarife</H>
        <P>
          Pro Personenkategorie ein Tarif mit Preis pro Nacht. Optional an eine
          Saison gebunden.
        </P>
        <Table
          head={["Kategorie", "Default-Preis", "Wann angewendet"]}
          rows={[
            ["nichtmitglied", "22,00 €/Nacht", "Erwachsene"],
            ["mitglied", "11,00 €/Nacht", "Erwachsene · Vereinsmitglied (−50 %)"],
            ["kind", "12,00 €/Nacht", "Kinder/Schüler bis 16 Jahre"],
            ["schueler", "6,00 €/Nacht", "Kinder/Schüler bis 16 · Vereinsmitglied (−50 %)"],
            ["lehrer", "22,00 €/Nacht", "Lehrkräfte (= Erwachsene)"],
          ]}
        />
        <Tip>
          Tarif-Änderungen wirken sich nur auf <strong>neue Buchungen</strong>{" "}
          aus — bestehende behalten ihren Snapshot-Preis. Jede Änderung landet im
          Audit-Log.
        </Tip>

        <H>Extras</H>
        <P>
          Optionale Zusatzleistungen, die Kunden beim Buchen wählen können.
          Manager kann sie aktivieren / deaktivieren / Preise anpassen.
        </P>
        <UL>
          <li>
            <strong>Code</strong>: technischer Schlüssel (z.B.{" "}
            <Code>holz_buendel</Code>)
          </li>
          <li>
            <strong>Preis-Multiplikatoren</strong>: per Nacht oder per Person
            aktivierbar
          </li>
          <li>
            <strong>Sortier-Reihenfolge</strong>: bestimmt Anzeige im
            Buchen-Formular
          </li>
        </UL>
      </>
    ),
  },

  // -----------------------------------------------------------
  // Vor Ort
  // -----------------------------------------------------------
  {
    id: "uebergabe",
    title: "Übergabeprotokoll (Tablet)",
    group: "Vor Ort",
    searchText:
      "Übergabe Anreise Abreise Checkin Checkout Tablet Foto Unterschrift signature_pad Checkliste",
    body: (
      <>
        <P>
          Pfad: <Code>/m/buchungen/[id]/uebergabe/checkin</Code> bzw.{" "}
          <Code>/uebergabe/checkout</Code>. Erreichbar über die Buttons{" "}
          „📋 Anreise-Übergabe" und „📋 Abreise-Übernahme" auf der
          Buchungs-Detail-Seite.
        </P>

        <H>Aufbau (von oben nach unten)</H>
        <UL>
          <li>
            <strong>Sticky-Header</strong>: Buchungsnummer + Counter „X/Y Punkte
            ok"
          </li>
          <li>
            <strong>Gast-Name</strong>: Vor-/Nachname (vorausgefüllt aus Buchung)
          </li>
          <li>
            <strong>Checkliste</strong>: 12 Punkte bei Anreise / 10 bei Abreise.
            Touch-Target-Checkboxen, automatisch öffnendes Anmerkungs-Feld bei
            „nicht ok"
          </li>
          <li>
            <strong>Foto-Upload</strong>: mehrere Bilder gleichzeitig, auf Mobile
            öffnet die Kamera direkt
          </li>
          <li>
            <strong>Notiz-Feld</strong>: freie Bemerkung
          </li>
          <li>
            <strong>Zwei Unterschriften</strong>: Gast und Wirt, beide auf
            Tablet/Smartphone signiert (signature_pad)
          </li>
          <li>
            <strong>Sticky Submit-Button</strong>: bestätigt + speichert
          </li>
        </UL>

        <H>Anreise-Checkliste (12 Punkte)</H>
        <UL>
          <li>Schlüssel übergeben / Code übermittelt</li>
          <li>Eingangstür funktioniert</li>
          <li>Licht in allen Räumen funktioniert</li>
          <li>Heizung läuft</li>
          <li>Wasser läuft (Küche + Bad)</li>
          <li>Küche sauber & vollständig</li>
          <li>Schlafräume sauber, Matratzen ohne Flecken</li>
          <li>Bad/Toilette sauber</li>
          <li>Brennholz vorhanden</li>
          <li>Müll-Behälter leer</li>
          <li>Feuerlöscher sichtbar & geprüft</li>
          <li>Erste-Hilfe-Set komplett</li>
        </UL>

        <H>Abreise-Checkliste (10 Punkte)</H>
        <UL>
          <li>Küche besenrein hinterlassen</li>
          <li>Schlafräume aufgeräumt, Bettwäsche abgezogen</li>
          <li>Bad/Toilette gereinigt</li>
          <li>Müll fachgerecht entsorgt</li>
          <li>Alle Fenster geschlossen</li>
          <li>Heizung auf Frostschutz reduziert</li>
          <li>Licht überall aus</li>
          <li>Brennholz nachgelegt</li>
          <li>Schlüssel im Schlüsselsafe zurückgelegt</li>
          <li>Keine sichtbaren Schäden</li>
        </UL>

        <H>Was passiert beim Abschließen?</H>
        <UL>
          <li>Checkliste, Fotos, beide Unterschriften → DB</li>
          <li>Fotos und Unterschriften → Vercel-Blob (öffentliche URLs)</li>
          <li>
            Activity-Log: „Anreise/Abreise-Übergabe abgeschlossen — X/Y OK, Z
            Fotos"
          </li>
          <li>
            Buchungs-Detail-Seite zeigt zukünftig den grünen „bereits
            dokumentiert"-Block
          </li>
        </UL>

        <Warn>
          Beide Unterschriften sind Pflicht. Ohne Gast- UND Wirts-Signatur kann
          das Protokoll nicht abgeschlossen werden.
        </Warn>

        <Tip>
          Falls Du nach abgeschlossener Übergabe nochmal eines erfassen möchtest
          (z.B. weil ein Punkt nachgereicht wird): unten gibt's einen
          „&lt;details&gt;"-Toggle „Neues Protokoll erfassen". Das alte bleibt
          erhalten — beide stehen in der History.
        </Tip>
      </>
    ),
  },

  // -----------------------------------------------------------
  // Finanzen
  // -----------------------------------------------------------
  {
    id: "zahlungen-lifecycle",
    title: "Zahlungs-Lifecycle einer Buchung",
    group: "Finanzen",
    searchText:
      "Zahlungen Lifecycle Stripe Anzahlung Restzahlung Kaution Off Session Charge T-7 T+14",
    body: (
      <>
        <P>
          Eine Buchung durchläuft folgende Zahlungs-Phasen automatisch:
        </P>
        <Table
          head={["Phase", "Was passiert"]}
          rows={[
            [
              "Bei Buchung",
              "Stripe-Checkout für 50% Anzahlung. Stripe-Customer wird angelegt, Payment-Method gespeichert für späteren Off-Session-Charge. Kaution (300 €) und Kurtaxe (2,70 €/Person ab 16 J./Nacht) werden NICHT jetzt eingezogen — nur bei kurzfristigen Buchungen (< 14 Tage vor Anreise) sofort mit.",
            ],
            [
              "Anzahlung-Webhook",
              "checkout.session.completed → Booking auf 'bezahlt'. Bestätigungs- und Mietvertrags-Mail versendet (idempotent). GoBD-Rechnung wird via Postgres-SEQUENCE erzeugt.",
            ],
            [
              "T-21 vor Anreise",
              "Cron daily-mail-jobs sendet Zahlungserinnerung mit Hinweis auf den automatischen Einzug bei T-14 (= 14 Tage vor Anreise).",
            ],
            [
              "T-14 vor Anreise",
              "Cron triggert Off-Session-Charge der Restzahlung + Kaution + Kurtaxe über Stripe (gleiche Karte wie Anzahlung). Bei Erfolg: payment-rows 'erhalten'. Bei Fehler: payment-row 'fehlgeschlagen' + Manager muss manuell nachfassen.",
            ],
            [
              "T-7 vor Anreise",
              "Cron sendet Anreise-Info-Mail.",
            ],
            [
              "Bei Abreise",
              "Manager setzt Status auf 'abgereist'. Triggert Loyalty-Code-Vergabe ab 3. Aufenthalt.",
            ],
            [
              "T+5 nach Abreise",
              "Cron sendet Bewertungsanfrage.",
            ],
            [
              "T+14 nach Abreise",
              "Cron release-deposits erstattet die 300 € Kaution automatisch via Stripe-Refund. Bei deposit_hold=true: Skip — Manager refundet manuell.",
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "webhook-events",
    title: "Stripe-Webhook-Events",
    group: "Finanzen",
    searchText:
      "Webhook Stripe checkout session completed charge refunded payment intent succeeded async",
    body: (
      <>
        <P>
          Stripe sendet bei jedem Zahlungs-Ereignis eine HTTP-Nachricht an unsere{" "}
          <Code>/api/stripe/webhook</Code>-Route. Wir verarbeiten:
        </P>
        <Table
          head={["Event", "Reaktion"]}
          rows={[
            [
              "checkout.session.completed",
              "Anzahlung erhalten → Booking auf 'bezahlt', Mails versendet (idempotent), Invoice angelegt",
            ],
            [
              "checkout.session.async_payment_succeeded",
              "Gleiche Logik wie completed, für asynchrone Zahlungsmethoden (SEPA etc.)",
            ],
            [
              "checkout.session.async_payment_failed",
              "Booking-Status zurück auf 'angefragt'",
            ],
            [
              "charge.refunded",
              "Refund vom Stripe-Dashboard oder unserer Cron → payment.status='erstattet' + negative Refund-Row, paidCents wird angepasst",
            ],
            [
              "payment_intent.succeeded",
              "Off-Session-Charges (Restzahlungs-Cron) werden hier erfasst, falls nicht synchron beim Cron-Lauf bestätigt",
            ],
          ]}
        />
        <Tip>
          Refund vom Stripe-Dashboard? Kein Problem. Der charge.refunded-Webhook
          fängt das auf und passt die Booking-DB automatisch an.
        </Tip>
      </>
    ),
  },
  {
    id: "rechnungen",
    title: "Rechnungen (GoBD-konform)",
    group: "Finanzen",
    searchText:
      "Rechnung Invoice GoBD PDF Sequence atomar fortlaufend gemeinnütziger Verein Steuer",
    body: (
      <>
        <P>
          Rechnungen entstehen automatisch beim Anzahlungs-Webhook und sind
          GoBD-konform.
        </P>
        <UL>
          <li>
            <strong>Atomare Rechnungsnummer</strong> via Postgres-Sequence{" "}
            <Code>invoice_seq</Code>: Format <Code>WH-2026-00001</Code>
          </li>
          <li>
            <strong>Lückenlose Vergabe</strong> — keine doppelten oder
            übersprungenen Nummern, auch unter parallel laufenden Webhooks
          </li>
          <li>
            <strong>Customer-Snapshot</strong>: zum Ausstellungszeitpunkt fixiert,
            spätere Adress-Änderungen wirken nicht zurück
          </li>
          <li>
            <strong>Steuer-Hinweis im PDF</strong>: „Skifreunde Gütersloh e.V. ist
            gemeinnütziger Verein, Vermietung steuerfrei nach §4 UStG"
          </li>
        </UL>

        <H>PDF-Download</H>
        <P>
          Über die Buchungs-Detail-Seite („Rechnung als PDF · WH-YYYY-NNNNN") oder
          direkt unter <Code>/api/invoices/[id]/pdf</Code>. Manager-only und
          Customer-only (eigene Buchungen).
        </P>

        <H>Manuell erstellen?</H>
        <P>
          Nicht nötig. Rechnung wird beim Webhook automatisch erzeugt. Wenn sie
          fehlt: <Code>/api/cron/release-deposits</Code> erzeugt sie nochmal als
          Reparatur-Schritt für alte Buchungen.
        </P>
      </>
    ),
  },
  {
    id: "kaution-hold",
    title: "Kautions-Hold setzen",
    group: "Finanzen",
    searchText:
      "Kaution Hold deposit hold Schaden Refund stoppen einbehalten",
    body: (
      <>
        <P>
          Auf der Buchungs-Detail-Seite gibt's einen Toggle{" "}
          <strong>„Kaution einbehalten"</strong>:
        </P>
        <UL>
          <li>Setze ihn, wenn ein Schaden festgestellt wurde</li>
          <li>Verhindert die automatische Refund-Cron bei T+14</li>
          <li>
            Du musst den Refund (oder Teil-Refund) manuell im Stripe-Dashboard
            auslösen
          </li>
          <li>Activity-Log wird mit Begründung gefüllt</li>
        </UL>
        <P>
          Wenn Du teil-refundest, fängt der charge.refunded-Webhook das auf und
          passt paidCents an.
        </P>
      </>
    ),
  },
  {
    id: "discount-codes",
    title: "Discount- & Loyalty-Codes",
    group: "Finanzen",
    searchText:
      "Discount Code Loyalty Rabatt Treue Wiederkehrer Manager",
    body: (
      <>
        <P>Es gibt zwei Arten von Rabatt-Codes:</P>
        <H>Loyalty-Codes (automatisch)</H>
        <UL>
          <li>
            Werden ab dem 3. abgereisten Aufenthalt eines Customers automatisch
            generiert
          </li>
          <li>
            Personalisiert (an <Code>customerId</Code> gebunden) — nur dieser
            Kunde kann sie einlösen
          </li>
          <li>Erscheinen im Kunden-Konto als gelb-amber Karte</li>
          <li>15% bis 3 Stays, 20% ab 5 Stays, einmalig einlösbar</li>
        </UL>
        <H>Manager-Codes (manuell)</H>
        <UL>
          <li>
            Können in der DB direkt angelegt werden (oder zukünftig im Stammdaten-
            Tab)
          </li>
          <li>
            Ohne customerId: jeder Kunde kann sie nutzen
          </li>
          <li>Konfigurierbar: percentOff, fixedOffCents, maxRedemptions, validUntil, minSubtotalCents</li>
        </UL>
        <H>Einlösung</H>
        <P>
          Im Buchungs-Flow Schritt 3 gibt's ein Code-Eingabefeld mit Live-
          Validierung. Bei Erfolg wird der Rabatt vom Subtotal abgezogen, das
          50%-Anzahlungs-Splitting passt sich automatisch an. Code wird beim
          Booking-Insert als eingelöst markiert (atomic, race-safe).
        </P>
      </>
    ),
  },

  // -----------------------------------------------------------
  // Datenschutz & Audit
  // -----------------------------------------------------------
  {
    id: "audit-log",
    title: "Audit-Log",
    group: "Datenschutz & Audit",
    searchText:
      "Audit Log Activity Log Filter Pagination wer was wann unveränderbar",
    body: (
      <>
        <P>
          <Code>/m/audit</Code> (Admin-only). Lückenlose Activity-History aller
          Manager-Aktionen.
        </P>
        <UL>
          <li>
            Jeder Login, Buchungs-Status-Wechsel, Mail-Versand, Manager-Edit,
            Mitgliedschafts-Verifizierung wird automatisch geloggt
          </li>
          <li>
            <strong>Filter</strong>: Wer (E-Mail), Was (Such-Text), Buchungs-Nr.,
            Datum-Range
          </li>
          <li>
            <strong>Pagination</strong>: 50 Einträge pro Seite, neueste zuerst
          </li>
          <li>
            <strong>Unveränderbar</strong>: Activity-Log-Einträge können nicht
            editiert werden — auch nicht von Admins
          </li>
        </UL>
        <Tip>
          Für Bug-Reports: filtere nach Buchungs-Nr. + Zeitraum, da siehst Du die
          komplette Spur. Hilft uns enorm beim Debugging.
        </Tip>
      </>
    ),
  },
  {
    id: "dsgvo",
    title: "DSGVO-Workflows",
    group: "Datenschutz & Audit",
    searchText:
      "DSGVO Datenschutz Datenexport Konto löschen Recht auf Vergessen Soft Delete email_log",
    body: (
      <>
        <H>Daten-Export (Recht auf Auskunft)</H>
        <UL>
          <li>Kunde klickt im Konto-Profil auf „Daten-Export"</li>
          <li>
            ZIP-Download mit allen Customer-Daten, Buchungen, Zahlungen,
            Rechnungen
          </li>
          <li>Manager kann das Gleiche im Backend für jeden Customer auslösen</li>
        </UL>

        <H>Konto-Löschung (Recht auf Vergessen)</H>
        <UL>
          <li>
            Customer im Konto-Profil → „Konto löschen" → 30-Tage-Soft-Delete
            (Reaktivierungs-Frist)
          </li>
          <li>
            Nach 30 Tagen: Customer-Daten werden anonymisiert. Buchungen bleiben
            für GoBD erhalten, aber ohne PII
          </li>
        </UL>

        <H>Mail-Log</H>
        <UL>
          <li>
            Jede versendete Mail wird in <Code>email_log</Code> erfasst (an wen,
            welcher Template, Zeitstempel, Status sent/failed)
          </li>
          <li>
            Hilft bei Beschwerden („Diese Mail ist nie gekommen!") — Du siehst
            sofort ob & wann die Mail rausging
          </li>
        </UL>

        <Danger>
          Bei Verdacht auf Datenpanne sofort Vercel + Neon kontaktieren —
          Activity-Log dient als forensische Spur.
        </Danger>
      </>
    ),
  },

  // -----------------------------------------------------------
  // Hilfe
  // -----------------------------------------------------------
  {
    id: "faq",
    title: "FAQ & Troubleshooting",
    group: "Hilfe",
    searchText:
      "FAQ Troubleshooting Häufige Fragen Probleme Bug Doppelte Mail Restzahlung Mitglieds Tarif",
    body: (
      <>
        <H>Eine Buchungs-Mail kam doppelt an</H>
        <P>
          Sollte seit dem Idempotenz-Fix nicht mehr passieren. Falls doch: schau
          im email_log, ob zwei Einträge mit gleichem Template + bookingId
          existieren. Das ist ein Bug — bitte melden.
        </P>

        <H>Restzahlung wurde nicht automatisch eingezogen</H>
        <P>
          Mögliche Ursachen: Karte hat nicht genug Deckung, Bank verlangt 3DS,
          oder die Stripe-Customer ist nicht korrekt verknüpft. Workflow: Cron
          protokolliert den Versuch im Activity-Log. Manager schickt eine Mail
          mit manuellem Zahlungslink (siehe „Mail an Bucher senden").
        </P>

        <H>Kunde will Mitglieds-Tarif aber ist noch nicht verifiziert</H>
        <P>
          System erlaubt das nicht: das „Vereinsmitglieder"-Eingabefeld im
          Buchungs-Formular ist gesperrt für nicht-verifizierte. Kunde muss
          erst die Mitgliedschaft im Konto beantragen, Manager verifiziert,
          danach kann er buchen.
        </P>

        <H>Tarif-Änderungen wirken nicht</H>
        <P>
          Bestehende Buchungen behalten ihren Snapshot-Preis. Tarif-Änderungen
          wirken nur auf neue Buchungen. Falls die Änderung gar nicht greift:
          prüfe, ob „Aktiv" gesetzt ist und ob ein Saison-spezifischer Tarif
          (höhere Priorität) den Standard-Tarif überschreibt.
        </P>

        <H>Übergabeprotokoll ohne Internet?</H>
        <P>
          Das Tablet-UI funktioniert nur online — Foto-Upload und Submit gehen
          direkt an die DB. Bei schlechter Verbindung: warten bis Empfang da
          ist. Form-Daten bleiben im Browser-State erhalten, solange die Seite
          nicht neu geladen wird.
        </P>

        <H>Wie passe ich die Pufferzeit nach Abreise an?</H>
        <P>
          In <Code>/m/einstellungen</Code> → „Reinigung & Pufferzeit". Default 1
          Tag, kann auf 0–7 Tage gesetzt werden.
        </P>

        <H>Wo finde ich den Activity-Log einer einzelnen Buchung?</H>
        <P>
          Auf der Buchungs-Detail-Seite scrolle ganz nach unten — der
          „Aktivitäts-Verlauf" zeigt alle Einträge mit Bezug zu dieser Buchung.
          Im <Code>/m/audit</Code> kannst Du nach <Code>bookingId</Code> filtern.
        </P>

        <H>Was tun bei einer Stornierung in letzter Minute?</H>
        <P>
          Kunde kann selbst stornieren via <Code>/konto/buchungen/[id]</Code>
          (Storno-Button mit Tier-Anzeige). Manager kann manuell stornieren via
          Status-Dropdown. Refund (abzgl. Storno-Gebühr) muss manuell im
          Stripe-Dashboard ausgelöst werden — der charge.refunded-Webhook fängt
          das auf.
        </P>
      </>
    ),
  },
  {
    id: "kontakt",
    title: "Kontakt & Support",
    group: "Hilfe",
    searchText:
      "Kontakt Support Bug Report Hilfe Feedback Entwicklung",
    body: (
      <>
        <P>Wenn etwas kaputt scheint oder unklar ist:</P>
        <UL>
          <li>
            <strong>Bug-Report</strong>: Beschreibe den Vorgang möglichst genau —
            welcher Klick, welche Buchungs-Nr., welche Fehlermeldung. Mit diesen
            Infos können wir den Vorgang im Activity-Log + email_log + Vercel-
            Logs reproduzieren.
          </li>
          <li>
            <strong>Feature-Request</strong>: gerne — beschreibe das Problem, das
            Du lösen willst (nicht nur die Lösung).
          </li>
          <li>
            <strong>Code-Repository</strong>: github.com/stgmedien/wiesenhuettewebseite
          </li>
        </UL>
        <Tip>
          Diese Doku-Seite wird stetig erweitert. Wenn etwas Wichtiges fehlt oder
          unklar formuliert ist, sag Bescheid — Texte sind in{" "}
          <Code>src/app/(manager)/m/handbuch/sections.tsx</Code> einfach
          editierbar.
        </Tip>
      </>
    ),
  },
];
