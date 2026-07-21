"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerContact } from "./notes-actions";

type Props = {
  bookingId: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
};

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 text-sm focus:border-[var(--color-wh-deep-green)] focus:outline-none";

export function CustomerContactForm(props: Props) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(props.firstName);
  const [lastName, setLastName] = useState(props.lastName);
  const [email, setEmail] = useState(props.email);
  const [phone, setPhone] = useState(props.phone ?? "");
  const [street, setStreet] = useState(props.street ?? "");
  const [zip, setZip] = useState(props.zip ?? "");
  const [city, setCity] = useState(props.city ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] hover:underline cursor-pointer"
        >
          Kontaktdaten bearbeiten
        </button>
        {successMsg && (
          <p className="text-[13px] text-[var(--color-wh-deep-green)] mt-1.5">{successMsg}</p>
        )}
      </div>
    );
  }

  const submit = () => {
    setErr(null);
    start(async () => {
      const r = await updateCustomerContact({
        customerId: props.customerId,
        bookingId: props.bookingId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        street: street || undefined,
        zip: zip || undefined,
        city: city || undefined,
      });
      if (r.ok) {
        setOpen(false);
        setSuccessMsg(
          r.reissuedInvoiceNumber
            ? `Gespeichert. Rechnung ${r.reissuedInvoiceNumber} wurde mit den korrigierten Daten neu ausgestellt.`
            : "Gespeichert."
        );
        router.refresh();
      } else {
        setErr(r.error);
      }
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-snow)] p-4">
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mb-3">
        Kontaktdaten bearbeiten
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Vorname</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Nachname</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">E-Mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Telefon</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Straße</span>
          <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">PLZ</span>
          <input value={zip} onChange={(e) => setZip(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Ort</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
        </label>
      </div>

      {err && <p className="text-[13px] text-[#7a3a20] mt-2">{err}</p>}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center justify-center h-10 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {pending ? "Wird gespeichert …" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setErr(null);
          }}
          className="inline-flex items-center justify-center h-10 px-4 text-sm text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)] cursor-pointer"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
