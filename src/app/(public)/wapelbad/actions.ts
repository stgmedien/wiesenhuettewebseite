"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendMail } from "@/lib/mail/send";
import WapelbadInternalEmail from "@/lib/mail/templates/wapelbad-internal";
import WapelbadConfirmEmail from "@/lib/mail/templates/wapelbad-confirm";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTERNAL_TO = process.env.MAIL_INTERNAL_TO ?? "skifreunde@wiesenhuette.de";

// Best-effort In-Memory-Throttle pro IP. Serverless: gilt je Instanz und wird
// beim Cold Start zurückgesetzt — bremst aber Bursts, und der Honeypot fängt
// die meisten Bots ohnehin ab. (Bewusst ohne DB-Tabelle für ein Vereinsfest.)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 4;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

/**
 * Anmeldung zum Wapelbad-Vereinsfest. Bewusst mailbasiert (keine DB-Tabelle):
 * Jede Anmeldung geht als strukturierte Mail an den Vorstand — so liegen alle
 * Daten inkl. E-Mail (für eine evtl. wetterbedingte Absage) zusammen. Die
 * anmeldende Person erhält eine Bestätigung.
 */
export async function submitWapelbad(formData: FormData) {
  // Honeypot: für Menschen unsichtbar, Bots füllen es aus. Stilles OK.
  if (String(formData.get("website") ?? "").trim() !== "") {
    redirect("/wapelbad?status=ok");
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const grill = formData.get("grill") === "on";
  const personsRaw = parseInt(String(formData.get("persons") ?? "1"), 10);
  const persons = Number.isFinite(personsRaw)
    ? Math.min(50, Math.max(1, personsRaw))
    : 1;

  if (!name || !EMAIL_RE.test(email) || email.length > 255) {
    redirect("/wapelbad?status=fehler");
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    // Still als Erfolg quittieren — keine Auskunft über die Drosselung.
    redirect("/wapelbad?status=ok");
  }

  // Interne Benachrichtigung an den Vorstand (entscheidend).
  let internalOk = true;
  try {
    await sendMail({
      to: INTERNAL_TO,
      subject: `Wapelbad-Anmeldung: ${name} (${persons} ${persons === 1 ? "Person" : "Personen"}${grill ? ", Grillbuffet" : ""})`,
      template: "wapelbad-internal",
      replyTo: email,
      react: WapelbadInternalEmail({ name, email, persons, grill }),
    });
  } catch (e) {
    console.error("[wapelbad] internal mail failed", e);
    internalOk = false;
  }

  // Bestätigung an die anmeldende Person (best effort — blockiert nicht).
  try {
    await sendMail({
      to: email,
      subject: "Deine Anmeldung zum Wapelbad ist da",
      template: "wapelbad-confirm",
      replyTo: "skifreunde@wiesenhuette.de",
      react: WapelbadConfirmEmail({ name, persons, grill }),
    });
  } catch (e) {
    console.error("[wapelbad] confirm mail failed", e);
  }

  redirect(internalOk ? "/wapelbad?status=ok" : "/wapelbad?status=mailfehler");
}
