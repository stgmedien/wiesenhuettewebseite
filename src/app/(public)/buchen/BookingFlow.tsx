"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { calculatePrice, formatEuro, RULES, type Persons } from "@/lib/pricing";
import { createBookingAndCheckout } from "./actions";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

type Step = 0 | 1 | 2 | 3;

const emptyPersons: Persons = {
  adults: 0,
  members: 0,
  children: 0,
  pupils: 0,
  teachers: 0,
};

const todayIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const addDaysIso = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

type Prefill = {
  loggedIn: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  customerType?: "privat" | "mitglied" | "verein" | "firma";
  membershipVerified?: boolean;
};

type RepeatHint = {
  adults: number;
  members: number;
  children: number;
  pupils: number;
  teachers: number;
  soloUse: boolean;
  arrival: string;
  departure: string;
};

type BookingFlowProps = {
  bookedDates: string[];
  cleaningDates: string[];
  wartungDates: string[];
  prefill?: Prefill;
  repeatHint?: RepeatHint;
};

export const BookingFlow = ({
  bookedDates,
  cleaningDates,
  wartungDates,
  prefill,
  repeatHint,
}: BookingFlowProps) => {
  // Internal: union of all unavailable days for the rangeBlocked guard.
  const blockedDates = [...bookedDates, ...cleaningDates, ...wartungDates];
  const [step, setStep] = useState<Step>(0);
  const [arrival, setArrival] = useState(repeatHint?.arrival ?? "");
  const [departure, setDeparture] = useState(repeatHint?.departure ?? "");
  const [persons, setPersons] = useState<Persons>(
    repeatHint
      ? {
          adults: repeatHint.adults,
          members: repeatHint.members,
          children: repeatHint.children,
          pupils: repeatHint.pupils,
          teachers: repeatHint.teachers,
        }
      : emptyPersons
  );
  const [soloUse, setSoloUse] = useState(repeatHint?.soloUse ?? false);
  const [purpose, setPurpose] = useState("");

  const [customerType, setCustomerType] = useState<"privat" | "mitglied" | "verein" | "firma">(
    prefill?.customerType ?? "privat"
  );
  const [firstName, setFirstName] = useState(prefill?.firstName ?? "");
  const [lastName, setLastName] = useState(prefill?.lastName ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [company, setCompany] = useState("");
  const [street, setStreet] = useState(prefill?.street ?? "");
  const [zip, setZip] = useState(prefill?.zip ?? "");
  const [city, setCity] = useState(prefill?.city ?? "");
  const [customerMessage, setCustomerMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const totalPersons =
    persons.adults +
    persons.members +
    persons.children +
    persons.pupils +
    persons.teachers;

  const datesValid =
    !!arrival &&
    !!departure &&
    new Date(departure) > new Date(arrival) &&
    Math.round(
      (new Date(departure).getTime() - new Date(arrival).getTime()) /
        (1000 * 60 * 60 * 24)
    ) >= RULES.minNights;

  const personsValid =
    totalPersons >= RULES.minPersons && totalPersons <= RULES.maxPersons;

  const breakdown = useMemo(() => {
    if (!datesValid || !personsValid) return null;
    return calculatePrice({
      arrival,
      departure,
      persons,
      soloUse,
    });
  }, [arrival, departure, persons, soloUse, datesValid, personsValid]);

  const rangeBlocked = useMemo(() => {
    if (!datesValid) return false;
    const cur = new Date(arrival);
    const end = new Date(departure);
    while (cur < end) {
      if (blockedSet.has(cur.toISOString().slice(0, 10))) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }, [arrival, departure, datesValid, blockedSet]);

  const canGoStep1 = datesValid && personsValid && !rangeBlocked;
  const canGoStep2 = breakdown !== null;
  const canGoStep3 =
    firstName.trim() &&
    lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    acceptedTerms;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createBookingAndCheckout({
        arrival,
        departure,
        persons,
        soloUse,
        customerType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        company: company.trim() || null,
        street: street.trim() || null,
        zip: zip.trim() || null,
        city: city.trim() || null,
        purpose: purpose.trim() || null,
        customerMessage: customerMessage.trim() || null,
        acceptedTerms: true,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.checkoutUrl;
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4 sm:p-6 lg:p-8">
        <Stepper step={step} />

        {step === 0 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">Wann?</h3>

            <AvailabilityCalendar
              bookedDates={bookedDates}
              cleaningDates={cleaningDates}
              wartungDates={wartungDates}
              arrival={arrival}
              departure={departure}
              onSelect={(a, d) => {
                setArrival(a);
                setDeparture(d);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="arrival"
                label="Anreise"
                type="date"
                min={todayIso()}
                value={arrival}
                onChange={(e) => {
                  setArrival(e.target.value);
                  if (departure && new Date(departure) <= new Date(e.target.value)) {
                    setDeparture(addDaysIso(e.target.value, 2));
                  }
                }}
              />
              <Input
                id="departure"
                label="Abreise"
                type="date"
                min={arrival ? addDaysIso(arrival, RULES.minNights) : todayIso()}
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
              />
            </div>
            {rangeBlocked && (
              <div className="text-[var(--color-wh-sunset)] text-sm font-semibold">
                Mindestens ein Tag in diesem Zeitraum ist bereits belegt — bitte einen anderen
                Zeitraum wählen.
              </div>
            )}

            <h3 className="text-[22px] sm:text-[24px] mt-12 mb-0">Wer kommt?</h3>
            <PersonsEditor
              persons={persons}
              onChange={setPersons}
              memberAllowed={!!prefill?.membershipVerified}
            />
            <div
              className={`text-sm ${
                personsValid ? "text-[var(--color-wh-fg-muted)]" : "text-[var(--color-wh-sunset)]"
              }`}
            >
              {totalPersons} von {RULES.minPersons}–{RULES.maxPersons} Personen.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                disabled={!canGoStep1}
                onClick={() => setStep(1)}
                iconRight={<ArrowRight size={18} />}
              >
                Weiter
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">Pauschalen</h3>
            <div className="bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-card)] p-5">
              <div className="font-semibold text-[var(--color-wh-deep-green)]">
                Endreinigung — 190,00 € (Pflicht)
              </div>
              <div className="text-sm text-[var(--color-wh-fg-muted)] mt-1">
                Die finale Reinigung wird von uns durchgeführt und ist in jeder Buchung enthalten.
              </div>
            </div>

            <ExtraToggle
              checked={soloUse}
              onChange={setSoloUse}
              title="Allein-/Exklusivnutzung — 50,00 €"
              body="Aufschlag für die alleinige Nutzung der Hütte."
            />

            <Input
              id="purpose"
              label="Anlass / Bezeichnung (optional)"
              placeholder="z. B. Familienurlaub, Klassenfahrt, Vereinsfahrt"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(0)}
                iconLeft={<ArrowLeft size={18} />}
              >
                Zurück
              </Button>
              <Button
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
                iconRight={<ArrowRight size={18} />}
              >
                Weiter
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">Eure Daten</h3>

            <div>
              <SegmentedControl
                label="Wer bucht?"
                value={customerType}
                options={[
                  { value: "privat", label: "Privat" },
                  ...(prefill?.membershipVerified
                    ? [{ value: "mitglied", label: "Vereinsmitglied" }]
                    : []),
                  { value: "verein", label: "Verein / Schule" },
                  { value: "firma", label: "Firma" },
                ]}
                onChange={(v) => setCustomerType(v as typeof customerType)}
              />
              {!prefill?.loggedIn && (
                <p className="text-xs text-[var(--color-wh-fg-muted)] mt-2">
                  💡 Hast Du schon ein Konto?{" "}
                  <a href="/login?callbackUrl=/buchen" className="underline">
                    Hier einloggen
                  </a>
                  {" "}— oder weiter buchen, wir legen automatisch ein Konto für Dich an.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="firstName" label="Vorname" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <Input id="lastName" label="Nachname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              <Input id="email" type="email" label="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input id="phone" type="tel" label="Telefon (empfohlen)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {customerType === "firma" || customerType === "verein" ? (
                <Input id="company" label="Firma / Verein" value={company} onChange={(e) => setCompany(e.target.value)} />
              ) : null}
              <Input id="street" label="Straße" value={street} onChange={(e) => setStreet(e.target.value)} />
              <Input id="zip" label="PLZ" value={zip} onChange={(e) => setZip(e.target.value)} />
              <Input id="city" label="Ort" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <Textarea
              id="msg"
              label="Nachricht (optional)"
              hint="Sonderwünsche, Fragen, geplante Anreisezeit ..."
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
            />

            <label className="flex items-start gap-3 text-sm text-[var(--color-wh-fg-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <span>
                Ich habe die{" "}
                <a href="/agb" target="_blank" rel="noreferrer">
                  AGB
                </a>{" "}
                und die{" "}
                <a href="/datenschutz" target="_blank" rel="noreferrer">
                  Datenschutzerklärung
                </a>{" "}
                gelesen und akzeptiere sie.
              </span>
            </label>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                iconLeft={<ArrowLeft size={18} />}
              >
                Zurück
              </Button>
              <Button
                disabled={!canGoStep3}
                onClick={() => setStep(3)}
                iconRight={<ArrowRight size={18} />}
              >
                Übersicht
              </Button>
            </div>
          </div>
        )}

        {step === 3 && breakdown && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">Übersicht</h3>
            <ReviewBlock
              arrival={arrival}
              departure={departure}
              nights={breakdown.nights}
              persons={persons}
              firstName={firstName}
              lastName={lastName}
              email={email}
            />
            <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 text-sm text-[var(--color-wh-black)]">
              <p className="m-0 font-semibold mb-2">Heute fällig:</p>
              <p className="m-0">
                <strong>{formatEuro(breakdown.prepaymentCents)}</strong> Anzahlung (50 % der Buchungssumme) +{" "}
                <strong>{formatEuro(breakdown.depositCents)}</strong> Kaution.
              </p>
              <p className="m-0 mt-3">
                Restzahlung von <strong>{formatEuro(breakdown.remainderCents)}</strong> wird vor Anreise per
                separater Zahlungsaufforderung eingezogen. Die Kaution wird innerhalb von 14 Tagen
                nach mangelfreier Abreise zurückerstattet.
              </p>
              <p className="m-0 mt-3 text-[var(--color-wh-fg-muted)]">
                Hinweis: Die Kurtaxe Hochsauerland wird seit Mai 2026 separat über das offizielle
                Kurtaxen-Portal abgerechnet — Du erhältst nach der Buchung eine eigene E-Mail mit dem Link.
              </p>
            </div>
            {error && (
              <div className="bg-[var(--color-wh-sunset)]/10 text-[var(--color-wh-sunset)] rounded-[var(--radius-md)] p-4 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                iconLeft={<ArrowLeft size={18} />}
              >
                Zurück
              </Button>
              <Button
                size="lg"
                onClick={submit}
                disabled={submitting}
                iconRight={
                  submitting ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />
                }
              >
                {submitting
                  ? "Leite weiter ..."
                  : `Jetzt zahlen — ${formatEuro(breakdown.totalDueCents)}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 self-start order-first lg:order-last">
        <PriceSummary
          breakdown={breakdown}
          arrival={arrival}
          departure={departure}
          totalPersons={totalPersons}
        />
      </aside>
    </div>
  );
};

const Stepper = ({ step }: { step: Step }) => {
  const labels = ["Datum & Personen", "Pauschalen", "Daten", "Zahlung"];
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto pb-2">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold ${
              i <= step
                ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
                : "bg-[var(--color-wh-winter-grey)] text-[var(--color-wh-fg-muted)]"
            }`}
          >
            {i < step ? <Check size={14} /> : i + 1}
          </span>
          <span
            className={`whitespace-nowrap ${
              i <= step ? "font-semibold text-[var(--color-wh-deep-green)]" : "text-[var(--color-wh-fg-muted)]"
            }`}
          >
            {l}
          </span>
          {i < labels.length - 1 && (
            <span className="hidden sm:inline-block w-6 h-px bg-[var(--color-wh-winter-grey)]" />
          )}
        </div>
      ))}
    </div>
  );
};

const PersonRow = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--color-wh-winter-grey)] last:border-b-0">
    <div className="min-w-0">
      <div className="font-medium text-sm sm:text-base">{label}</div>
      {hint && <div className="text-xs text-[var(--color-wh-fg-muted)]">{hint}</div>}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer text-lg font-semibold"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="Weniger"
      >
        −
      </button>
      <span className="w-8 text-center font-semibold">{value}</span>
      <button
        type="button"
        className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer text-lg font-semibold"
        onClick={() => onChange(value + 1)}
        aria-label="Mehr"
      >
        +
      </button>
    </div>
  </div>
);

const PersonsEditor = ({
  persons,
  onChange,
  memberAllowed,
}: {
  persons: Persons;
  onChange: (p: Persons) => void;
  memberAllowed: boolean;
}) => (
  <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4">
    <PersonRow
      label="Erwachsene (Nichtmitglieder)"
      hint="ab 16 Jahren · 18,00 € / Nacht"
      value={persons.adults}
      onChange={(v) => onChange({ ...persons, adults: v })}
    />
    {memberAllowed ? (
      <PersonRow
        label="Erwachsene Vereinsmitglieder"
        hint="7,50 € / Nacht"
        value={persons.members}
        onChange={(v) => onChange({ ...persons, members: v })}
      />
    ) : (
      <div className="border-b border-[var(--color-wh-winter-grey)]/50 py-3 flex items-center justify-between gap-4 text-sm">
        <div>
          <div className="font-medium text-[var(--color-wh-fg-muted)]">
            Erwachsene Vereinsmitglieder
          </div>
          <div className="text-xs text-[var(--color-wh-fg-muted)]/80">
            Nur für verifizierte Skifreunde-Mitglieder.{" "}
            <a href="/login?callbackUrl=/buchen" className="underline">
              Login
            </a>{" "}
            oder im{" "}
            <a href="/registrieren" className="underline">
              Konto-Profil
            </a>{" "}
            Mitgliedschaft beantragen.
          </div>
        </div>
        <div className="text-[var(--color-wh-fg-muted)]/60 text-sm shrink-0">gesperrt</div>
      </div>
    )}
    <PersonRow
      label="Kinder (4–15 Jahre)"
      hint="10,00 € / Nacht"
      value={persons.children}
      onChange={(v) => onChange({ ...persons, children: v })}
    />
    <PersonRow
      label="Schüler (Schulgruppen)"
      hint="7,50 € / Nacht"
      value={persons.pupils}
      onChange={(v) => onChange({ ...persons, pupils: v })}
    />
    <PersonRow
      label="Lehrkräfte"
      hint="bei Schulgruppen · zählen wie Erwachsene"
      value={persons.teachers}
      onChange={(v) => onChange({ ...persons, teachers: v })}
    />
  </div>
);

const ExtraToggle = ({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
}) => (
  <label className="flex items-start gap-3 p-4 border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] cursor-pointer hover:border-[var(--color-wh-deep-green)] transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-5 h-5 accent-[var(--color-wh-deep-green)]"
    />
    <div>
      <div className="font-semibold text-[var(--color-wh-deep-green)]">{title}</div>
      <div className="text-sm text-[var(--color-wh-fg-muted)] mt-1">{body}</div>
    </div>
  </label>
);

const SegmentedControl = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm font-medium text-[var(--color-wh-deep-green)]">{label}</span>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-11 px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer transition-colors ${
            value === o.value
              ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
              : "bg-white border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

type Breakdown = ReturnType<typeof calculatePrice>;

const PriceSummary = ({
  breakdown,
  arrival,
  departure,
  totalPersons,
}: {
  breakdown: Breakdown | null;
  arrival: string;
  departure: string;
  totalPersons: number;
}) => {
  if (!breakdown) {
    return (
      <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 sm:p-6">
        <div className="eyebrow">Preisübersicht</div>
        <p className="mt-3 text-[var(--color-wh-fg-muted)] text-sm m-0">
          Datum & Personen wählen, um die Preise zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 sm:p-6">
      <div className="eyebrow">Preisübersicht</div>
      <div className="mt-3 text-sm font-semibold">
        {arrival} → {departure} · {breakdown.nights} Nächte · {totalPersons} Personen
      </div>
      <ul className="mt-5 divide-y divide-[var(--color-wh-winter-grey)]">
        {breakdown.lines.map((l) => (
          <li key={l.label + (l.detail ?? "")} className="py-2 flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium">{l.label}</div>
              {l.detail && <div className="text-xs text-[var(--color-wh-fg-muted)]">{l.detail}</div>}
            </div>
            <div className="font-semibold whitespace-nowrap">{formatEuro(l.totalCents)}</div>
          </li>
        ))}
      </ul>

      <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Buchungssumme</span>
          <span className="font-semibold">{formatEuro(breakdown.subtotalCents)}</span>
        </div>
      </div>

      <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-2 text-sm">
        <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
          Heute fällig
        </div>
        <div className="flex justify-between">
          <span>Anzahlung 50 %</span>
          <span className="font-semibold">{formatEuro(breakdown.prepaymentCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>+ Kaution</span>
          <span className="font-semibold">{formatEuro(breakdown.depositCents)}</span>
        </div>
        <div className="flex justify-between text-base pt-2 border-t border-[var(--color-wh-winter-grey)]">
          <span className="font-bold">Heute zu zahlen</span>
          <span className="font-bold text-[var(--color-wh-deep-green)]">
            {formatEuro(breakdown.totalDueCents)}
          </span>
        </div>
      </div>

      <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-1 text-xs text-[var(--color-wh-fg-muted)]">
        <div className="flex justify-between">
          <span>Restzahlung (vor Anreise)</span>
          <span>{formatEuro(breakdown.remainderCents)}</span>
        </div>
        <div>Kurtaxe wird separat über das Hochsauerland-Portal abgerechnet.</div>
      </div>
    </div>
  );
};

const ReviewBlock = ({
  arrival,
  departure,
  nights,
  persons,
  firstName,
  lastName,
  email,
}: {
  arrival: string;
  departure: string;
  nights: number;
  persons: Persons;
  firstName: string;
  lastName: string;
  email: string;
}) => (
  <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">Zeitraum</div>
      <div className="font-semibold">
        {arrival} → {departure}
      </div>
      <div className="text-[var(--color-wh-fg-muted)]">{nights} Nächte</div>
    </div>
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">Personen</div>
      <div className="font-semibold">
        {persons.adults + persons.members + persons.children + persons.pupils + persons.teachers}{" "}
        gesamt
      </div>
      <div className="text-[var(--color-wh-fg-muted)]">
        {[
          persons.adults && `${persons.adults} Erw.`,
          persons.members && `${persons.members} Mitgl.`,
          persons.children && `${persons.children} Kinder`,
          persons.pupils && `${persons.pupils} Schüler`,
          persons.teachers && `${persons.teachers} Lehrer`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </div>
    <div className="sm:col-span-2 pt-3 border-t border-[var(--color-wh-winter-grey)]">
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">Bucher</div>
      <div className="font-semibold">
        {firstName} {lastName}
      </div>
      <div className="text-[var(--color-wh-fg-muted)]">{email}</div>
    </div>
  </div>
);
