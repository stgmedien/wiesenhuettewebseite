import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "./SignupForm";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

const PAGE_COPY: Record<Locale, {
  eyebrow: string;
  h1: string;
  lead: string;
  claimTitle: string;
  claimBody: string;
  claimCta: string;
}> = {
  de: {
    eyebrow: "Wiesenhütte · Registrierung",
    h1: "Konto anlegen.",
    lead: "Mit einem Konto siehst Du Deine Buchungen, Anfragen und kannst Folgebuchungen schneller abschließen. Bist Du schon Vereinsmitglied, kannst Du das unten angeben — wir schalten Dich nach kurzer Prüfung frei.",
    claimTitle: "Schon Vereinsmitglied?",
    claimBody: "Kein neues Konto nötig — E-Mail eingeben, sofort freischalten und zum halben Preis buchen.",
    claimCta: "Konto freischalten",
  },
  en: {
    eyebrow: "Wiesenhütte · Sign up",
    h1: "Create an account.",
    lead: "With an account you can see your bookings, enquiries and complete follow-up bookings faster. If you're already a club member, you can tell us below — we'll unlock you after a quick check.",
    claimTitle: "Already a club member?",
    claimBody: "No new account needed — enter your email, unlock instantly and book at half price.",
    claimCta: "Unlock account",
  },
  nl: {
    eyebrow: "Wiesenhütte · Registreren",
    h1: "Account aanmaken.",
    lead: "Met een account zie je je boekingen en aanvragen, en kun je vervolgboekingen sneller afronden. Ben je al verenigingslid, dan kun je dat hieronder aangeven — we schakelen je na een korte controle vrij.",
    claimTitle: "Al verenigingslid?",
    claimBody: "Geen nieuw account nodig — e-mail invoeren, meteen vrijschakelen en voor de halve prijs boeken.",
    claimCta: "Account vrijschakelen",
  },
};

export const metadata = { title: "Konto anlegen · Wiesenhütte" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/konto");
  const locale = await getServerLocale();
  const pc = PAGE_COPY[locale];

  return (
    <div className="container max-w-md mx-auto px-6 py-16">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        {pc.eyebrow}
      </p>
      <h1 className="font-heading text-4xl text-[var(--color-wh-deep-green)] mb-3">
        {pc.h1}
      </h1>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-6">
        {pc.lead}
      </p>
      {/* Bestandsmitglieder: sofortige Freischaltung per Brevo-Abgleich —
          schneller als das Nachweis-Feld unten (keine manuelle Prüfung).
          (Mitglied-WERDEN-CTA bewusst nicht hier — Mitgliedschaft unter /verein.) */}
      <a
        href="/mitglied-konto"
        className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-wh-deep-green)] px-4 py-3 mb-8 no-underline hover:bg-[var(--color-wh-green)] transition-colors"
      >
        <span>
          <span className="block font-semibold text-sm text-[var(--color-wh-snow)]">
            {pc.claimTitle}
          </span>
          <span className="block text-xs text-[var(--color-wh-snow)]/85 mt-0.5">
            {pc.claimBody}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-[var(--color-wh-snow)]">
          {pc.claimCta} →
        </span>
      </a>
      <SignupForm locale={locale} />
    </div>
  );
}
