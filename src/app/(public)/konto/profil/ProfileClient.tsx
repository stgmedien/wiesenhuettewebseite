"use client";

import { useState, useTransition } from "react";
import {
  updateProfile,
  changePassword,
  requestEmailChange,
  softDeleteAccount,
  requestMembership,
  withdrawMembershipRequest,
} from "./actions";

type Customer = {
  firstName: string;
  lastName: string;
  phone: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  country: string;
  membershipStatus: "none" | "pending" | "verified" | "rejected";
  membershipRejectedReason: string | null;
  memberId: string | null;
};

type User = {
  email: string;
  hasPassword: boolean;
};

const inputBase =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none";

export function ProfileClient({ user, customer }: { user: User; customer: Customer | null }) {
  return (
    <div className="space-y-10">
      <ProfileSection user={user} customer={customer} />
      <MembershipSection customer={customer} />
      <PasswordSection hasPassword={user.hasPassword} />
      <EmailSection currentEmail={user.email} hasPassword={user.hasPassword} />
      <DeleteSection />
    </div>
  );
}

function MembershipSection({ customer }: { customer: Customer | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!customer) {
    return (
      <Section
        title="Vereinsmitgliedschaft"
        description="Bitte fülle zuerst oben Adresse & Kontakt aus, dann kannst Du Mitgliedschaft beantragen."
      >
        <p className="text-sm text-[var(--color-wh-black)]/70">—</p>
      </Section>
    );
  }

  const status = customer.membershipStatus;

  // 1) Verifiziertes Mitglied — nur Status-Anzeige
  if (status === "verified") {
    return (
      <Section title="Vereinsmitgliedschaft">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm">
          <p className="font-semibold text-emerald-900 m-0 mb-1">
            ✓ Du bist bestätigtes Vereinsmitglied.
          </p>
          <p className="text-emerald-800 m-0">
            {customer.memberId && (
              <>
                Mitgliedsnummer: <span className="font-mono">{customer.memberId}</span>
                <br />
              </>
            )}
            Du erhältst beim Buchen automatisch den Mitglieds-Tarif (7,50 € statt 18 € pro
            Person und Nacht).
          </p>
        </div>
      </Section>
    );
  }

  // 2) Antrag schwebt
  if (status === "pending") {
    return (
      <Section title="Vereinsmitgliedschaft">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm mb-4">
          <p className="font-semibold text-amber-900 m-0 mb-1">
            Dein Antrag wird gerade geprüft.
          </p>
          <p className="text-amber-800 m-0">
            Wir gleichen Deine Daten mit dem Vereinsverzeichnis ab. Sobald wir bestätigt haben,
            siehst Du den Mitglieds-Status hier — und kannst beim nächsten Buchen den
            Mitglieds-Tarif wählen.
          </p>
        </div>
        <form
          action={() =>
            startTransition(async () => {
              setError(null);
              setMsg(null);
              const r = await withdrawMembershipRequest();
              if (r.ok) setMsg("Antrag zurückgezogen.");
              else setError(r.error);
            })
          }
        >
          <button
            type="submit"
            disabled={pending}
            className="text-sm text-[var(--color-wh-black)]/70 underline hover:opacity-70 disabled:opacity-50"
          >
            Antrag zurückziehen
          </button>
        </form>
        {msg && <p className="text-sm text-emerald-700 mt-2">{msg}</p>}
        {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      </Section>
    );
  }

  // 3) Abgelehnt — Hinweis + Re-Apply möglich
  // 4) Noch kein Antrag — neuer Antrag möglich
  return (
    <Section
      title="Vereinsmitgliedschaft"
      description={
        status === "rejected"
          ? "Dein vorheriger Antrag wurde abgelehnt. Du kannst einen neuen Antrag stellen."
          : "Skifreunde-Mitglied? Beantrage hier die Verifizierung — wir prüfen das manuell. Bis zur Bestätigung gelten die Nichtmitglieds-Tarife."
      }
    >
      {status === "rejected" && customer.membershipRejectedReason && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm mb-4">
          <p className="font-semibold text-red-900 m-0 mb-1">Vorherige Ablehnung</p>
          <p className="text-red-800 m-0">{customer.membershipRejectedReason}</p>
        </div>
      )}
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            setMsg(null);
            const r = await requestMembership(fd);
            if (r.ok) setMsg("Antrag eingereicht. Wir melden uns nach der Prüfung.");
            else setError(r.error);
          })
        }
        className="space-y-4 max-w-md"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Mitgliedsnummer (falls bekannt)
          </label>
          <input
            name="memberId"
            type="text"
            defaultValue={customer.memberId ?? ""}
            placeholder="z.B. 0421"
            className={inputBase}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Notiz für die Verifizierung (optional)
          </label>
          <textarea
            name="note"
            rows={3}
            placeholder="Seit wann Mitglied? Wer kennt Dich im Verein? Beitragsfähig?"
            className={inputBase}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {pending
              ? "Wird eingereicht …"
              : status === "rejected"
                ? "Erneut beantragen"
                : "Mitgliedschaft beantragen"}
          </button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>
      </form>
    </Section>
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
    <section className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-6">
      <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--color-wh-black)]/70 mb-4">{description}</p>
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
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
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
        <p className="text-sm text-[var(--color-wh-black)]/70">
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
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
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
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
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
              className="rounded-full border border-[var(--color-wh-winter-grey)] px-4 py-2 text-sm"
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
