/**
 * Sehr leichter CSV-Parser für Manager-Imports.
 * Unterstützt: Komma als Trenner, "..." Quoting (inkl. eskapierter "" innerhalb),
 * UTF-8 BOM auto-strippen, CRLF + LF + CR Zeilenenden.
 *
 * Erste Zeile = Header. Gibt Array von Records (key→value) zurück.
 */

export type CsvParseResult = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCsv(input: string): CsvParseResult {
  // UTF-8 BOM strippen
  let txt = input.startsWith("﻿") ? input.slice(1) : input;
  // Normalize Zeilen-Enden auf \n
  txt = txt.replace(/\r\n?/g, "\n");

  const records: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < txt.length) {
    const c = txt[i];
    if (inQuotes) {
      if (c === '"') {
        if (txt[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
    } else {
      if (c === '"' && field === "") {
        inQuotes = true;
        i++;
      } else if (c === ",") {
        cur.push(field);
        field = "";
        i++;
      } else if (c === "\n") {
        cur.push(field);
        records.push(cur);
        cur = [];
        field = "";
        i++;
      } else {
        field += c;
        i++;
      }
    }
  }
  // Letztes Feld + letzte Zeile (falls Datei ohne Trailing-Newline endet)
  if (field !== "" || cur.length > 0) {
    cur.push(field);
    records.push(cur);
  }

  // Header + Body trennen
  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map((h) => h.trim().toLowerCase());
  const rows = records
    .slice(1)
    .filter((r) => r.some((cell) => cell.trim().length > 0))
    .map((r) => {
      const rec: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rec[h] = (r[idx] ?? "").trim();
      });
      return rec;
    });

  return { headers, rows };
}
