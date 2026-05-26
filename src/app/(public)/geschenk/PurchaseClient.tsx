"use client";

import { useState, useTransition } from "react";
import { Mail, Printer, Gift, ArrowRight, MountainSnow, Sparkles, ShieldCheck } from "lucide-react";
import { createGiftCheckoutSession } from "./actions";
import type { Locale } from "@/lib/i18n-shared";

const PRESETS = [50, 100, 150, 250] as const;

const inputBase =
  "w-full rounded-xl border border-[var(--color-wh-winter-grey)] px-3.5 py-2.5 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none focus:ring-2 focus:ring-[var(--color-wh-deep-green)]/15 text-[15px] transition-colors";

type Copy = {
  // Sections
  s1Label: string;
  s2Label: string;
  s3Label: string;
  s4Label: string;
  // Value
  customLabel: string;
  customSuffix: string;
  hintEqual: (amount: number) => string;
  hint: Record<number | "custom", string>;
  // Delivery
  emailTitle: string;
  emailBody: string;
  printTitle: string;
  printBody: string;
  // Personal
  purchaserName: string;
  purchaserEmail: string;
  recipientName: string;
  recipientEmail: string;
  messageLabel: string;
  messagePlaceholder: string;
  messageHint: string;
  // Voucher preview
  voucherTitle: string;
  voucherFor: string;
  voucherFrom: string;
  voucherWorth: string;
  voucherCode: string;
  voucherValidity: string;
  voucherIssuer: string;
  voucherPreviewHint: string;
  // Submit
  conditions: string;
  due: string;
  submit: string;
  submitting: string;
  recipientNotePlaceholder: string;
  fromPlaceholder: string;
  forPlaceholder: string;
};

const COPY: Record<Locale, Copy> = {
  de: {
    s1Label: "1 · Betrag",
    s2Label: "2 · Versand",
    s3Label: "3 · Wer schenkt wem",
    s4Label: "4 · Persönliche Note",
    customLabel: "Eigener Betrag",
    customSuffix: "€ (25–1.000)",
    hintEqual: (a) =>
      a <= 75
        ? "≈ eine Nacht für vier"
        : a <= 175
          ? "≈ ein Wochenende für vier bis sechs"
          : a <= 350
            ? "≈ ein Wochenende für die ganze Gruppe"
            : "≈ eine kleine Klassenfahrt",
    hint: {
      50: "≈ Frühstück & Glühwein",
      100: "≈ eine Nacht für vier",
      150: "≈ ein Wochenende zu zweit",
      250: "≈ ein Wochenende für sechs",
      custom: "",
    },
    emailTitle: "Direkt per E-Mail",
    emailBody: "Wir mailen Code + persönliche Nachricht sofort nach Zahlung an die Beschenkten.",
    printTitle: "Ich drucke selbst",
    printBody: "Du bekommst das druckbare PDF — übergibst es persönlich beim Geburtstag, Weihnachten, an der Tür.",
    purchaserName: "Dein Name",
    purchaserEmail: "Deine E-Mail",
    recipientName: "Name der Beschenkten",
    recipientEmail: "E-Mail der Beschenkten",
    messageLabel: "Persönliche Nachricht (optional)",
    messagePlaceholder: "z. B. Für Dein Wanderwochenende!",
    messageHint: "Erscheint im Versand auf dem Gutschein.",
    voucherTitle: "Wiesenhütten-Gutschein",
    voucherFor: "Für",
    voucherFrom: "Von",
    voucherWorth: "Wert",
    voucherCode: "WH-GIFT-XXXX-XXXX",
    voucherValidity: "Gültig 3 Jahre · Skifreunde Gütersloh e.V.",
    voucherIssuer: "Wiesenhütte · Langewiese",
    voucherPreviewHint: "So sieht der fertige Gutschein aus.",
    conditions:
      "Gutschein-Bedingungen: 3 Jahre gültig ab Ausstellung. Einlösbar beim Buchen einer Übernachtung. Partielle Einlösung möglich (Restwert bleibt auf dem Code, bis erschöpft). Nicht in bar auszahlbar.",
    due: "Heute fällig",
    submit: "Gutschein kaufen",
    submitting: "Weiterleitung zu Stripe …",
    recipientNotePlaceholder: "Deine Nachricht erscheint hier ...",
    fromPlaceholder: "Dein Name",
    forPlaceholder: "Name der Beschenkten",
  },
  en: {
    s1Label: "1 · Amount",
    s2Label: "2 · Delivery",
    s3Label: "3 · Who gives to whom",
    s4Label: "4 · Personal note",
    customLabel: "Custom amount",
    customSuffix: "€ (25–1,000)",
    hintEqual: (a) =>
      a <= 75
        ? "≈ breakfast for four"
        : a <= 175
          ? "≈ one night for four to six"
          : a <= 350
            ? "≈ a weekend for the whole family"
            : "≈ a small school trip",
    hint: {
      50: "≈ breakfast & mulled wine",
      100: "≈ one night for four",
      150: "≈ a weekend for two",
      250: "≈ a weekend for six",
      custom: "",
    },
    emailTitle: "Directly by email",
    emailBody: "We'll email the code and your personal note to the recipient right after payment.",
    printTitle: "I'll print it myself",
    printBody: "You'll get a printable PDF — hand it over in person for a birthday, Christmas, at the door.",
    purchaserName: "Your name",
    purchaserEmail: "Your email",
    recipientName: "Recipient's name",
    recipientEmail: "Recipient's email",
    messageLabel: "Personal note (optional)",
    messagePlaceholder: "e.g. For your hiking weekend!",
    messageHint: "Appears on the voucher when delivered.",
    voucherTitle: "Wiesenhütte gift voucher",
    voucherFor: "For",
    voucherFrom: "From",
    voucherWorth: "Value",
    voucherCode: "WH-GIFT-XXXX-XXXX",
    voucherValidity: "Valid 3 years · Skifreunde Gütersloh e.V.",
    voucherIssuer: "Wiesenhütte · Langewiese",
    voucherPreviewHint: "This is what the finished voucher looks like.",
    conditions:
      "Voucher terms: valid for 3 years from issue. Redeemable when booking a stay. Partial redemption possible (remaining value stays on the code until used up). Not redeemable for cash.",
    due: "Due today",
    submit: "Buy voucher",
    submitting: "Redirecting to Stripe …",
    recipientNotePlaceholder: "Your message will appear here ...",
    fromPlaceholder: "Your name",
    forPlaceholder: "Recipient's name",
  },
  nl: {
    s1Label: "1 · Bedrag",
    s2Label: "2 · Verzending",
    s3Label: "3 · Wie geeft aan wie",
    s4Label: "4 · Persoonlijk berichtje",
    customLabel: "Eigen bedrag",
    customSuffix: "€ (25–1.000)",
    hintEqual: (a) =>
      a <= 75
        ? "≈ ontbijt voor vier"
        : a <= 175
          ? "≈ één nacht voor vier tot zes"
          : a <= 350
            ? "≈ een weekend voor het hele gezin"
            : "≈ een kleine schoolreis",
    hint: {
      50: "≈ ontbijt & glühwein",
      100: "≈ één nacht voor vier",
      150: "≈ een weekend voor twee",
      250: "≈ een weekend voor zes",
      custom: "",
    },
    emailTitle: "Direct per e-mail",
    emailBody: "Wij mailen de code en je berichtje direct na betaling naar de ontvanger.",
    printTitle: "Ik print zelf",
    printBody: "Jij krijgt een afdrukbare PDF — overhandig persoonlijk voor verjaardag, kerst, aan de deur.",
    purchaserName: "Jouw naam",
    purchaserEmail: "Jouw e-mail",
    recipientName: "Naam ontvanger",
    recipientEmail: "E-mail ontvanger",
    messageLabel: "Persoonlijk berichtje (optioneel)",
    messagePlaceholder: "bv. Voor jullie wandelweekend!",
    messageHint: "Verschijnt op de cadeaubon bij verzending.",
    voucherTitle: "Wiesenhütte-cadeaubon",
    voucherFor: "Voor",
    voucherFrom: "Van",
    voucherWorth: "Waarde",
    voucherCode: "WH-GIFT-XXXX-XXXX",
    voucherValidity: "3 jaar geldig · Skifreunde Gütersloh e.V.",
    voucherIssuer: "Wiesenhütte · Langewiese",
    voucherPreviewHint: "Zo ziet de uiteindelijke cadeaubon eruit.",
    conditions:
      "Voorwaarden: 3 jaar geldig vanaf uitgifte. In te wisselen bij boeking van een verblijf. Gedeeltelijk inwisselen mogelijk (restwaarde blijft op de code tot op). Niet uit te betalen in contanten.",
    due: "Vandaag te betalen",
    submit: "Cadeaubon kopen",
    submitting: "Doorsturen naar Stripe …",
    recipientNotePlaceholder: "Je bericht verschijnt hier ...",
    fromPlaceholder: "Jouw naam",
    forPlaceholder: "Naam ontvanger",
  },
};

export function PurchaseClient({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [value, setValue] = useState(100);
  const [isCustom, setIsCustom] = useState(false);
  const [delivery, setDelivery] = useState<"email" | "print">("email");
  const [purchaserName, setPurchaserName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hintKey: keyof typeof c.hint = isCustom ? "custom" : ((value as unknown) as keyof typeof c.hint);
  const valueHint = isCustom ? c.hintEqual(value) : c.hint[hintKey] || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-8 lg:gap-12 items-start">
      {/* ============= LEFT: FORM ============= */}
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            fd.set("valueEuros", String(value));
            fd.set("deliveryMode", delivery);
            const r = await createGiftCheckoutSession(fd);
            if (r.ok) {
              window.location.href = r.checkoutUrl;
            } else {
              setError(r.error);
            }
          })
        }
        className="bg-white border border-[var(--color-wh-winter-grey)] rounded-3xl p-6 sm:p-8 space-y-8 shadow-[0_20px_50px_rgba(47,74,53,0.08)]"
      >
        {/* Section 1: Betrag */}
        <fieldset className="space-y-4">
          <legend className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]">
            {c.s1Label}
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((v) => {
              const active = !isCustom && value === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setValue(v);
                    setIsCustom(false);
                  }}
                  className={`relative rounded-2xl border-2 px-3 py-4 text-center transition-all ${
                    active
                      ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-green-soft)] shadow-[0_4px_16px_rgba(47,74,53,0.12)]"
                      : "border-[var(--color-wh-winter-grey)] bg-white hover:border-[var(--color-wh-deep-green)]/50 hover:bg-[var(--color-wh-beige)]/40"
                  }`}
                >
                  <span className="block font-display font-bold text-[var(--color-wh-deep-green)] text-2xl leading-none mb-1">
                    {v}
                  </span>
                  <span className="block text-[10px] text-[var(--color-wh-fg-muted)] uppercase tracking-wider">
                    Euro
                  </span>
                </button>
              );
            })}
          </div>
          {/* Custom */}
          <div className="flex items-center gap-3 pt-1">
            <label className="flex-1 inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCustom}
                onChange={(e) => setIsCustom(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-wh-deep-green)]"
              />
              <span className="text-sm text-[var(--color-wh-fg-muted)]">{c.customLabel}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={25}
                max={1000}
                step={5}
                value={value}
                disabled={!isCustom}
                onChange={(e) =>
                  setValue(Math.max(25, Math.min(1000, Number(e.target.value) || 25)))
                }
                className={`${inputBase} w-24 text-right disabled:bg-[var(--color-wh-beige)]/40 disabled:cursor-not-allowed`}
              />
              <span className="text-xs text-[var(--color-wh-fg-muted)] whitespace-nowrap">
                {c.customSuffix}
              </span>
            </div>
          </div>
          {valueHint && (
            <p className="text-xs text-[var(--color-wh-deep-green)]/70 italic m-0 -mt-1">
              {valueHint}
            </p>
          )}
        </fieldset>

        <div className="h-px bg-[var(--color-wh-winter-grey)]" />

        {/* Section 2: Versand */}
        <fieldset className="space-y-4">
          <legend className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]">
            {c.s2Label}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DeliveryOption
              icon={Mail}
              active={delivery === "email"}
              onClick={() => setDelivery("email")}
              title={c.emailTitle}
              body={c.emailBody}
            />
            <DeliveryOption
              icon={Printer}
              active={delivery === "print"}
              onClick={() => setDelivery("print")}
              title={c.printTitle}
              body={c.printBody}
            />
          </div>
        </fieldset>

        <div className="h-px bg-[var(--color-wh-winter-grey)]" />

        {/* Section 3: Personen */}
        <fieldset className="space-y-4">
          <legend className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]">
            {c.s3Label}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={c.purchaserName}>
              <input
                name="purchaserName"
                type="text"
                required
                maxLength={200}
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                className={inputBase}
              />
            </Field>
            <Field label={c.purchaserEmail}>
              <input
                name="purchaserEmail"
                type="email"
                required
                maxLength={255}
                className={inputBase}
              />
            </Field>
          </div>

          {delivery === "email" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--color-wh-beige)]/50 border border-[var(--color-wh-beige)] rounded-2xl p-4">
              <Field label={c.recipientName}>
                <input
                  name="recipientName"
                  type="text"
                  required={delivery === "email"}
                  maxLength={200}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className={inputBase}
                />
              </Field>
              <Field label={c.recipientEmail}>
                <input
                  name="recipientEmail"
                  type="email"
                  required={delivery === "email"}
                  maxLength={255}
                  className={inputBase}
                />
              </Field>
            </div>
          )}
        </fieldset>

        <div className="h-px bg-[var(--color-wh-winter-grey)]" />

        {/* Section 4: Persönliche Note */}
        <fieldset className="space-y-2">
          <legend className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]">
            {c.s4Label}
          </legend>
          <textarea
            name="personalMessage"
            rows={3}
            maxLength={1000}
            placeholder={c.messagePlaceholder}
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            className={`${inputBase} resize-y`}
          />
          <p className="text-xs text-[var(--color-wh-fg-muted)] m-0">{c.messageHint}</p>
        </fieldset>

        {/* Conditions */}
        <div className="bg-[var(--color-wh-beige)]/60 border border-[var(--color-wh-winter-grey)] rounded-xl p-4 text-[12px] sm:text-[13px] text-[var(--color-wh-black)]/80 leading-relaxed">
          {c.conditions}
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 m-0">
            {error}
          </p>
        )}

        {/* Submit row */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] m-0 mb-0.5">
              {c.due}
            </p>
            <p className="font-display font-bold text-[var(--color-wh-deep-green)] text-2xl sm:text-3xl m-0 tabular-nums">
              {value.toFixed(2)} €
            </p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-7 py-3.5 text-sm sm:text-base font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity shadow-[0_8px_24px_rgba(47,74,53,0.2)]"
          >
            {pending ? c.submitting : c.submit}
            {!pending && <ArrowRight size={18} />}
          </button>
        </div>
      </form>

      {/* ============= RIGHT: LIVE VOUCHER PREVIEW ============= */}
      <div className="lg:sticky lg:top-24 self-start">
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-wh-fg-muted)] mb-3 text-center lg:text-left">
          ✨ {c.voucherPreviewHint}
        </p>
        <VoucherPreview
          value={value}
          recipientName={recipientName || c.forPlaceholder}
          purchaserName={purchaserName || c.fromPlaceholder}
          personalMessage={personalMessage || c.recipientNotePlaceholder}
          c={c}
        />
      </div>
    </div>
  );
}

// ============= HELPER COMPONENTS =============

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-[12px] font-semibold text-[var(--color-wh-deep-green)] mb-1.5">
      {label}
    </span>
    {children}
  </label>
);

const DeliveryOption = ({
  icon: Icon,
  active,
  onClick,
  title,
  body,
}: {
  icon: typeof Mail;
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${
      active
        ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-green-soft)] shadow-[0_4px_16px_rgba(47,74,53,0.10)]"
        : "border-[var(--color-wh-winter-grey)] bg-white hover:border-[var(--color-wh-deep-green)]/50 hover:bg-[var(--color-wh-beige)]/40"
    }`}
  >
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        active
          ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
          : "bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)]"
      }`}
    >
      <Icon size={16} strokeWidth={1.6} />
    </div>
    <div className="min-w-0">
      <p className="font-semibold m-0 text-[14px] text-[var(--color-wh-deep-green)] leading-snug">
        {title}
      </p>
      <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-1 leading-snug">{body}</p>
    </div>
  </button>
);

/**
 * Live-Voucher-Vorschau — sieht aus wie ein echter Papier-Gutschein,
 * aktualisiert sich live mit Form-State.
 */
const VoucherPreview = ({
  value,
  recipientName,
  purchaserName,
  personalMessage,
  c,
}: {
  value: number;
  recipientName: string;
  purchaserName: string;
  personalMessage: string;
  c: Copy;
}) => {
  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-[var(--color-wh-winter-grey)] shadow-[0_24px_70px_rgba(47,74,53,0.18)]"
      style={{
        background:
          "linear-gradient(135deg, #f9f4e7 0%, #f0e8d2 45%, #e8dec2 100%)",
        transform: "rotate(0.5deg)",
      }}
    >
      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(120,90,40,0.08) 0px, transparent 30%)," +
            "radial-gradient(circle at 82% 76%, rgba(80,60,30,0.06) 0px, transparent 35%)," +
            "radial-gradient(circle at 40% 92%, rgba(140,110,60,0.05) 0px, transparent 25%)",
        }}
        aria-hidden
      />

      {/* Decorative dotted border */}
      <div
        className="absolute inset-3 border-2 border-dashed rounded-2xl pointer-events-none"
        style={{ borderColor: "rgba(47,74,53,0.18)" }}
        aria-hidden
      />

      <div className="relative p-7 sm:p-9 flex flex-col gap-4">
        {/* Top: brand + title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MountainSnow size={20} className="text-[var(--color-wh-deep-green)]" strokeWidth={1.6} />
            <div>
              <p className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 text-[15px] leading-tight">
                Wiesenhütte
              </p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--color-wh-deep-green)]/60 m-0 mt-0.5">
                Langewiese
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--color-wh-deep-green)]/60 m-0">
              Geschenk
            </p>
            <p className="font-display font-bold text-[var(--color-wh-deep-green)] text-[11px] m-0 mt-0.5">
              {c.voucherTitle}
            </p>
          </div>
        </div>

        {/* Decorative center: amount */}
        <div className="text-center py-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-wh-deep-green)]/60 m-0 mb-2">
            {c.voucherWorth}
          </p>
          <div
            className="font-display font-extrabold text-[var(--color-wh-deep-green)] leading-none tabular-nums transition-all duration-300"
            style={{ fontSize: "clamp(64px, 9vw, 96px)", letterSpacing: "-0.04em" }}
          >
            {value}
            <span className="text-[0.5em] align-top ml-1">€</span>
          </div>
        </div>

        {/* For / From */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-wh-deep-green)]/15">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--color-wh-deep-green)]/60 m-0 mb-1">
              {c.voucherFor}
            </p>
            <p className="font-display font-semibold text-[var(--color-wh-deep-green)] text-[15px] m-0 break-words">
              {recipientName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--color-wh-deep-green)]/60 m-0 mb-1">
              {c.voucherFrom}
            </p>
            <p className="font-display font-semibold text-[var(--color-wh-deep-green)] text-[15px] m-0 break-words">
              {purchaserName}
            </p>
          </div>
        </div>

        {/* Personal message */}
        <div className="mt-1">
          <p
            className="italic text-[var(--color-wh-deep-green)]/85 text-[14px] leading-relaxed m-0 min-h-[2.5em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            „{personalMessage}"
          </p>
        </div>

        {/* Code placeholder */}
        <div className="mt-2 flex items-center gap-2">
          <Gift size={14} className="text-[var(--color-wh-deep-green)]/60 shrink-0" />
          <code className="font-mono text-[12px] tracking-[0.15em] text-[var(--color-wh-deep-green)]/70 break-all">
            {c.voucherCode}
          </code>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--color-wh-deep-green)]/15 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.2em] text-[var(--color-wh-deep-green)]/55">
          <span className="flex items-center gap-1">
            <Sparkles size={9} />
            {c.voucherValidity}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={9} />
            {c.voucherIssuer}
          </span>
        </div>
      </div>

      {/* Decorative corner stamp */}
      <div
        className="absolute -bottom-4 -right-4 w-28 h-28 rounded-full flex items-center justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]/40 border-2 border-dashed border-[var(--color-wh-deep-green)]/25 rotate-[-12deg]"
        aria-hidden
      >
        seit 1956
      </div>
    </div>
  );
};
