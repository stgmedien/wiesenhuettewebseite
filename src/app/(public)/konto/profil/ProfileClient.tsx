"use client";

import { useState, useTransition } from "react";
import {
  updateProfile,
  changePassword,
  requestEmailChange,
  softDeleteAccount,
} from "./actions";

type Customer = {
  firstName: string;
  lastName: string;
  phone: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  country: string;
};

type User = {
  email: string;
  hasPassword: boolean;
};

const inputBase =
  "w-full rounded-lg border border-[var(--color-wh-stone)] px-3 py-2 focus:border-[var(--color-wh-forest)] focus:outline-none";

export function ProfileClient({ user, customer }: { user: User; customer: Customer | null }) {
  return (
    <div className="space-y-10">
      <ProfileSection user={user} customer={customer} />
      <PasswordSection hasPassword={user.hasPassword} />
      <EmailSection currentEmail={user.email} hasPassword={user.hasPassword} />
      <DeleteSection />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-[var(--color-wh-stone)]/40 p-6">
      <h2 className="font-heading text-xl text-[var(--color-wh-forest)] mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--color-wh-charcoal)]/70 mb-4">{description}</p>
      )}
      {children}
    </section>
  );
}

function ProfileSection({ user, customer }: { user: User; customer: Customer | null }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <Section title="Adresse & Kontakt">
      <form
        action={(fd) =>
          startTransition(async () => {
            const r = await updateProfile(fd);
            setMsg(r.ok ? "Gespeichert." : r.error ?? "Fehler");
          })
        }
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Vorname</label>
            <input
              name="firstName"
              defaultValue={customer?.firstName ?? ""}
              required
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nachname</label>
            <input
              name="lastName"
              defaultValue={customer?.lastName ?? ""}
              required
              className={inputBase}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telefon</label>
          <input
            name="phone"
            type="tel"
            defaultValue={customer?.phone ?? ""}
            className={inputBase}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Straße + Nr.</label>
          <input name="street" defaultValue={customer?.street ?? ""} className={inputBase} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">PLZ</label>
            <input name="zip" defaultValue={customer?.zip ?? ""} className={inputBase} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Ort</label>
            <input name="city" defaultValue={customer?.city ?? ""} className={inputBase} />
          </div>
        </div>
        <input type="hidden" name="country" value={customer?.country ?? "DE"} />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--color-wh-forest)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Speichern
          </button>
          {msg && <span className="text-sm">{msg}</span>}
        </div>
      </form>
    </Section>
  );
}

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hasPassword) {
    return (
      <Section
        title="Passwort"
        description="Du hast aktuell kein Passwort gesetzt — Du loggst Dich nur per Magic-Link ein."
      >
        <p className="text-sm text-[var(--color-wh-charcoal)]/70">
          Wenn Du ein Passwort setzen willst, klick beim nächsten Login auf "Passwort vergessen" —
          dann bekommst Du einen Link zum Setzen eines neuen Passworts.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Passwort ändern">
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            setMsg(null);
            const r = await changePassword(fd);
            if (r.ok) setMsg("Passwort geändert.");
            else setError(r.error);
          })
        }
        className="space-y-4 max-w-md"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Aktuelles Passwort</label>
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputBase}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Neues Passwort</label>
          <input
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputBase}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Wiederholen</label>
          <input
            name="newPasswordConfirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputBase}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--color-wh-forest)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Ändern
          </button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>
      </form>
    </Section>
  );
}

function EmailSection({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string;
  hasPassword: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Section
      title="E-Mail-Adresse"
      description={`Aktuell: ${currentEmail}. Wir schicken einen Bestätigungs-Link an die neue Adresse.`}
    >
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            setMsg(null);
            const r = await requestEmailChange(fd);
            if (r.ok) setMsg("Bestätigungs-Link gesendet. Klick den Link in der neuen E-Mail.");
            else setError(r.error);
          })
        }
        className="space-y-4 max-w-md"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Neue E-Mail</label>
          <input name="newEmail" type="email" required className={inputBase} />
        </div>
        {hasPassword && (
          <div>
            <label className="block text-sm font-medium mb-1">Aktuelles Passwort (Bestätigung)</label>
            <input name="password" type="password" required className={inputBase} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !hasPassword}
            className="rounded-full bg-[var(--color-wh-forest)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            title={!hasPassword ? "Erst Passwort setzen" : ""}
          >
            Bestätigung anfordern
          </button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>
      </form>
    </Section>
  );
}

function DeleteSection() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Section title="Konto löschen" description="DSGVO-Recht auf Vergessen. 30 Tage Frist.">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-red-300 text-red-700 px-5 py-2.5 text-sm font-semibold hover:bg-red-50"
        >
          Konto löschen anfragen
        </button>
      ) : (
        <form
          action={(fd) =>
            startTransition(async () => {
              await softDeleteAccount(fd);
              window.location.href = "/?account=deleted";
            })
          }
          className="space-y-4 max-w-md"
        >
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm">
            <p className="font-semibold mb-1">Bist Du sicher?</p>
            <p>
              Dein Konto wird sofort deaktiviert. Nach <strong>30 Tagen</strong> werden Deine
              Profil-Daten endgültig anonymisiert. Buchungen und Rechnungen behalten wir aus
              steuerlichen Gründen (10 Jahre handelsrechtliche Aufbewahrungs­pflicht), aber Dein
              Name wird durch "Anonymisiert" ersetzt.
            </p>
          </div>
          <textarea
            name="reason"
            rows={3}
            placeholder="Grund (optional, hilft uns)"
            className={inputBase}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-full border border-[var(--color-wh-stone)] px-4 py-2 text-sm"
            >
              Doch nicht
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "Wird gelöscht …" : "Ja, Konto löschen"}
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}
