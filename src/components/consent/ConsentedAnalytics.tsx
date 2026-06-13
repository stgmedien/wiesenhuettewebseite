"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useConsentFor } from "./ConsentContext";

/**
 * Laedt Vercel Web Analytics + Speed Insights NUR, wenn der Besucher der
 * Statistik-Kategorie zugestimmt hat. Beide Tools sind cookielos und erfassen
 * keine personenbezogenen Daten — wir gaten sie trotzdem hinter den Consent,
 * passend zur granularen Cookie-Banner-Architektur (DSGVO/TTDSG-konform).
 *
 * Solange kein Consent vorliegt, wird nichts gerendert; `track()`-Aufrufe im
 * Funnel sind dann stille No-Ops.
 */
export const ConsentedAnalytics = () => {
  const analyticsAllowed = useConsentFor("analytics");
  if (!analyticsAllowed) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
};
