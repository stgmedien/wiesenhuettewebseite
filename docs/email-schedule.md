# E-Mail-Plan Wiesenhütte

**Stand:** 2026-05-06
**Ziel:** Einheitliche, gut getaktete Kommunikation rund um den Aufenthalt — vom Klick auf „Buchen" bis zur Re-Engagement-Mail nach der Saison.

---

## Was bereits live ist

Diese Mails laufen bereits automatisch über den Stripe-Webhook bei Buchung:

| # | Mail | Empfänger | Trigger |
|---|---|---|---|
| 1 | **Buchungsbestätigung** | Bucher | Stripe `checkout.session.completed` |
| 2 | **Mietvertrag** | Bucher | wie 1 |
| 3 | **Kurtaxe-Hinweis** mit Portal-Link | Bucher | wie 1 |
| 4 | **Notification** | Manager (jonathan@stg-medien.com) | wie 1 |

Plus:
| Mail | Trigger |
|---|---|
| **Custom-Mail mit/ohne Zahlungslink** | Manager-Action im Buchungsdetail |
| **Kaution-Rückerstattung** | Cron, T+14 nach Abreise |

---

## Pre-Stay: Was noch fehlt

### Phase A — Vor dem Aufenthalt

| # | Mail | T- | Empfänger | Inhalt | Pflicht? |
|---|---|---|---|---|---|
| A1 | **Anzahlung erhalten — Vorfreude!** | sofort nach Buchung | Bucher | Zusatz zur Buchungsbestätigung: kurzer Inhalt zur Hütte, Vorfreude, Tipps was zu packen, wann nächste Mail kommt | nice-to-have |
| A2 | **Restzahlungs-Erinnerung** | T-30 | Bucher | "In 30 Tagen geht's los! Heute fällig: Restzahlung X €" + Stripe-Link für Restzahlung | **Pflicht** |
| A3 | **Mahnstufe 1** | T-14 (wenn A2 unbeantwortet) | Bucher | "Wir haben Eure Restzahlung noch nicht erhalten. Bitte bis T-7 begleichen, sonst wird die Buchung storniert." | **Pflicht** |
| A4 | **Anreise-Info-Paket** | T-7 | Bucher | Anreise-Adresse, ÖPNV-Anfahrt R28, Parken (Sommer/Winter), Hüttenwart-Telefon, was mitzubringen, Hausordnung-Link, Notfallnummern | **Pflicht** |
| A5 | **Erinnerung Werner-Anruf** | T-3 | Bucher | "Bitte bis 2 Tage vor Anreise dem Hüttenwart Eure Ankunftszeit melden — Werner Klauke 02758/2014822" | **Pflicht** |
| A6 | **Welcome / morgen geht's los** | T-1 | Bucher | "Morgen ist's soweit! Wetter-Hinweis (manuell vom Manager kuratiert oder via API), letzter Check, Notfall-Kontakt" | nice-to-have |

### Phase B — Während/nach dem Aufenthalt

| # | Mail | T+ | Empfänger | Inhalt | Pflicht? |
|---|---|---|---|---|---|
| B1 | **Anreise-Mail an Hüttenwart** | T-1 | Werner Klauke | Wer kommt morgen, Ankunftszeit, Sonderwünsche, Telefonnummer Bucher | **Pflicht** |
| B2 | **Bewertungsanfrage** | T+1 nach Abreise | Bucher | "Wie war's? Kurzes Feedback hilft" — drei Sterne-Buttons + Kommentarfeld | nice-to-have |
| B3 | **Kaution-Rückerstattung** | T+14 nach Abreise | Bucher | „300 € sind unterwegs zurück" — schon implementiert (Cron) | ✅ live |

### Phase C — Long-tail / Re-Engagement

| # | Mail | T+ | Empfänger | Inhalt | Pflicht? |
|---|---|---|---|---|---|
| C1 | **Saisonangebote im neuen Jahr** | Saisonstart | Stammgäste | "Habt Ihr schon einen Termin? Hier sind die Wochenenden 2027" | nice-to-have |
| C2 | **Newsletter / Blog-Update** | bei neuem Blogpost | Newsletter-Abonnenten | Teaser + Link | optional, später |

---

## Implementierungs-Vorschlag

### Architektur

Ein zweiter Cron `/api/cron/scheduled-mails` läuft täglich (z. B. 06:00 Europe/Berlin). Er prüft alle Buchungen und triggert die jeweiligen Mails basierend auf dem Datum-Versatz zur Anreise/Abreise.

Ein neues Feld `mailLog` (haben wir schon) verhindert Doppelversand: vor jeder Mail prüfen, ob für die jeweilige `template`-ID + `bookingId` bereits eine `sent`-Mail im Log liegt.

```ts
// Pseudo-code
const today = startOfDay(new Date());
for (const booking of upcomingBookings) {
  const daysUntilArrival = differenceInDays(booking.arrival, today);
  const daysSinceDeparture = differenceInDays(today, booking.departure);

  if (daysUntilArrival === 30) maybeSend("payment-reminder", booking);
  if (daysUntilArrival === 14) maybeSend("payment-overdue", booking);
  if (daysUntilArrival === 7)  maybeSend("arrival-info", booking);
  if (daysUntilArrival === 3)  maybeSend("call-huettenwart", booking);
  if (daysUntilArrival === 1)  {
    maybeSend("welcome-tomorrow", booking);
    maybeSendTo("huettenwart-arrival", booking, hutWardenEmail);
  }
  if (daysSinceDeparture === 1)  maybeSend("review-request", booking);
  // T+14 deposit refund läuft separat
}
```

### Aufwand

- 6–8 Mail-Templates (`@react-email/components`)
- 1 Cron-Endpoint mit `mailLog`-Idempotenz
- 1 Mail-Renderer-Helper, der Template + Daten zu HTML rendert
- ~3 Stunden Arbeit für Phase A komplett, ~1 Stunde für Phase B

### Nice-to-have-Erweiterungen

1. **Wetter-Snippet** in T-1-Mail — Open-Meteo API call ohne Account, free.
2. **Manager kann Mails pausieren** — Toggle pro Buchung im Manager-Backend, falls eine Buchung „individuell" behandelt wird.
3. **Manager-Override**: vor Versand der Mahnstufe (A3) intern eine Vorab-Notification an Manager, damit der Vorstand erst entscheiden kann, ob diese tatsächlich rausgehen soll.
4. **Mail-History pro Buchung** — Zeige im Buchungsdetail welche Mails an wen wann rausgingen (nutzt bestehende `email_log`-Tabelle).

---

## Reihenfolge der Implementierung

1. **A4 (Anreise-Info-Paket, T-7)** — höchster Mehrwert für den Gast, reduziert Manager-Anrufe
2. **B1 (Anreise-Mail an Hüttenwart, T-1)** — entlastet Werner, der Bucher informiert ihn ggf. trotzdem manuell
3. **A2 (Restzahlungs-Erinnerung, T-30)** — wirtschaftlich relevant
4. **A5 (Werner-Anruf-Erinnerung, T-3)** — kleine UX-Verbesserung
5. **A3 (Mahnstufe, T-14)** — Edge-Case, niedrige Frequenz
6. **A6 + B2** — nice-to-have

Sag Bescheid wann ich anfange.
