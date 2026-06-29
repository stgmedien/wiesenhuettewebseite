/**
 * Brevo-Anbindung (vormals Sendinblue) — Newsletter & Mitgliederliste.
 *
 * Bewusst ohne SDK: ein einziger REST-Call je Funktion über fetch, damit
 * keine zusätzliche Dependency nötig ist. Alle Funktionen sind „best effort":
 * Ist Brevo nicht konfiguriert oder antwortet die API mit einem Fehler,
 * wird geloggt und ein Ergebnis-Objekt zurückgegeben — der aufrufende Flow
 * (Mitglieds-Webhook, Buchung) darf dadurch NIE brechen.
 */

const BASE = "https://api.brevo.com/v3";

const apiKey = () => process.env.BREVO_API_KEY ?? "";
const newsletterListId = () => Number(process.env.BREVO_NEWSLETTER_LIST_ID ?? "0");
const membersListId = () => Number(process.env.BREVO_MEMBERS_LIST_ID ?? "0");
// Mitglieder-Newsletter (versteckte Seite). Default = Brevo-Liste 12
// ("Mitglieder-Newsletter", Ordner 3). Per BREVO_MEMBER_NEWSLETTER_LIST_ID
// überschreibbar, falls sich die Liste mal ändert.
const memberNewsletterListId = () => Number(process.env.BREVO_MEMBER_NEWSLETTER_LIST_ID ?? "12");
const doiTemplateId = () => Number(process.env.BREVO_DOI_TEMPLATE_ID ?? "0");

export const brevoConfigured = () => apiKey().length > 0;

type BrevoResult = { ok: boolean; reason?: string };

async function brevoFetch(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "api-key": apiKey(),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
    // Brevo soll den Request nicht ewig offen halten.
    signal: AbortSignal.timeout(10_000),
  });
}

async function brevoGet(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: "GET",
    headers: {
      "api-key": apiKey(),
      accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });
}

/**
 * Öffentliche Newsletter-Anmeldung mit Double-Opt-in über Brevo.
 * Brevo verschickt die Bestätigungsmail (DOI-Template) und trägt den Kontakt
 * erst NACH dem Bestätigungsklick in die Newsletter-Liste ein; danach
 * leitet Brevo auf `redirectionUrl` weiter.
 */
export async function subscribeNewsletterDoi(
  email: string,
  opts: { firstName?: string | null; redirectionUrl: string; listId?: number } = {
    redirectionUrl: "",
  }
): Promise<BrevoResult> {
  // Ziel-Liste: explizit übergeben (z. B. Mitglieder-Newsletter) oder die
  // öffentliche Newsletter-Liste als Default.
  const targetList = opts.listId && opts.listId > 0 ? opts.listId : newsletterListId();
  if (!brevoConfigured() || !targetList || !doiTemplateId()) {
    console.warn("[brevo] Newsletter nicht konfiguriert (API-Key/Listen-ID/DOI-Template fehlt)");
    return { ok: false, reason: "not_configured" };
  }
  try {
    const res = await brevoFetch("/contacts/doubleOptinConfirmation", {
      email,
      includeListIds: [targetList],
      templateId: doiTemplateId(),
      redirectionUrl: opts.redirectionUrl,
      ...(opts.firstName ? { attributes: { VORNAME: opts.firstName, FIRSTNAME: opts.firstName } } : {}),
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    console.error(`[brevo] DOI-Anmeldung fehlgeschlagen (${res.status}): ${text}`);
    return { ok: false, reason: `http_${res.status}` };
  } catch (e) {
    console.error("[brevo] DOI-Anmeldung Ausnahme:", e);
    return { ok: false, reason: "exception" };
  }
}

/**
 * Anmeldung zum (versteckten) MITGLIEDER-Newsletter — Double-Opt-in in die
 * separate Brevo-Liste (BREVO_MEMBER_NEWSLETTER_LIST_ID). Nur über den
 * direkten Link der versteckten Seite erreichbar.
 */
export async function subscribeMemberNewsletterDoi(
  email: string,
  opts: { firstName?: string | null; redirectionUrl: string } = { redirectionUrl: "" }
): Promise<BrevoResult> {
  return subscribeNewsletterDoi(email, { ...opts, listId: memberNewsletterListId() });
}

/**
 * Mitglied automatisch in die Brevo-Mitgliederliste aufnehmen.
 * Single-Opt-in ist hier korrekt: Der/die Beigetretene hat aktiv (und
 * kostenpflichtig) die Mitgliedschaft abgeschlossen — die Aufnahme in die
 * Mitglieder-Kommunikationsliste ist Teil dieses Verhältnisses.
 * `updateEnabled: true` aktualisiert bestehende Kontakte, statt zu failen.
 */
export async function addContactToMembersList(
  email: string,
  attrs: { firstName?: string | null; lastName?: string | null } = {}
): Promise<BrevoResult> {
  if (!brevoConfigured() || !membersListId()) {
    console.warn("[brevo] Mitgliederliste nicht konfiguriert (API-Key/Listen-ID fehlt)");
    return { ok: false, reason: "not_configured" };
  }
  try {
    const attributes: Record<string, string> = {};
    if (attrs.firstName) {
      attributes.VORNAME = attrs.firstName;
      attributes.FIRSTNAME = attrs.firstName;
    }
    if (attrs.lastName) {
      attributes.NACHNAME = attrs.lastName;
      attributes.LASTNAME = attrs.lastName;
    }
    const res = await brevoFetch("/contacts", {
      email,
      updateEnabled: true,
      listIds: [membersListId()],
      ...(Object.keys(attributes).length ? { attributes } : {}),
    });
    // 201 = neu angelegt, 204 = aktualisiert.
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    console.error(`[brevo] Mitglieder-Eintrag fehlgeschlagen (${res.status}): ${text}`);
    return { ok: false, reason: `http_${res.status}` };
  } catch (e) {
    console.error("[brevo] Mitglieder-Eintrag Ausnahme:", e);
    return { ok: false, reason: "exception" };
  }
}

export type BrevoMemberLookup =
  | { ok: true; isMember: boolean; firstName?: string | null; lastName?: string | null }
  | { ok: false; reason: string };

/**
 * Schlägt nach, ob eine E-Mail als Kontakt in der Brevo-MITGLIEDERLISTE steht.
 * Quelle der Wahrheit für „ist Vereinsmitglied" — wird vom Konto-Freischalt-Flow
 * (`/mitglied-konto`) genutzt, um bestehende Mitglieder ohne Vorstands-Eingriff
 * automatisch (aber per E-Mail-Bestätigung gesichert) freizuschalten.
 *
 * Gibt `ok:false` zurück, wenn Brevo nicht konfiguriert ist oder die API einen
 * Fehler liefert — der Aufrufer darf eine Mitgliedschaft dann NICHT bestätigen.
 */
export async function isEmailInMembersList(email: string): Promise<BrevoMemberLookup> {
  if (!brevoConfigured() || !membersListId()) {
    console.warn("[brevo] Mitglieder-Lookup nicht konfiguriert (API-Key/Listen-ID fehlt)");
    return { ok: false, reason: "not_configured" };
  }
  try {
    const res = await brevoGet(`/contacts/${encodeURIComponent(email)}`);
    // Kontakt existiert gar nicht → definitiv kein Mitglied.
    if (res.status === 404) return { ok: true, isMember: false };
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[brevo] Mitglieder-Lookup fehlgeschlagen (${res.status}): ${text}`);
      return { ok: false, reason: `http_${res.status}` };
    }
    const data = (await res.json()) as {
      listIds?: number[];
      attributes?: Record<string, string>;
    };
    const listIds = Array.isArray(data.listIds) ? data.listIds : [];
    const isMember = listIds.includes(membersListId());
    const attrs = data.attributes ?? {};
    return {
      ok: true,
      isMember,
      firstName: attrs.VORNAME ?? attrs.FIRSTNAME ?? null,
      lastName: attrs.NACHNAME ?? attrs.LASTNAME ?? null,
    };
  } catch (e) {
    console.error("[brevo] Mitglieder-Lookup Ausnahme:", e);
    return { ok: false, reason: "exception" };
  }
}
