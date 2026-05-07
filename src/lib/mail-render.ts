/**
 * Pure render helpers — kein DB-Zugriff, kann in Client-Components importiert werden.
 */

/**
 * Globale Variable-Definitionen. Single Source of Truth — wird im Editor angezeigt
 * und beim Versand aus dem jeweiligen Buchungs-Kontext befuellt.
 *
 * Wenn Du eine neue Variable hinzufuegst:
 *   1. Hier eintragen (Name, Beschreibung, Beispielwert)
 *   2. In buildBookingVars() in /lib/mail-template-vars.ts den Wert aufloesen
 */
export type MailVariable = {
  name: string;
  description: string;
  example: string;
  group: "Kunde" | "Buchung" | "Zahlung" | "Sonstiges";
};

export const GLOBAL_MAIL_VARIABLES: MailVariable[] = [
  // Kunde
  { name: "firstName", description: "Vorname", example: "Maren", group: "Kunde" },
  { name: "lastName", description: "Nachname", example: "Holtkamp", group: "Kunde" },
  { name: "guestName", description: "Vor- + Nachname", example: "Maren Holtkamp", group: "Kunde" },
  { name: "email", description: "E-Mail-Adresse", example: "maren@example.com", group: "Kunde" },
  { name: "phone", description: "Telefon", example: "0521 12345", group: "Kunde" },
  { name: "salutation", description: "Anrede (Hallo Vorname,)", example: "Hallo Maren,", group: "Kunde" },

  // Buchung
  { name: "bookingNumber", description: "Buchungsnummer", example: "WH-2026-1042", group: "Buchung" },
  { name: "arrival", description: "Anreise (lang)", example: "Fr, 6. Februar 2026", group: "Buchung" },
  { name: "departure", description: "Abreise (lang)", example: "Mo, 9. Februar 2026", group: "Buchung" },
  { name: "arrivalShort", description: "Anreise (kurz)", example: "06.02.2026", group: "Buchung" },
  { name: "departureShort", description: "Abreise (kurz)", example: "09.02.2026", group: "Buchung" },
  { name: "nights", description: "Nächte", example: "3", group: "Buchung" },
  { name: "persons", description: "Personen-Anzahl", example: "12", group: "Buchung" },
  { name: "purpose", description: "Anlass", example: "Klassenfahrt", group: "Buchung" },
  { name: "bookingUrl", description: "Link zur Buchung im Konto", example: "https://www.wiesenhütte.com/konto/buchungen/abc", group: "Buchung" },

  // Zahlung
  { name: "totalAmount", description: "Gesamtbetrag (formatiert)", example: "1.420,00 €", group: "Zahlung" },
  { name: "paidAmount", description: "Bereits bezahlt", example: "710,00 €", group: "Zahlung" },
  { name: "remainderAmount", description: "Restbetrag", example: "710,00 €", group: "Zahlung" },
  { name: "depositAmount", description: "Kaution", example: "300,00 €", group: "Zahlung" },
  { name: "invoiceNumber", description: "Rechnungs-Nr (falls vorhanden)", example: "WH-2026-00042", group: "Zahlung" },

  // Sonstiges
  { name: "today", description: "Heutiges Datum", example: new Date().toLocaleDateString("de-DE"), group: "Sonstiges" },
  { name: "baseUrl", description: "Web-Adresse", example: "https://www.wiesenhütte.com", group: "Sonstiges" },
];

export const SAMPLE_VARIABLE_VALUES: Record<string, string> = Object.fromEntries(
  GLOBAL_MAIL_VARIABLES.map((v) => [v.name, v.example])
);

export const substituteVars = (
  template: string,
  vars: Record<string, string | number | undefined | null>
): string => {
  return template.replace(/\{\{([\w]+)\}\}/g, (_match, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
};

export const mdToHtml = (md: string): string => {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const blocks = md.replace(/\r\n/g, "\n").split(/\n\n+/);
  const out: string[] = [];

  for (const blockRaw of blocks) {
    const block = blockRaw.trim();
    if (!block) continue;

    const heading = block.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = inline(escapeHtml(heading[2]));
      out.push(
        `<h${level} style="font-family:Inter,sans-serif;color:#2F4A35;margin:16px 0 8px 0;font-weight:700;">${text}</h${level}>`
      );
      continue;
    }

    if (block.split("\n").every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = block
        .split("\n")
        .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
        .map((l) => `<li style="margin:4px 0;">${inline(escapeHtml(l))}</li>`)
        .join("");
      out.push(
        `<ul style="font-family:Inter,sans-serif;font-size:15px;line-height:1.5;padding-left:20px;margin:8px 0;">${items}</ul>`
      );
      continue;
    }

    if (/^>\s+/.test(block)) {
      const text = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join("\n");
      out.push(
        `<blockquote style="font-family:Inter,sans-serif;font-size:15px;line-height:1.55;border-left:4px solid #2F4A35;padding:8px 16px;margin:12px 0;background:#EFE6D8;color:#111;">${inline(escapeHtml(text))}</blockquote>`
      );
      continue;
    }

    const paragraph = block
      .split("\n")
      .map((l) => inline(escapeHtml(l)))
      .join("<br/>");
    out.push(
      `<p style="font-family:Inter,sans-serif;font-size:15px;line-height:1.55;margin:8px 0;color:#111;">${paragraph}</p>`
    );
  }

  return out.join("\n");

  function inline(s: string): string {
    return s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code style="background:#F7F7F2;padding:2px 6px;border-radius:4px;font-family:monospace;">$1</code>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" style="color:#2F4A35;text-decoration:underline;">$1</a>'
      )
      // Variable-Pills im Preview-Modus hervorheben (mit Beispiel-Werten)
      .replace(
        /\{\{(\w+)\}\}/g,
        '<span style="background:#EFE6D8;color:#2F4A35;padding:1px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;">{{$1}}</span>'
      );
  }
};

export const wrapEmailHtml = (inner: string, subject?: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  ${subject ? `<title>${subject}</title>` : ""}
</head>
<body style="background:#F7F7F2;padding:32px 0;margin:0;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:20px;box-shadow:0 4px 14px rgba(17,17,17,0.05);">
    <p style="font-family:Inter,sans-serif;font-size:11px;color:#2F4A35;letter-spacing:0.16em;text-transform:uppercase;margin:0 0 12px;font-weight:600;">
      Wiesenhütte
    </p>
    ${inner}
    <hr style="border:0;border-top:1px solid #C8CEC4;margin:28px 0 12px;"/>
    <p style="font-family:Inter,sans-serif;font-size:11px;color:#5b5b56;margin:0;">
      Skifreunde Gütersloh e.V. · hello@wiesenhütte.com · www.wiesenhütte.com
    </p>
  </div>
</body>
</html>`;
