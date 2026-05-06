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
      <div className="rounded-2xl bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] p-6">
        <h2 className="font-heading text-2xl text-[var(--color-wh-deep-green)] mb-2">
          Mail ist unterwegs
        </h2>
        <p className="text-sm text-[var(--color-wh-black)]">
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
              ? "bg-[var(--color-wh-deep-green)] text-white"
              : "border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)]"
          }`}
        >
          Per E-Mail-Link
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
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none"
            />
          </div>
          <p className="text-xs text-[var(--color-wh-black)]/70">
            Wir schicken Dir einen Link, der 15 Minuten gültig ist. Kein Passwort nötig.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[var(--color-wh-deep-green)] text-white py-3 font-semibold disabled:opacity-50"
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
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none"
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
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[var(--color-wh-deep-green)] text-white py-3 font-semibold disabled:opacity-50"
          >
            {pending ? "Anmelden …" : "Anmelden"}
          </button>
          <p className="text-center text-sm">
            <button
              type="button"
              onClick={() => setMode("magic")}
              className="text-[var(--color-wh-deep-green)] underline hover:opacity-70"
            >
              Passwort vergessen?
            </button>{" "}
            <span className="text-[var(--color-wh-black)]/60">
              Wir schicken Dir einen Login-Link, von dem aus Du das Passwort neu setzen kannst.
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
        Noch kein Konto?{" "}
        <a href="/registrieren" className="text-[var(--color-wh-deep-green)] underline font-medium">
          Jetzt registrieren
        </a>
      </p>
    </div>
  );
}
