"use client";

import { useState, useTransition } from "react";
import { signupAction } from "./actions";
import type { Locale } from "@/lib/i18n-shared";

const COPY = {
  de: {
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    phone: "Telefon (optional)",
    password: "Passwort",
    passwordConfirm: "Wiederholen",
    memberCheckbox: "Ich bin bereits Vereinsmitglied der Skifreunde Gütersloh.",
    memberHint: "Wir prüfen Deinen Nachweis manuell. Bis zur Bestätigung gelten die Nichtmitglieds-Tarife.",
    memberId: "Mitgliedsnummer (falls bekannt)",
    accept: "Ich habe die",
    acceptAgb: "AGB",
    acceptAnd: "und die",
    acceptPrivacy: "Datenschutzerklärung",
    acceptEnd: "gelesen und akzeptiere sie.",
    submitting: "Wird angelegt …",
    submit: "Konto anlegen",
    alreadyRegistered: "Schon registriert?",
    login: "Login",
  },
  en: {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone (optional)",
    password: "Password",
    passwordConfirm: "Repeat",
    memberCheckbox: "I'm already a member of Skifreunde Gütersloh.",
    memberHint: "We verify your proof manually. Until confirmation the non-member rates apply.",
    memberId: "Membership number (if known)",
    accept: "I have read and accept the",
    acceptAgb: "terms",
    acceptAnd: "and the",
    acceptPrivacy: "privacy policy",
    acceptEnd: ".",
    submitting: "Creating …",
    submit: "Create account",
    alreadyRegistered: "Already registered?",
    login: "Log in",
  },
  nl: {
    firstName: "Voornaam",
    lastName: "Achternaam",
    email: "E-mail",
    phone: "Telefoon (optioneel)",
    password: "Wachtwoord",
    passwordConfirm: "Herhaal",
    memberCheckbox: "Ik ben al lid van Skifreunde Gütersloh.",
    memberHint: "We controleren je bewijs handmatig. Tot de bevestiging gelden de niet-leden-tarieven.",
    memberId: "Lidnummer (indien bekend)",
    accept: "Ik heb",
    acceptAgb: "de voorwaarden",
    acceptAnd: "en",
    acceptPrivacy: "het privacybeleid",
    acceptEnd: "gelezen en aanvaard.",
    submitting: "Aanmaken …",
    submit: "Account aanmaken",
    alreadyRegistered: "Al geregistreerd?",
    login: "Inloggen",
  },
} as const;

export function SignupForm({ locale = "de" }: { locale?: Locale }) {
  const t = COPY[locale];
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
            {t.firstName}
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
            {t.lastName}
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
          {t.email}
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
          {t.phone}
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputBase} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            {t.password}
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
            {t.passwordConfirm}
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
            <span className="font-medium">{t.memberCheckbox}</span>
            <br />
            <span className="text-[var(--color-wh-black)]/70">
              {t.memberHint}
            </span>
          </div>
        </label>
        {isMember && (
          <div>
            <label htmlFor="memberId" className="block text-sm font-medium mb-1">
              {t.memberId}
            </label>
            <input id="memberId" name="memberId" type="text" className={inputBase} />
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="acceptTerms" required className="mt-1" />
        <span>
          {t.accept}{" "}
          <a href="/agb" className="text-[var(--color-wh-deep-green)] underline">
            {t.acceptAgb}
          </a>{" "}
          {t.acceptAnd}{" "}
          <a href="/datenschutz" className="text-[var(--color-wh-deep-green)] underline">
            {t.acceptPrivacy}
          </a>{" "}
          {t.acceptEnd}
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-wh-deep-green)] text-white py-3 font-semibold disabled:opacity-50"
      >
        {pending ? t.submitting : t.submit}
      </button>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <p className="text-sm text-[var(--color-wh-black)]/80">
        {t.alreadyRegistered}{" "}
        <a href="/login" className="text-[var(--color-wh-deep-green)] underline font-medium">
          {t.login}
        </a>
      </p>
    </form>
  );
}
