"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { projektAnfragen } from "@/lib/db/schema";

const schema = z.object({
  projektKey: z.string().min(1).max(60),
  projektNr: z.string().min(1).max(10),
  projektTitel: z.string().min(1).max(300),
  gruppe: z.string().min(2).max(200),
  kontaktName: z.string().min(2).max(200),
  kontaktEmail: z.string().email("Bitte eine gültige E-Mail-Adresse angeben.").max(320),
  kontaktTelefon: z.string().max(60).optional().or(z.literal("")),
  nachricht: z.string().max(2000).optional().or(z.literal("")),
});

export async function sendeProjektAnfrage(formData: FormData) {
  const parsed = schema.safeParse({
    projektKey: formData.get("projektKey"),
    projektNr: formData.get("projektNr"),
    projektTitel: formData.get("projektTitel"),
    gruppe: formData.get("gruppe"),
    kontaktName: formData.get("kontaktName"),
    kontaktEmail: formData.get("kontaktEmail"),
    kontaktTelefon: formData.get("kontaktTelefon"),
    nachricht: formData.get("nachricht"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const d = parsed.data;
  await db.insert(projektAnfragen).values({
    projektKey: d.projektKey,
    projektNr: d.projektNr,
    projektTitel: d.projektTitel,
    gruppe: d.gruppe,
    kontaktName: d.kontaktName,
    kontaktEmail: d.kontaktEmail,
    kontaktTelefon: d.kontaktTelefon || null,
    nachricht: d.nachricht || null,
  });
  return { ok: true as const };
}
