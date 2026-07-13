"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewPersonsIncrease, submitPersonsIncrease, type IncreasePreview } from "./actions";

type Counts = {
  adults: number;
  members: number;
  children: number;
  pupils: number;
  teachers: number;
};

type Props = {
  bookingId: string;
  booked: Counts;
  memberAllowed: boolean;
  deadlineLabel: string;
  maxPersons: number;
};

const eur = (c: number) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const total = (c: Counts) => c.adults + c.members + c.children + c.pupils + c.teachers;

export function AddPersonsForm({ bookingId, booked, memberAllowed, deadlineLabel, maxPersons }: Props) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>(booked);
  const [preview, setPreview] = useState<IncreasePreview | null>(null);
  const [done, setDone] = useState<{ persons: number; deltaCents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const added = total(counts) - total(booked);

  const update = (key: keyof Counts, value: number) => {
    const next = { ...counts, [key]: Math.max(booked[key], Math.min(value, 60)) };
    setCounts(next);
    setError(null);
    if (total(next) > total(booked) && total(next) <= maxPersons) {
      start(async () => {
        setPreview(await previewPersonsIncrease({ bookingId, ...next }));
      });
    } else {
      setPreview(null);
    }
  };

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await submitPersonsIncrease({ bookingId, ...counts });
      if (res.ok) {
        setDone({ persons: res.totalPersons, deltaCents: res.deltaCents });
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  if (done) {
    return (
      <section className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 mb-6">
        <h2 className="font-heading text-xl text-emerald-900 mb-2">✓ Nachmeldung übernommen</h2>
        <p className="text-sm text-emerald-900">
          Eure Buchung läuft jetzt über <strong>{done.persons} Personen</strong>. Der Mehrbetrag von{" "}
          <strong>{eur(done.deltaCents)}</strong> wird automatisch mit der Restzahlung fällig — Ihr
          bekommt gerade eine Bestätigung per E-Mail.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] p-6 mb-6">
      <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-1">
        Es kommen mehr Personen mit?
      </h2>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-4">
        Gerade bei Jugendgruppen ändert sich die Teilnehmerzahl oft noch — hier könnt Ihr Personen{" "}
        <strong>bis zum {deadlineLabel}</strong> nachmelden (danach läuft die Restzahlung). Der
        Mehrbetrag wird automatisch mit der Restzahlung fällig.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-3 text-sm font-semibold cursor-pointer hover:opacity-90"
        >
          + Teilnehmer nachmelden
        </button>
      ) : (
        <div className="space-y-3">
          <Stepper
            label="Erwachsene"
            hint="ab 16 Jahren"
            value={counts.adults}
            min={booked.adults}
            onChange={(v) => update("adults", v)}
          />
          {(memberAllowed || booked.members > 0) && (
            <Stepper
              label="Vereinsmitglieder"
              hint={memberAllowed ? "Skifreunde Gütersloh e.V." : "nur für verifizierte Mitglieder erweiterbar"}
              value={counts.members}
              min={booked.members}
              onChange={(v) => update("members", v)}
              disabled={!memberAllowed}
            />
          )}
          <Stepper
            label="Kinder"
            hint="4–15 Jahre"
            value={counts.children}
            min={booked.children}
            onChange={(v) => update("children", v)}
          />
          {(memberAllowed || booked.pupils > 0) && (
            <Stepper
              label="Kinder/Schüler bis 16 · Mitglied"
              hint={memberAllowed ? "−50 % · Skifreunde Gütersloh e.V." : "nur für verifizierte Mitglieder erweiterbar"}
              value={counts.pupils}
              min={booked.pupils}
              onChange={(v) => update("pupils", v)}
              disabled={!memberAllowed}
            />
          )}
          {booked.teachers > 0 && (
            <Stepper
              label="Begleitpersonen / Lehrkräfte"
              value={counts.teachers}
              min={booked.teachers}
              onChange={(v) => update("teachers", v)}
            />
          )}

          {total(counts) > maxPersons && (
            <p className="text-sm text-red-700">
              Die Hütte hat {maxPersons} Schlafplätze — mehr Personen sind nicht möglich.
            </p>
          )}

          {added > 0 && preview?.ok && (
            <div className="rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/50 p-4 text-sm">
              <p>
                <strong>+{added} Person{added === 1 ? "" : "en"}</strong> · Mehrbetrag{" "}
                <strong>{eur(preview.deltaCents)}</strong> → neue Zwischensumme{" "}
                <strong>{eur(preview.newSubtotalCents)}</strong>
              </p>
              <p className="text-xs text-[var(--color-wh-black)]/60 mt-1">
                Wird automatisch mit der Restzahlung eingezogen bzw. angefordert — keine separate
                Zahlung nötig.
              </p>
            </div>
          )}
          {added > 0 && preview && !preview.ok && (
            <p className="text-sm text-red-700">{preview.error}</p>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={submit}
              disabled={pending || added <= 0 || total(counts) > maxPersons}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-3 text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Wird gespeichert …" : `Verbindlich nachmelden${added > 0 ? ` (+${added})` : ""}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCounts(booked);
                setPreview(null);
                setError(null);
              }}
              className="text-sm text-[var(--color-wh-black)]/60 hover:text-[var(--color-wh-deep-green)] cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--color-wh-black)]">{label}</p>
        {hint && <p className="text-xs text-[var(--color-wh-black)]/60">{hint}</p>}
        {min > 0 && <p className="text-xs text-[var(--color-wh-black)]/40">gebucht: {min}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={disabled || value <= min}
          aria-label={`${label} verringern`}
          className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] font-bold cursor-pointer hover:bg-[var(--color-wh-beige)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={disabled}
          aria-label={`${label} erhöhen`}
          className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] font-bold cursor-pointer hover:bg-[var(--color-wh-beige)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
