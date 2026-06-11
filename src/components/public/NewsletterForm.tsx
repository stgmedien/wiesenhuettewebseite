"use client";

import { useActionState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { subscribeNewsletter, type NewsletterState } from "@/app/(public)/newsletter/actions";
import type { Locale } from "@/lib/i18n-shared";

type Variant = "footer" | "page";

const COPY: Record<Locale, {
  heading: string;
  sub: string;
  emailPh: string;
  namePh: string;
  consentPre: string;
  consentLink: string;
  consentPost: string;
  cta: string;
  sending: string;
  okTitle: string;
  okBody: string;
  invalid: string;
}> = {
  de: {
    heading: "Newsletter",
    sub: "Hütten-Neuigkeiten, Termine und Tipps aus dem Hochsauerland — ein paar Mal im Jahr, nie Spam.",
    emailPh: "Deine E-Mail-Adresse",
    namePh: "Vorname (optional)",
    consentPre: "Ich möchte den Newsletter erhalten und akzeptiere die ",
    consentLink: "Datenschutzerklärung",
    consentPost: ". Abmeldung jederzeit möglich.",
    cta: "Anmelden",
    sending: "Wird gesendet …",
    okTitle: "Fast geschafft!",
    okBody: "Wir haben Dir eine Bestätigungsmail geschickt. Bitte klick auf den Link darin — dann bist Du dabei.",
    invalid: "Bitte gib eine gültige E-Mail-Adresse an und stimme der Datenschutzerklärung zu.",
  },
  en: {
    heading: "Newsletter",
    sub: "Cabin news, dates and tips from the Hochsauerland — a few times a year, never spam.",
    emailPh: "Your email address",
    namePh: "First name (optional)",
    consentPre: "I'd like to receive the newsletter and accept the ",
    consentLink: "privacy policy",
    consentPost: ". You can unsubscribe at any time.",
    cta: "Subscribe",
    sending: "Sending …",
    okTitle: "Almost there!",
    okBody: "We've sent you a confirmation email. Please click the link in it — then you're in.",
    invalid: "Please enter a valid email address and accept the privacy policy.",
  },
  nl: {
    heading: "Nieuwsbrief",
    sub: "Hutnieuws, data en tips uit het Hochsauerland — een paar keer per jaar, nooit spam.",
    emailPh: "Je e-mailadres",
    namePh: "Voornaam (optioneel)",
    consentPre: "Ik wil de nieuwsbrief ontvangen en accepteer het ",
    consentLink: "privacybeleid",
    consentPost: ". Je kunt je altijd afmelden.",
    cta: "Aanmelden",
    sending: "Verzenden …",
    okTitle: "Bijna klaar!",
    okBody: "We hebben je een bevestigingsmail gestuurd. Klik op de link erin — dan doe je mee.",
    invalid: "Voer een geldig e-mailadres in en accepteer het privacybeleid.",
  },
};

export const NewsletterForm = ({
  locale,
  variant = "page",
}: {
  locale: Locale;
  variant?: Variant;
}) => {
  const c = COPY[locale];
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletter,
    { status: "idle" }
  );

  const onFooter = variant === "footer";

  if (state.status === "ok") {
    return (
      <div
        className={
          onFooter
            ? "flex items-start gap-2.5 text-sm text-[var(--color-wh-snow)]/90"
            : "flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 p-5"
        }
        role="status"
      >
        <CheckCircle2
          size={onFooter ? 18 : 22}
          className={onFooter ? "text-[var(--color-wh-snow)] shrink-0 mt-0.5" : "text-[var(--color-wh-green)] shrink-0 mt-0.5"}
          aria-hidden
        />
        <div className={onFooter ? "" : "text-[var(--color-wh-deep-green)]"}>
          <div className="font-semibold">{c.okTitle}</div>
          <div className={onFooter ? "opacity-85 text-[13px] mt-0.5" : "text-sm mt-0.5"}>{c.okBody}</div>
        </div>
      </div>
    );
  }

  const labelCls = onFooter
    ? "text-[var(--color-wh-snow)]/70"
    : "text-[var(--color-wh-deep-green)]";
  const inputCls = onFooter
    ? "w-full rounded-lg bg-[var(--color-wh-snow)]/10 border border-[var(--color-wh-snow)]/25 text-[var(--color-wh-snow)] placeholder:text-[var(--color-wh-snow)]/45 px-3 py-2 text-sm focus:border-[var(--color-wh-snow)]/60 focus:outline-none"
    : "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2.5 focus:border-[var(--color-wh-deep-green)] focus:outline-none";

  return (
    <form action={formAction} className={onFooter ? "" : "space-y-3 max-w-md"}>
      {!onFooter && (
        <p className="text-[var(--color-wh-fg-muted)] m-0 mb-1 text-[15px]">{c.sub}</p>
      )}

      {/* Honeypot */}
      <div aria-hidden className="hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className={onFooter ? "flex flex-col gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        {!onFooter && (
          <label className="block">
            <span className={`block text-xs uppercase tracking-wider font-bold ${labelCls} mb-1.5`}>
              {c.namePh}
            </span>
            <input type="text" name="firstName" autoComplete="given-name" className={inputCls} />
          </label>
        )}
        <label className={onFooter ? "block" : "block"}>
          {!onFooter && (
            <span className={`block text-xs uppercase tracking-wider font-bold ${labelCls} mb-1.5`}>
              {c.emailPh}
            </span>
          )}
          <input
            type="email"
            name="email"
            required
            placeholder={onFooter ? c.emailPh : undefined}
            autoComplete="email"
            className={inputCls}
          />
        </label>
      </div>

      <label className={`flex items-start gap-2.5 ${onFooter ? "mt-2 text-[12px] text-[var(--color-wh-snow)]/70" : "mt-1 text-[13px] text-[var(--color-wh-fg-muted)]"}`}>
        <input
          type="checkbox"
          name="consent"
          required
          className={onFooter ? "mt-0.5 accent-[var(--color-wh-snow)]" : "mt-0.5 accent-[var(--color-wh-deep-green)]"}
        />
        <span>
          {c.consentPre}
          <a
            href="/datenschutz"
            target="_blank"
            className={onFooter ? "underline text-[var(--color-wh-snow)]" : "underline text-[var(--color-wh-deep-green)]"}
          >
            {c.consentLink}
          </a>
          {c.consentPost}
        </span>
      </label>

      {(state.status === "invalid" || state.status === "error") && (
        <p
          role="alert"
          className={`text-[13px] mt-2 ${onFooter ? "text-[#ffd9c9]" : "text-[#7a3a20]"}`}
        >
          {state.status === "invalid" ? c.invalid : state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={
          onFooter
            ? "mt-3 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] text-sm font-semibold hover:bg-white transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            : "mt-2 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50"
        }
      >
        <Mail size={16} aria-hidden />
        {pending ? c.sending : c.cta}
      </button>
    </form>
  );
};
