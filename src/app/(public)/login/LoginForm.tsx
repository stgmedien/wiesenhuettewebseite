"use client";

import { useState, useTransition } from "react";
import { requestMagicLinkAction, passwordLoginAction } from "./actions";
import type { Locale } from "@/lib/i18n-shared";

const COPY = {
  de: {
    successH: "Mail ist unterwegs",
    successBody: "Falls ein Konto mit dieser Adresse existiert, haben wir Dir gerade einen Login-Link geschickt. Schau in Dein Postfach (auch Spam).",
    tabMagic: "Per E-Mail-Link",
    tabPassword: "Mit Passwort",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    magicHint: "Wir schicken Dir einen Link, der 15 Minuten gültig ist. Kein Passwort nötig.",
    sending: "Wird gesendet …",
    sendMagic: "Login-Link schicken",
    signingIn: "Anmelden …",
    signIn: "Anmelden",
    forgotPassword: "Passwort vergessen?",
    forgotPasswordHint: "Wir schicken Dir einen Login-Link, von dem aus Du das Passwort neu setzen kannst.",
    noAccount: "Noch kein Konto?",
    register: "Jetzt registrieren",
  },
  en: {
    successH: "Email on its way",
    successBody: "If an account with this address exists, we've just sent you a sign-in link. Check your inbox (and spam folder).",
    tabMagic: "Email link",
    tabPassword: "With password",
    emailLabel: "Email",
    passwordLabel: "Password",
    magicHint: "We'll send you a link valid for 15 minutes. No password needed.",
    sending: "Sending …",
    sendMagic: "Send sign-in link",
    signingIn: "Signing in …",
    signIn: "Sign in",
    forgotPassword: "Forgot password?",
    forgotPasswordHint: "We'll send you a sign-in link from which you can set a new password.",
    noAccount: "No account yet?",
    register: "Sign up",
  },
  nl: {
    successH: "Mail is onderweg",
    successBody: "Als er een account bij dit adres bestaat, hebben we je net een inloglink gestuurd. Kijk in je postvak (ook bij spam).",
    tabMagic: "Via e-maillink",
    tabPassword: "Met wachtwoord",
    emailLabel: "E-mail",
    passwordLabel: "Wachtwoord",
    magicHint: "We sturen je een link die 15 minuten geldig is. Geen wachtwoord nodig.",
    sending: "Versturen …",
    sendMagic: "Inloglink versturen",
    signingIn: "Inloggen …",
    signIn: "Inloggen",
    forgotPassword: "Wachtwoord vergeten?",
    forgotPasswordHint: "We sturen je een inloglink waarmee je een nieuw wachtwoord kunt instellen.",
    noAccount: "Nog geen account?",
    register: "Nu registreren",
  },
} as const;

export function LoginForm({ locale = "de" }: { locale?: Locale }) {
  const t = COPY[locale];
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagic = (formData: FormData) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await requestMagicLinkAction(formData);
      if (res.ok) setSuccess(true);
      else setError(res.error);
    });
  };

  const handlePassword = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await passwordLoginAction(formData);
      // signIn redirects on success; if we're still here, something failed
      if (res && !res.ok) setError(res.error);
    });
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] p-6">
        <h2 className="font-heading text-2xl text-[var(--color-wh-deep-green)] mb-2">
          {t.successH}
        </h2>
        <p className="text-sm text-[var(--color-wh-black)]">
          {t.successBody}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`px-4 py-2 rounded-full transition ${
            mode === "magic"
              ? "bg-[var(--color-wh-deep-green)] text-white"
              : "border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)]"
          }`}
        >
          {t.tabMagic}
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`px-4 py-2 rounded-full transition ${
            mode === "password"
              ? "bg-[var(--color-wh-deep-green)] text-white"
              : "border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)]"
          }`}
        >
          {t.tabPassword}
        </button>
      </div>

      {mode === "magic" ? (
        <form action={handleMagic} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {t.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none"
            />
          </div>
          <p className="text-xs text-[var(--color-wh-black)]/70">
            {t.magicHint}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[var(--color-wh-deep-green)] text-white py-3 font-semibold disabled:opacity-50"
          >
            {pending ? t.sending : t.sendMagic}
          </button>
        </form>
      ) : (
        <form action={handlePassword} className="space-y-4">
          <div>
            <label htmlFor="email-pw" className="block text-sm font-medium mb-1">
              {t.emailLabel}
            </label>
            <input
              id="email-pw"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              {t.passwordLabel}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[var(--color-wh-deep-green)] text-white py-3 font-semibold disabled:opacity-50"
          >
            {pending ? t.signingIn : t.signIn}
          </button>
          <p className="text-center text-sm">
            <button
              type="button"
              onClick={() => setMode("magic")}
              className="text-[var(--color-wh-deep-green)] underline hover:opacity-70"
            >
              {t.forgotPassword}
            </button>{" "}
            <span className="text-[var(--color-wh-black)]/60">
              {t.forgotPasswordHint}
            </span>
          </p>
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <p className="text-sm text-[var(--color-wh-black)]/80">
        {t.noAccount}{" "}
        <a href="/registrieren" className="text-[var(--color-wh-deep-green)] underline font-medium">
          {t.register}
        </a>
      </p>
    </div>
  );
}
