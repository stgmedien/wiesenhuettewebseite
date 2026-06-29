# Migrationsplan: Mietverträge → Plattform

> Stand: 2026-06-02 · Scope: **alle 13 Vorgänge** (7 signiert + 6 angefragt) · Speicherung: **neue `documents`-Tabelle**
> Status: **Planung** — noch nichts gegen die DB ausgeführt.

## 1. Ausgangslage

Quelle: `docs/Vertrag_unterschrieben/`. Jeder Vorgang besteht aus bis zu drei
PDF-Typen:

| Typ | Dateimuster | Rolle in der Migration |
|---|---|---|
| Anschreiben + vorbereiteter Mietvertrag | `…-Anschreiben+Mietvertrag-…pdf` | **Datenquelle** (immer maschinenlesbarer Text) |
| Unterschriebener Mietvertrag | `…-unterschrieben.pdf` | **Beleg** (oft Scan/Foto → als Dokument anhängen) |
| Meldeschein (Feuerwehr) | `meldescheine-…pdf` | optionales Zusatzdokument |

**Strategie:** Strukturierte Felder werden aus der *digitalen* Vorlage geparst
(zuverlässiger Text), das *signierte* PDF (falls vorhanden) wird nur als Beleg
verlinkt. Bei mehreren Vertragsversionen in einem Ordner gilt die jüngste
(z. B. Corbett `…Mietvertrag3`, Hirschmann `…skifreunde1`).

**Status-Regel:**
- Signiert zurück → `bestaetigt` (bzw. `abgereist`, wenn Abreise < heute).
- Nicht unterschrieben, nur angefragt → **`angefragt`** (Wunsch des Auftraggebers,
  auch wenn der Termin bereits in der Vergangenheit liegt).

## 2. Signierte Verträge (7) — Status `bestaetigt` / `abgereist`

| # | Mieter | Organisation | Zeitraum | N | Personen | Übernacht. | Kaution | Kurtaxe | Summe | Typ | Status* |
|---|---|---|---|--:|---|--:|--:|--:|--:|---|---|
| 1 | Walter Goorts | Bosch Transmission Technology | 04.–07.06.2026 | 3 | 20 Erw. | 1.386,00 € | 300 € | 132,00 € | 1.818,00 € | firma | bestaetigt |
| 2 | Eva Bannert | Ev. Stiftisches Gymnasium GT | 18.–21.05.2026 | 3 | 2 Erw. + 27 Schüler | 971,50 € | 300 € | 13,20 € | 1.284,70 € | Schule | abgereist |
| 3 | Tom Kahlhöfer | HSG Wetter/Grundschöttel | 29.–31.05.2026 | 2 | 16 Erw. | 860,00 € | 300 € | 70,40 € | 1.230,40 € | verein | abgereist |
| 4 | Francis Reimann | Trompetercorps Neubeckum e.V. | 12.–14.06.2026 | 2 | 22 Erw. | 1.076,00 € | 300 € | 96,80 € | 1.472,80 € | verein | bestaetigt |
| 5 | Torben Meyer | KLJB Suttrup-Lohe | 07.–09.08.2026 | 2 | 25 Erw. | 1.184,00 € | 300 € | 110,00 € | 1.594,00 € | verein | bestaetigt |
| 6 | Frank Grothusheitkamp | Schützenverein | 09.–11.10.2026 | 2 | 15 Erw. | 824,00 € | 300 € | 66,00 € | 1.190,00 € | verein | bestaetigt |
| 7 | Leonie Neuhaus | Stadtjugendpflege Stadtallendorf | 04.–08.01.2027 | 4 | 2 Erw. + 16 Kinder | 1.112,00 € | 300 € | 17,60 € | 1.429,60 € | firma | bestaetigt |

## 3. Angefragte / nicht unterschriebene Verträge (6) — Status `angefragt`

| # | Mieter | Organisation | Zeitraum | N | Personen | Übernacht. | Kaution | Kurtaxe | Summe | Typ | Status |
|---|---|---|---|--:|---|--:|--:|--:|--:|---|---|
| 8  | Margarete Corbett | Christopherus-Schule Dortmund Holzen | 11.–16.05.2026 | 5 | 5 Erw. + 10 Schüler | 1.175,00 € | 300 € | 0,00 €¹ | 1.475,00 € | Schule | angefragt |
| 9  | Michael Berges | (privat / Familie) | 22.–25.05.2026 | 3 | 18 Erw. | 1.278,00 € | 300 € | 0,00 € | 1.578,00 € | privat | angefragt |
| 10 | Kathrin Hirschmann | Johanniter-Unfall-Hilfe e.V. | 19.–21.06.2026² | 2 | 25 Erw. | 1.184,00 € | 300 € | 110,00 € | 1.594,00 € | verein | angefragt |
| 11 | Lukas Hermes | Kath. Kirchengemeinde St. Peter | 04.–06.09.2026 | 2 | 9 Erw. + 24 Kinder | 1.038,00 €³ | 300 € | 39,60 € | 1.377,60 € | verein | angefragt |
| 12 | Inga Bambana | Private Gruppe | 11.–13.09.2026 | 2 | 7 Erw. + 9 Kinder | 716,00 € | 300 € | 30,80 € | 1.046,80 € | privat | angefragt |
| 13 | Ursula Söldenwagner | Familientreffen Schniederkötter | 02.–06.10.2026 | 4 | 20 Erw. | 1.768,00 € | 300 € | 176,00 € | 2.244,00 € | privat | angefragt |

¹ Corbett: Teilnehmer laut §9 von der Kurtaxe befreit → `kurtaxeCents = 0`.
² Hirschmann: Ordnername `20260719` (19.07.) ≠ Vertrag `19.06.2026` (jüngere Version) → Vertragsdatum gilt; bitte gegenprüfen.
³ Hermes: **kein** Allein-Nutzungs-Aufschlag (0 €) → `soloUse = false`, `soloSurchargeCents = 0`.

## 4. Gemeinsame Annahmen

- Energiepauschale 22 €/Nacht, Endreinigung 190 €, Kaution 300 €,
  Kurtaxe 2,20 €/Person·Nacht (nur ab 16 J.).
- Allein-Nutzungs-Aufschlag 50 € in **allen außer Hermes** → dort
  `soloUse = true`, `soloSurchargeCents = 5000`.
- Keine Buchung unter 15 Personen → kein `minOccupancySurchargeCents`.
- `subtotalCents` = Übernachtungspreis + Kurtaxe (= „Summe" ohne Kaution);
  `depositCents` = 300 €; Zahlungsstatus nicht aus Verträgen ableitbar
  → kein `bezahlt`/`paidCents`.

## 5. Feld-Mapping (Vertrag → Schema)

**`customers`**: Organisation→`company`, Name→`firstName`/`lastName`,
Anschrift→`street`/`zip`/`city` (+`country`=NL bei Goorts), Telefon→`phone`,
E-Mail→`email`. Dedupe per `email` (wie in `m/manuell/actions.ts`).
E-Mail-Bereinigung nötig (z. B. Berges-OCR enthält HTML-Reste).

**`bookings`**: `arrival`/`departure`/`nights`; Personen je Kategorie
(`adults`/`members`/`children`/`pupils`/`teachers`); Preis-Snapshot in Cent
(siehe §4); `status` lt. Regel oben; `source = "Migration"`;
`bookingNumber` via `generateBookingNumber()`.

## 6. Schema-Erweiterung: `documents`-Tabelle (neu)

In `src/lib/db/schema.ts` ergänzen:

```ts
export const documentKindEnum = pgEnum("document_kind", [
  "mietvertrag",   // unterschriebener Mietvertrag
  "anschreiben",   // vorbereiteter Vertrag + Anschreiben
  "meldeschein",   // Feuerwehr-Meldeschein
  "sonstiges",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  kind: documentKindEnum("kind").notNull().default("sonstiges"),
  title: varchar("title", { length: 255 }).notNull(),
  blobUrl: text("blob_url").notNull(),
  originalFilename: varchar("original_filename", { length: 500 }),
  contentType: varchar("content_type", { length: 100 }),
  sizeBytes: integer("size_bytes"),
  signed: boolean("signed").notNull().default(false),
  signedAt: timestamp("signed_at"),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  source: varchar("source", { length: 40 }).notNull().default("upload"), // upload | migration
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  bookingIdx: index("documents_booking_idx").on(t.bookingId),
  customerIdx: index("documents_customer_idx").on(t.customerId),
  kindIdx: index("documents_kind_idx").on(t.kind),
}));
```

Plus `bookingsRelations` um `documents: many(documents)` ergänzen + Typ-Exports.
Migration: `npm run db:generate && npm run db:push`.

- Signierte Vorgänge: `documents`-Zeile `kind=mietvertrag, signed=true` (+ optional
  Anschreiben + Meldeschein).
- Angefragte Vorgänge: `kind=anschreiben, signed=false` (kein signiertes PDF
  vorhanden).

## 7. Migrationsskript (Entwurf)

Neue Datei `scripts/migrate-vertraege.ts` nach Muster von
`scripts/wipe-bookings.ts` (lädt `.env.local`, eigene `postgres`-Connection,
**Dry-Run als Default**, Schreiben erst mit `--yes`).

Ablauf pro Vorgang:
1. Geparste Werte aus einer fest hinterlegten Struktur (die 13 Datensätze oben —
   einmalig manuell verifiziert, statt fehleranfälligem Laufzeit-PDF-Parsing).
2. PDFs nach Vercel Blob hochladen (`put`, wie in
   `src/app/api/m/handover-photo/route.ts`):
   `vertraege/{bookingNumber}/{kind}-{originalname}`.
3. `customers` upserten (per E-Mail), `bookings` einfügen, `documents`-Zeilen
   anlegen.
4. `activityLog`-Eintrag „Migriert aus Altbestand".
5. Dry-Run gibt für jeden Datensatz die geplanten Inserts als Tabelle aus.

## 8. Anzeige (optional, Folgeschritt)

Im Buchungs-Detail (`src/app/(manager)/m/buchungen/[id]/page.tsx`) einen
Abschnitt „Dokumente" mit Download-Links auf `documents.blobUrl` rendern.

## 9. Offene Punkte / Klärungsbedarf

- **Schul-/Gruppen-Personen:** ESG-Bannert „2 Erw. + 27 Schüler" und Corbett
  „5 Erw. + 10 Schüler" — sind die Erwachsenen Lehrkräfte (`teachers`)? Vorschlag:
  Erwachsene als `adults`, Schüler bis 15 als `pupils`.
- **Kundentyp Schule:** Enum kennt nur `privat|mitglied|verein|firma`. Schulen
  (Corbett, ESG-Bannert) und Kirchengemeinde (Hermes) vorläufig als `firma`
  bzw. `verein` — final festlegen.
- **Hirschmann:** Ordnername `20260719` vs. Vertrag `19.06.2026` — Termin bestätigen.
- **Goorts:** Ordnername `20260528` vs. signierter Vertrag `04.–07.06.2026` —
  Migration nutzt die Vertragsdaten.
- **Angefragte mit Vergangenheits-Termin:** Corbett (11.05.) und Berges (22.05.)
  liegen vor heute, werden aber gemäß Vorgabe als `angefragt` angelegt.
- **Berges-E-Mail** enthält OCR-/HTML-Reste (`…gmail.com">…</a>`) → bereinigen zu
  `segreb1973@gmail.com`.
