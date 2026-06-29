"use client";

import { useState } from "react";
import { CheckCircle2, Mail, SearchX } from "lucide-react";
import { claimMembershipAction, type ClaimResult } from "./actions";
import type { Locale } from "@/lib/i18n-shared";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; res: ClaimResult; email: string };

const COPY: Record<
  Locale,
  {
    emailLabel: string;
    emailPh: string;
    cta: string;
    loading: string;
    sentTitle: string;
    sentBody: (email: string) => string;
    notTitle: string;
    notBody: (email: string) => string;
    joinCta: string;
    contactCta: string;
    retry: string;
    invalid: string;
  }
> = {
  de: {
    emailLabel: "Deine E-Mail-Adresse (wie im Verein hinterlegt)",
    emailPh: "name@beispiel.de",
    cta: "Konto freischalten",
    loading: "Wird geprüft …",
    sentTitle: "Fast geschafft!",
    sentBody: (email) =>
      `Wir haben Dir einen Login-Link an ${email} geschickt. Klick darauf — dann ist Dein Mitglieds-Konto sofort aktiv und Du buchst zum halben Preis.`,
    notTitle: "Wir konnten Dich nicht finden.",
    notBody: (email) =>
      `${email} steht (noch) nicht in unserer Mitgliederliste. Bist Du sicher Mitglied? Dann schreib uns kurz. Oder werde direkt online Mitglied — ab 15 €/Jahr, sofort 50 % auf Übernachtungen.`,
    joinCta: "Jetzt Mitglied werden",
    contactCta: "Kontakt aufnehmen",
    retry: "Andere E-Mail probieren",
    invalid: "Bitte eine gültige E-Mail-Adresse eingeben.",
  },
  en: {
    emailLabel: "Your email address (as registered with the club)",
    emailPh: "name@example.com",
    cta: "Unlock account",
    loading: "Checking …",
    sentTitle: "Almost there!",
    sentBody: (email) =>
      `We've sent a login link to ${email}. Click it — your member account is then active right away and you book at half price.`,
    notTitle: "We couldn't find you.",
    notBody: (email) =>
      `${email} isn't (yet) in our member list. Sure you're a member? Drop us a line. Or join online — from €15/year, instantly 50% off overnight stays.`,
    joinCta: "Become a member",
    contactCta: "Get in touch",
    retry: "Try another email",
    invalid: "Please enter a valid email address.",
  },
  nl: {
    emailLabel: "Je e-mailadres (zoals bij de vereniging bekend)",
    emailPh: "naam@voorbeeld.nl",
    cta: "Account vrijschakelen",
    loading: "Bezig met controleren …",
    sentTitle: "Bijna klaar!",
    sentBody: (email) =>
      `We hebben een login-link naar ${email} gestuurd. Klik erop — je lidmaatschapsaccount is dan meteen actief en je boekt voor de halve prijs.`,
    notTitle: "We konden je niet vinden.",
    notBody: (email) =>
      `${email} staat (nog) niet in onze ledenlijst. Zeker dat je lid bent? Stuur ons een bericht. Of word direct online lid — vanaf €15/jaar, meteen 50% op overnachtingen.`,
    joinCta: "Nu lid worden",
    contactCta: "Contact opnemen",
    retry: "Ander e-mailadres proberen",
    invalid: "Voer een geldig e-mailadres in.",
  },
};

export function ClaimForm({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = ((fd.get("email") as string) ?? "").trim();
    setState({ kind: "loading" });
    const res = await claimMembershipAction(fd);
    setState({ kind: "done", res, email });
  }

  // Erfolg: Link gesendet
  if (state.kind === "done" && state.res.ok && state.res.status === "link_sent") {
    return (
      <div
        className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 p-5"
        role="status"
      >
        <CheckCircle2 size={22} className="text-[var(--color-wh-green)] shrink-0 mt-0.5" aria-hidden />
        <div className="text-[var(--color-wh-deep-green)]">
          <div className="font-semibold">{c.sentTitle}</div>
          <div className="text-sm mt-0.5">{state.res.ok && state.kind === "done" ? c.sentBody(state.email) : ""}</div>
        </div>
      </div>
    );
  }

  // Nicht in der Mitgliederliste
  if (state.kind === "done" && state.res.ok && state.res.status === "not_member") {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-wh-winter-grey)] bg-white p-5">
        <div className="flex items-start gap-3">
          <SearchX size={22} className="text-[var(--color-wh-wood)] shrink-0 mt-0.5" aria-hidden />
          <div>
            <div className="font-semibold text-[var(--color-wh-deep-green)]">{c.notTitle}</div>
            <div className="text-sm mt-0.5 text-[var(--color-wh-black)]/80">{c.notBody(state.email)}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href="/mitglied-werden"
            className="inline-flex items-center justify-center h-11 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold no-underline hover:bg-[var(--color-wh-green)] transition-colors"
          >
            {c.joinCta} →
          </a>
          <a
            href="/kontakt"
            className="inline-flex items-center justify-center h-11 px-5 rounded-[var(--radius-btn)] border border-[var(--color-wh-deep-green)]/30 text-[var(--color-wh-deep-green)] text-sm font-semibold no-underline hover:border-[var(--color-wh-deep-green)] transition-colors"
          >
            {c.contactCta}
          </a>
          <button
            type="button"
            onClick={() => setState({ kind: "idle" })}
            className="inline-flex items-center justify-center h-11 px-4 text-sm text-[var(--color-wh-black)]/60 hover:text-[var(--color-wh-deep-green)] cursor-pointer"
          >
            {c.retry}
          </button>
        </div>
      </div>
    );
  }

  const loading = state.kind === "loading";
  const errorMsg = state.kind === "done" && !state.res.ok ? state.res.error : null;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1.5">
          {c.emailLabel}
        </span>
        <input
          type="email"
          name="email"
          required
          placeholder={c.emailPh}
          autoComplete="email"
          className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2.5 focus:border-[var(--color-wh-deep-green)] focus:outline-none"
        />
      </label>

      {errorMsg && (
        <p role="alert" className="text-[13px] text-[#7a3a20]">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
      >
        <Mail size={16} aria-hidden />
        {loading ? c.loading : c.cta}
      </button>
    </form>
  );
}
