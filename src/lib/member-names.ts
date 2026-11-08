import { z } from "zod";

// Vereinsmitglieder in der Gruppe (Vorstandswunsch 11/2026): Alle buchen
// gleich (Erwachsene/Kinder), erst am Ende tragen Buchende die Namen der
// Mitglieder ein. Jeder Name verschiebt eine Person in den Mitgliedstarif
// (−50 %): "adult" → persons.members, "child" → persons.pupils.
// Rabatt gilt sofort nach Ehrlichkeitsbestätigung; Dana gleicht die Namen
// im Manager ab (gepinnte Buchungsnotiz). Falschangaben ⇒ Storno-Recht.

export type MemberNameKind = "adult" | "child";
export type MemberName = { name: string; kind: MemberNameKind };

export const memberNamesSchema = z
  .array(
    z.object({
      name: z.string().trim().min(3).max(120),
      kind: z.enum(["adult", "child"]),
    })
  )
  .max(40)
  .default([]);

/** Vor- und Nachname: mindestens zwei Wörter. */
export function isFullName(name: string): boolean {
  return name.trim().split(/\s+/).filter(Boolean).length >= 2;
}

export function countMemberKinds(names: MemberName[]) {
  return {
    adults: names.filter((n) => n.kind === "adult").length,
    children: names.filter((n) => n.kind === "child").length,
  };
}

/**
 * Prüft serverseitig, dass die Mitgliedstarif-Personen exakt den
 * eingetragenen Namen entsprechen. Gibt null zurück, wenn alles stimmt,
 * sonst einen Fehler-Key.
 */
export function checkMemberNames(
  persons: { members: number; pupils: number },
  names: MemberName[],
  confirmed: boolean,
  bookerIsMember = false
): null | "mismatch" | "invalidName" | "duplicate" | "notConfirmed" {
  const { adults, children } = countMemberKinds(names);
  if (persons.members !== adults || persons.pupils !== children) return "mismatch";
  if (names.some((n) => !isFullName(n.name))) return "invalidName";
  const keys = names.map((n) => n.name.trim().toLowerCase().replace(/\s+/g, " "));
  if (new Set(keys).size !== keys.length) return "duplicate";
  if ((names.length > 0 || bookerIsMember) && !confirmed) return "notConfirmed";
  return null;
}

/**
 * Text der gepinnten Manager-Notiz für Dana. `bookerMemberName` gesetzt =
 * Bucher/in hat angegeben, Vereinsmitglied zu sein (kein Mindestbelegungs-
 * Aufschlag) — ebenfalls zu prüfen.
 */
export function memberNamesNoteBody(names: MemberName[], bookerMemberName?: string | null): string {
  const parts: string[] = [];
  if (bookerMemberName) {
    parts.push(
      `Bucher/in ist laut Angabe Vereinsmitglied: ${bookerMemberName.trim()} — dadurch kein Mindestbelegungs-Aufschlag. Bitte Mitgliedschaft prüfen.`
    );
  }
  if (names.length > 0) {
    if (parts.length) parts.push("");
    parts.push(
      `Mitgliedstarif (−50 %) für ${names.length} Person${names.length === 1 ? "" : "en"} — bitte Mitgliedschaft prüfen:`,
      ...names.map(
        (n, i) => `${i + 1}. ${n.name.trim()} (${n.kind === "adult" ? "Erwachsene/r" : "Kind unter 16"})`
      )
    );
  }
  return parts.join("\n");
}
