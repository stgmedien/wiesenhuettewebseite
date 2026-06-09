/**
 * iCalendar-Export (RFC 5545) für den Belegungskalender der Wiesenhütte.
 *
 * Wird unter /api/ical/<token> ausgeliefert und z. B. von gruppenhaus.de
 * importiert, damit dort dieselben Tage als belegt erscheinen wie auf
 * wiesenhütte.com (Buchungen + Reinigungstage + Sperrzeiten/Wartung).
 *
 * Bewusst ohne Gästedaten — der Feed zeigt nur, WANN belegt ist, nicht WER.
 * Keine externe Dependency.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO YYYY-MM-DD → iCal-DATE (YYYYMMDD). */
const isoToIcalDate = (iso: string): string => iso.replace(/-/g, "");

/** ISO YYYY-MM-DD + n Tage → ISO (UTC-sicher). */
const addDaysIso = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Bereich belegter Tage; endExclusive = letzter belegter Tag + 1 (iCal-Ganztags-DTEND). */
export type BlockRange = { start: string; endExclusive: string };

/**
 * Fasst eine Menge belegter Einzeltage zu zusammenhängenden Bereichen zusammen.
 * Beispiel: {08., 09., 10., 14.} → [{08.→11.}, {14.→15.}].
 */
export const coalesceDaysToRanges = (days: Iterable<string>): BlockRange[] => {
  const sorted = Array.from(new Set(days)).sort();
  const ranges: BlockRange[] = [];
  let start: string | null = null;
  let prev: string | null = null;
  for (const day of sorted) {
    if (start === null) {
      start = day;
      prev = day;
      continue;
    }
    if (day === addDaysIso(prev as string, 1)) {
      prev = day;
    } else {
      ranges.push({ start, endExclusive: addDaysIso(prev as string, 1) });
      start = day;
      prev = day;
    }
  }
  if (start !== null) {
    ranges.push({ start, endExclusive: addDaysIso(prev as string, 1) });
  }
  return ranges;
};

/** RFC-5545-Text-Escaping. */
const escapeText = (s: string): string =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

/** Faltet Zeilen > 75 Zeichen gemäß RFC 5545 (Folding mit führendem Space). */
const foldLine = (line: string): string => {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
};

/** UTC-Zeitstempel im iCal-Format (YYYYMMDDTHHMMSSZ). */
const icalStamp = (d: Date): string =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

export type BuildIcsOptions = {
  ranges: BlockRange[];
  now: Date;
  calName?: string;
  summary?: string;
};

/** Baut ein vollständiges VCALENDAR-Dokument (CRLF-getrennt). */
export const buildBelegungIcs = ({
  ranges,
  now,
  calName = "Wiesenhütte – Belegung",
  summary = "Belegt",
}: BuildIcsOptions): string => {
  const dtstamp = icalStamp(now);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wiesenhuette//Belegungskalender//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(calName)}`),
    "X-WR-TIMEZONE:Europe/Berlin",
  ];
  for (const r of ranges) {
    const startD = isoToIcalDate(r.start);
    const endD = isoToIcalDate(r.endExclusive);
    lines.push(
      "BEGIN:VEVENT",
      `UID:wh-${startD}-${endD}@wiesenhuette.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${startD}`,
      `DTEND;VALUE=DATE:${endD}`,
      foldLine(`SUMMARY:${escapeText(summary)}`),
      "TRANSP:OPAQUE",
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
};
