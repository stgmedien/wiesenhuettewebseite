# Plan: Download-Bereich /downloads

Zentrale Service-Seite für Anleitungen, Formulare und Unterlagen. Ziel: Gäste,
Gruppen, Schulen und Mitglieder finden alles Wichtige zum Ansehen/Ausdrucken an
einem Ort — entlastet Hüttenwart & Vorstand von wiederkehrenden Rückfragen.

## ✅ Bereits online
- **Mitgliedschaft beantragen — Kurzanleitung** (PDF, mit Screenshots)

---

## Empfohlene nächste Downloads (priorisiert)

### Anleitungen
| Download | Nutzen | Quelle / Aufwand | Prio |
|---|---|---|---|
| **Online-Buchung Schritt für Schritt** | Weniger Abbrüche/Rückfragen bei nicht so technik-affinen Buchern | Wie Mitglieds-Anleitung: Screenshots aus dem Buchungs-Flow → PDF | Hoch |
| **Anreise & Schlüsselübergabe — Ablauf** | Klärt „Wie komme ich rein, wann melde ich mich bei Toni?" | Neu schreiben (1 Seite) | Hoch |
| **Abreise-Checkliste** | Weniger Reinigungs-Mehraufwand/Kautionsstreit; Gruppe weiß, was zu tun ist | Aus /hausordnung-Inhalt → 1-seitiges PDF zum Abhaken | Hoch |

### Hütten-Unterlagen
| Download | Nutzen | Quelle / Aufwand | Prio |
|---|---|---|---|
| **Hausordnung (druckbar)** | Zum Aushängen in der Hütte / Mitnehmen | /hausordnung → Print-PDF | Hoch |
| **Grundrisse / Lagepläne (alle 4 Geschosse)** | Gruppen planen Zimmer-/Bettenbelegung vorab | Die 4 PNGs (UG/EG/OG/DG) → 1 PDF | Mittel |
| **Inventar- & Ausstattungsliste** | Gruppen wissen, was an Küchenausstattung/Geschirr da ist → bessere Selbstversorgung | Neu zusammenstellen | Mittel |
| **Bettenbelegungs-/Schlafzimmer-Übersicht** | Schlafplätze pro Raum auf einen Blick | Aus /huette-Daten | Niedrig |

### Anreise & Lage
| Download | Nutzen | Quelle / Aufwand | Prio |
|---|---|---|---|
| **Anfahrt & Lageplan** | Die knifflige Einfahrt/der Schotterweg sind erklärungsbedürftig (v. a. Winter) | Aus /lage-Inhalt + Kartenausschnitt → PDF | Hoch |

### Verein & Formulare
| Download | Nutzen | Quelle / Aufwand | Prio |
|---|---|---|---|
| **Preisliste 2026** | Offizielle Preisübersicht zum Weitergeben (Mitglieder −50 %, Kurtaxe, Pauschalen) | Aus den neuen Tarifen → 1-seitiges PDF | Hoch |
| **AGB (druckbar)** | Rechtssicherheit, zum Ablegen | /agb → Print-PDF | Mittel |
| **Mietvertrag-Muster** | Transparenz: Gruppen sehen vorab, was sie unterschreiben | Aus Mietvertrag-Mail-Template → PDF | Mittel |
| **Mitgliedsantrag (Papierformular)** | Für Mitglieder ohne Online-Konto / offline-Beitritt | Neu (Formular-PDF) | Niedrig |

### Region & Freizeit
| Download | Nutzen | Quelle / Aufwand | Prio |
|---|---|---|---|
| **Ausflugs- & Empfehlungstipps** | Gäste planen vorab; weniger Vor-Ort-Fragen | /empfehlungen → PDF | Mittel |
| **Wandertouren (GPX-Bundle + Übersicht)** | Bereits GPX vorhanden — als Paket bündeln | /wandertouren GPX + 1 Übersichts-PDF | Mittel |
| **Packliste (generische Druckversion)** | Ergänzt den personalisierten Generator | /packliste → Standard-PDF | Niedrig |

### Schulprojekt (ESG)
| Download | Nutzen | Quelle / Aufwand | Prio |
|---|---|---|---|
| **Eltern-Infoblatt Lerngruppen** | Kosten (Kurtaxe/Energie), Mitbringen, Ablauf — als Elternbrief | Aus /schulprojekt-FAQ → PDF | Mittel |

---

## Generierungs-Ansatz
Viele dieser PDFs lassen sich **automatisch aus bestehenden Seiten** erzeugen
(Print-CSS + Headless-Chrome `print-to-pdf`, wie beim Mitglieds-PDF). Sinnvoll:
- **Print-Versionen** (Hausordnung, AGB, Empfehlungen, Packliste): bestehende
  Inhalte wiederverwenden, kein Doppelpflege-Aufwand.
- **Neu zu schreibende** (Anreise-Ablauf, Abreise-Checkliste, Inventarliste,
  Eltern-Infoblatt): kurze, eigenständige Dokumente.
- **Aus Daten** (Preisliste, Grundrisse, Bettenplan): aus den vorhandenen
  Tarifen/Assets zusammensetzen.

## Pflege / Struktur
- Dateien unter `public/downloads/`, Seite listet sie kategorisiert.
- Optional später: Kategorien-Filter, Datei-Größe automatisch, „zuletzt
  aktualisiert"-Datum.
- **Empfehlung Reihenfolge:** zuerst die „Hoch"-Prio-Stücke (Buchungs-Anleitung,
  Anreise-Ablauf, Abreise-Checkliste, Hausordnung-PDF, Preisliste, Anfahrt).
