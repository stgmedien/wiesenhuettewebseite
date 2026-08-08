import { db } from "@/lib/db";
import { waitlistEntries, activityLog } from "@/lib/db/schema";
import { and, eq, gte, isNull, isNotNull, lt, lte, or } from "drizzle-orm";
import { isRangeAvailable } from "@/lib/availability";
import { sendMail } from "@/lib/mail/send";
import WaitlistSlotFreeEmail from "@/lib/mail/templates/waitlist-slot-free";
import { formatDateLong, toLocalIso } from "@/lib/utils";

// =============================================================
// Verfügbarkeits-Alarm (Warteliste)
//
// Gäste tragen sich für einen belegten Zeitraum ein (waitlist_entries).
// Wird eine überlappende Buchung storniert, prüft notifyWaitlistForRange()
// für jeden offenen Eintrag, ob SEIN Wunschzeitraum jetzt wirklich komplett
// frei ist — erst dann geht die "Frei geworden"-Mail raus (kein Spam bei
// Teil-Freigaben, die den Wunschzeitraum gar nicht öffnen).
// =============================================================

/** Wieviele Tage nach Versand der Benachrichtigung ein Eintrag aufbewahrt wird. */
const NOTIFIED_RETENTION_DAYS = 30;

/**
 * Nach einer Stornierung aufrufen (mit arrival/departure der STORNIERTEN
 * Buchung): findet alle noch nicht benachrichtigten Wartelisten-Einträge,
 * deren Wunschzeitraum mit dem freigewordenen überlappt, prüft je Eintrag
 * mit derselben Verfügbarkeits-Logik wie /buchen (isRangeAvailable, inkl.
 * Reinigungstage), ob der Wunschzeitraum jetzt komplett frei ist, und
 * verschickt dann die "Dein Wunschtermin ist frei"-Mail.
 *
 * Komplett best-effort: fängt ALLE Fehler intern ab und crasht den
 * Aufrufer (Storno-Action, Cron, Stripe-Webhook) nie.
 */
export const notifyWaitlistForRange = async (
  arrival: string,
  departure: string
): Promise<void> => {
  try {
    // Überlappung: Eintrag.arrival <= storniert.departure UND
    // Eintrag.departure >= storniert.arrival (inklusive Ränder — auch der
    // Abreisetag ist belegt, siehe availability.ts).
    const candidates = await db
      .select()
      .from(waitlistEntries)
      .where(
        and(
          isNull(waitlistEntries.notifiedAt),
          lte(waitlistEntries.arrival, departure),
          gte(waitlistEntries.departure, arrival)
        )
      );

    for (const entry of candidates) {
      try {
        // Dieselbe Quelle wie der öffentliche Buchungsflow: direkter
        // DB-Check inkl. Reinigungs-Puffer — NICHT der gecachte Kalender.
        const free = await isRangeAvailable({
          arrival: entry.arrival,
          departure: entry.departure,
        });
        if (!free) continue; // Wunschzeitraum weiterhin (teil-)belegt

        // Eintrag zuerst "claimen" (notifiedAt setzen, nur wenn noch NULL) —
        // schützt gegen Doppelversand bei parallel verarbeiteten Stornos.
        const claimed = await db
          .update(waitlistEntries)
          .set({ notifiedAt: new Date() })
          .where(
            and(eq(waitlistEntries.id, entry.id), isNull(waitlistEntries.notifiedAt))
          )
          .returning({ id: waitlistEntries.id });
        if (claimed.length === 0) continue; // schon von parallelem Lauf benachrichtigt

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";
        const bookingUrl =
          `${baseUrl}/buchen?arrival=${entry.arrival}&departure=${entry.departure}` +
          (entry.persons ? `&adults=${entry.persons}` : "");

        try {
          await sendMail({
            to: entry.email,
            subject: `Dein Wunschtermin ist frei geworden — ${formatDateLong(entry.arrival)} bis ${formatDateLong(entry.departure)}`,
            template: "waitlist-slot-free",
            react: WaitlistSlotFreeEmail({
              firstName: entry.firstName,
              arrival: formatDateLong(entry.arrival),
              departure: formatDateLong(entry.departure),
              persons: entry.persons,
              bookingUrl,
            }),
          });
        } catch (mailErr) {
          // Versand fehlgeschlagen → Claim zurücknehmen, damit ein späterer
          // Storno/Cron-Lauf es erneut versuchen kann.
          await db
            .update(waitlistEntries)
            .set({ notifiedAt: null })
            .where(eq(waitlistEntries.id, entry.id));
          throw mailErr;
        }

        await db.insert(activityLog).values({
          who: "System (Warteliste)",
          what: `Verfügbarkeits-Alarm: „Wunschtermin frei"-Mail an ${entry.email} (${entry.arrival} – ${entry.departure}${entry.persons ? `, ${entry.persons} Pers.` : ""}) nach Stornierung ${arrival} – ${departure}.`,
        });
      } catch (err) {
        // Einzelner Eintrag fehlgeschlagen → nächsten trotzdem versuchen.
        console.error(`[waitlist] Benachrichtigung für ${entry.email} fehlgeschlagen:`, err);
      }
    }
  } catch (err) {
    // Best-effort: die Warteliste darf einen Storno-Vorgang nie blockieren.
    console.error("[waitlist] notifyWaitlistForRange fehlgeschlagen:", err);
  }
};

/**
 * Aufräumen (täglicher Cron): löscht Einträge, deren Wunsch-Abreise in der
 * Vergangenheit liegt, sowie benachrichtigte Einträge älter als 30 Tage
 * (Datenschutz-Zusage aus dem Formular: "wird danach gelöscht").
 * Best-effort — liefert die Anzahl gelöschter Einträge (0 bei Fehler).
 */
export const purgeExpiredWaitlist = async (): Promise<number> => {
  try {
    const todayIso = toLocalIso(new Date());
    const notifiedCutoff = new Date(
      Date.now() - NOTIFIED_RETENTION_DAYS * 24 * 60 * 60 * 1000
    );
    const deleted = await db
      .delete(waitlistEntries)
      .where(
        or(
          lt(waitlistEntries.departure, todayIso),
          and(
            isNotNull(waitlistEntries.notifiedAt),
            lt(waitlistEntries.notifiedAt, notifiedCutoff)
          )
        )
      )
      .returning({ id: waitlistEntries.id });
    return deleted.length;
  } catch (err) {
    console.error("[waitlist] purgeExpiredWaitlist fehlgeschlagen:", err);
    return 0;
  }
};
