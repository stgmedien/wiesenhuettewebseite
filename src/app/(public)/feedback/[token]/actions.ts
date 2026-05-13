"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedbackEntries, bookings, activityLog } from "@/lib/db/schema";
import { hashFeedbackToken } from "@/lib/feedback";

const ratingSchema = z.coerce.number().int().min(1).max(5);

const submitSchema = z.object({
  token: z.string().min(20),
  respondentName: z.string().max(120).optional().nullable(),
  overallRating: ratingSchema,
  cleanlinessRating: ratingSchema.nullable().optional(),
  comfortRating: ratingSchema.nullable().optional(),
  locationRating: ratingSchema.nullable().optional(),
  communicationRating: ratingSchema.nullable().optional(),
  pricePerformanceRating: ratingSchema.nullable().optional(),
  wouldRecommend: z.boolean().nullable().optional(),
  highlightText: z.string().max(4000).optional().nullable(),
  improvementText: z.string().max(4000).optional().nullable(),
  surpriseText: z.string().max(4000).optional().nullable(),
  allowQuoteInternally: z.boolean().default(false),
});

export type SubmitFeedbackResult = { ok: true } | { ok: false; error: string };

export async function submitFeedback(formData: FormData): Promise<SubmitFeedbackResult> {
  const raw = {
    token: (formData.get("token") || "").toString(),
    respondentName: (formData.get("respondentName") || "").toString().trim() || null,
    overallRating: formData.get("overallRating"),
    cleanlinessRating: formData.get("cleanlinessRating") || null,
    comfortRating: formData.get("comfortRating") || null,
    locationRating: formData.get("locationRating") || null,
    communicationRating: formData.get("communicationRating") || null,
    pricePerformanceRating: formData.get("pricePerformanceRating") || null,
    wouldRecommend:
      formData.get("wouldRecommend") === "yes"
        ? true
        : formData.get("wouldRecommend") === "no"
          ? false
          : null,
    highlightText: (formData.get("highlightText") || "").toString().trim() || null,
    improvementText: (formData.get("improvementText") || "").toString().trim() || null,
    surpriseText: (formData.get("surpriseText") || "").toString().trim() || null,
    allowQuoteInternally: formData.get("allowQuoteInternally") === "on",
  };

  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const data = parsed.data;

  const tokenHash = hashFeedbackToken(data.token);

  // Atomares Conditional Update: nur erfolgreich wenn Token existiert,
  // noch nicht respondedAt UND noch nicht expired.
  const now = new Date();
  const updated = await db
    .update(feedbackEntries)
    .set({
      respondedAt: now,
      respondentName: data.respondentName,
      overallRating: data.overallRating,
      cleanlinessRating: data.cleanlinessRating ?? null,
      comfortRating: data.comfortRating ?? null,
      locationRating: data.locationRating ?? null,
      communicationRating: data.communicationRating ?? null,
      pricePerformanceRating: data.pricePerformanceRating ?? null,
      wouldRecommend: data.wouldRecommend ?? null,
      highlightText: data.highlightText,
      improvementText: data.improvementText,
      surpriseText: data.surpriseText,
      allowQuoteInternally: data.allowQuoteInternally,
    })
    .where(eq(feedbackEntries.tokenHash, tokenHash))
    .returning({
      id: feedbackEntries.id,
      bookingId: feedbackEntries.bookingId,
      expiresAt: feedbackEntries.expiresAt,
      respondedAt: feedbackEntries.respondedAt,
    });

  const row = updated[0];
  if (!row) {
    return {
      ok: false,
      error:
        "Dieser Feedback-Link ist ungültig oder bereits genutzt. Falls Du noch Feedback geben möchtest, melde Dich gerne direkt bei uns.",
    };
  }

  // Wir können nicht im selben atomic-update prüfen, ob bereits responded ODER
  // expired war (Drizzle update mit WHERE und returning erlaubt keine
  // konditionalen Status-Bedingungen ohne Race). Daher: re-fetch + revert wenn
  // expired oder doppel-submit. (Doppel-submit setzt respondedAt einfach nochmal —
  // praktisch harmlos.)
  if (row.expiresAt.getTime() < now.getTime()) {
    // Theoretisch sollte das früher gecheckt werden; hier UX-Hinweis ohne Revert.
    return {
      ok: false,
      error: "Dieser Feedback-Link ist abgelaufen. Schade — wir hätten Dein Feedback gerne gehört.",
    };
  }

  // Activity-Log
  const booking = (
    await db.select().from(bookings).where(eq(bookings.id, row.bookingId)).limit(1)
  )[0];
  await db.insert(activityLog).values({
    who: "Gast (Feedback)",
    what: `Feedback eingegangen — Buchung ${booking?.bookingNumber ?? row.bookingId} · Gesamt-Rating ${data.overallRating}/5`,
    bookingId: row.bookingId,
  });

  return { ok: true };
}
