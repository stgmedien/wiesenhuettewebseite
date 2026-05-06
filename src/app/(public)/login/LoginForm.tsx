"use client";

import { useState, useTransition } from "react";
import { requestMagicLinkAction, passwordLoginAction } from "./actions";

export function LoginForm() {
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
      <div className="rounded-2xl bg-[var(--color-wh-cream)] border-l-4 border-[var(--color-wh-forest)] p-6">
        <h2 className="font-heading text-2xl text-[var(--color-wh-forest)] mb-2">
          Mail ist unterwegs
        </h2>
        <p className="text-sm text-[var(--color-wh-charcoal)]">
          Falls ein Konto mit dieser Adresse existiert, haben wir Dir gerade einen Login-Link
          geschickt. Schau in Dein Postfach (auch Spam).
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
              ? "bg-[var(--color-wh-forest)] text-white"
              : "border border-[var(--color-wh-forest)] text-[var(--color-wh-forest)]"
          }`}
        >
          Per E-Mail-Link
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`px-4 py-2 rounded-full transition ${
            mode === "password"
              ? "bg-[var(--color-wh-forest)] text-white"
              : "border border-[var(--color-wh-forest)] text-[var(--color-wh-forest)]"
          }`}
        >
          Mit Passwort
        </button>
      </div>

      {mode === "magic" ? (
        <form action={handleMagic} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--color-wh-stone)] px-3 py-2 focus:border-[var(--color-wh-forest)] focus:outline-none"
            />
          </div>
          <p className="text-xs text-[var(--color-wh-charcoal)]/70">
            Wir schicken Dir einen Link, der 15 Minuten gültig ist. Kein Passwort nötig.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[var(--color-wh-forest)] text-white py-3 font-semibold disabled:opacity-50"
          >
            {pending ? "Wird gesendet …" : "Login-Link schicken"}
          </button>
        </form>
      ) : (
        <form action={handlePassword} className="space-y-4">
          <div>
            <label htmlFor="email-pw" className="block text-sm font-medium mb-1">
              E-Mail
            </label>
            <input
              id="email-pw"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--color-wh-stone)] px-3 py-2 focus:border-[var(--color-wh-forest)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[var(--color-wh-stone)] px-3 py-2 focus:border-[var(--color-wh-forest)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[var(--color-wh-forest)] text-white py-3 font-semibold disabled:opacity-50"
          >
            {pending ? "Anmelden …" : "Anmelden"}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <p className="text-sm text-[var(--color-wh-charcoal)]/80">
        Noch kein Konto?{" "}
        <a href="/registrieren" className="text-[var(--color-wh-forest)] underline font-medium">
          Jetzt registrieren
        </a>
      </p>
    </div>
  );
}
