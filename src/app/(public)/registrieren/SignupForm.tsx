"use client";

import { useState, useTransition } from "react";
import { signupAction } from "./actions";

export function SignupForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>();
  const [isMember, setIsMember] = useState(false);

  const handle = (formData: FormData) => {
    setError(null);
    setErrorField(undefined);
    startTransition(async () => {
      const res = await signupAction(formData);
      if (res && !res.ok) {
        setError(res.error);
        setErrorField(res.field);
      }
    });
  };

  const inputBase =
    "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none";
  const errorRing = (field: string) => (errorField === field ? " border-red-500" : "");

  return (
    <form action={handle} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            Vorname
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            className={inputBase + errorRing("firstName")}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            Nachname
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            className={inputBase + errorRing("lastName")}
          />
        </div>
      </div>
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
          className={inputBase + errorRing("email")}
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Telefon (optional)
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputBase} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputBase + errorRing("password")}
          />
        </div>
        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-1">
            Wiederholen
          </label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputBase + errorRing("passwordConfirm")}
          />
        </div>
      </div>

      <div className="rounded-lg bg-[var(--color-wh-beige)] p-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isMember"
            checked={isMember}
            onChange={(e) => setIsMember(e.target.checked)}
            className="mt-1"
          />
          <div className="text-sm">
            <span className="font-medium">Ich bin Vereinsmitglied der Skifreunde Gütersloh.</span>
            <br />
            <span className="text-[var(--color-wh-black)]/70">
              Wir prüfen Deinen Status manuell. Bis zur Bestätigung gelten die Nichtmitglieds-Tarife.
            </span>
          </div>
        </label>
        {isMember && (
          <div>
            <label htmlFor="memberId" className="block text-sm font-medium mb-1">
              Mitgliedsnummer (falls bekannt)
            </label>
            <input id="memberId" name="memberId" type="text" className={inputBase} />
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="acceptTerms" required className="mt-1" />
        <span>
          Ich habe die{" "}
          <a href="/agb" className="text-[var(--color-wh-deep-green)] underline">
            AGB
          </a>{" "}
          und die{" "}
          <a href="/datenschutz" className="text-[var(--color-wh-deep-green)] underline">
            Datenschutzerklärung
          </a>{" "}
          gelesen und akzeptiere sie.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-wh-deep-green)] text-white py-3 font-semibold disabled:opacity-50"
      >
        {pending ? "Wird angelegt …" : "Konto anlegen"}
      </button>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <p className="text-sm text-[var(--color-wh-black)]/80">
        Schon registriert?{" "}
        <a href="/login" className="text-[var(--color-wh-deep-green)] underline font-medium">
          Login
        </a>
      </p>
    </form>
  );
}
