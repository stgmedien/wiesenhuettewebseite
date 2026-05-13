"use client";

import { useState, useTransition } from "react";
import { createGiftCheckoutSession } from "./actions";
import type { Locale } from "@/lib/i18n-shared";

const PRESETS = [50, 100, 150, 250];

const inputBase =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none text-[15px]";

type Copy = {
  value: string;
  custom: string;
  delivery: string;
  email: { title: string; body: string };
  print: { title: string; body: string };
  purchaserName: string;
  purchaserEmail: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  messageHint: string;
  conditions: string;
  due: string;
  submit: string;
  submitting: string;
};

const COPY: Record<Locale, Copy> = {
  de: {
    value: "Wertbetrag *",
    custom: "oder individuell:",
    delivery: "Versand *",
    email: { title: "Direkt an Empfänger:in per Mail", body: "Wir mailen den Gutschein-Code direkt nach Zahlung." },
    print: { title: "Ich drucke selbst", body: "Wir mailen Dir das druckbare PDF — Du übergibst es persönlich." },
    purchaserName: "Dein Name *",
    purchaserEmail: "Deine E-Mail *",
    recipientName: "Name des Empfängers *",
    recipientEmail: "E-Mail des Empfängers *",
    message: "Persönliche Nachricht (optional)",
    messageHint: `Erscheint auf dem Gutschein, z.B. „Für dein Wanderwochenende!"`,
    conditions: "Gutschein-Bedingungen: 3 Jahre gültig ab Ausstellung. Einlösbar beim Buchen einer Übernachtung. Partielle Einlösung möglich (Restwert bleibt auf dem Code, bis erschöpft). Nicht in bar auszahlbar.",
    due: "Heute fällig:",
    submit: "Gutschein kaufen",
    submitting: "Weiterleitung zu Stripe …",
  },
  en: {
    value: "Value *",
    custom: "or custom:",
    delivery: "Delivery *",
    email: { title: "Directly to recipient by email", body: "We'll email the voucher code right after payment." },
    print: { title: "I'll print it myself", body: "We'll email you the printable PDF — you hand it over in person." },
    purchaserName: "Your name *",
    purchaserEmail: "Your email *",
    recipientName: "Recipient's name *",
    recipientEmail: "Recipient's email *",
    message: "Personal message (optional)",
    messageHint: `Appears on the voucher, e.g. "For your hiking weekend!"`,
    conditions: "Voucher terms: Valid for 3 years from issue date. Redeemable when booking a stay. Partial redemption possible (remaining value stays on the code until used up). Not redeemable for cash.",
    due: "Due today:",
    submit: "Buy voucher",
    submitting: "Redirecting to Stripe …",
  },
  nl: {
    value: "Waarde *",
    custom: "of zelf bepalen:",
    delivery: "Verzending *",
    email: { title: "Direct naar ontvanger per mail", body: "We mailen de code direct na betaling." },
    print: { title: "Ik print zelf", body: "We mailen je de afdrukbare PDF — jij overhandigt persoonlijk." },
    purchaserName: "Jouw naam *",
    purchaserEmail: "Jouw e-mail *",
    recipientName: "Naam ontvanger *",
    recipientEmail: "E-mail ontvanger *",
    message: "Persoonlijk bericht (optioneel)",
    messageHint: `Verschijnt op de cadeaubon, bv. "Voor jullie wandelweekend!"`,
    conditions: "Voorwaarden: 3 jaar geldig vanaf uitgifte. In te wisselen bij boeking van een verblijf. Gedeeltelijk inwisselen mogelijk (restwaarde blijft op de code tot op). Niet uit te betalen in contanten.",
    due: "Vandaag te betalen:",
    submit: "Cadeaubon kopen",
    submitting: "Doorsturen naar Stripe …",
  },
};

export function PurchaseClient({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [value, setValue] = useState(100);
  const [delivery, setDelivery] = useState<"email" | "print">("email");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
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
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium mb-2">{c.value}</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setValue(v)}
              className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold transition ${
                value === v
                  ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-beige)]"
                  : "border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-deep-green)]/60"
              }`}
            >
              {v} €
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-wh-fg-muted)]">{c.custom}</span>
          <input
            type="number"
            min={25}
            max={1000}
            step={5}
            value={value}
            onChange={(e) =>
              setValue(Math.max(25, Math.min(1000, Number(e.target.value) || 25)))
            }
            className={`${inputBase} w-32`}
          />
          <span className="text-[var(--color-wh-fg-muted)]">€ (25–1.000)</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{c.delivery}</label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
              delivery === "email"
                ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-beige)]"
                : "border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-deep-green)]/60"
            }`}
          >
            <input
              type="radio"
              name="deliveryMode"
              checked={delivery === "email"}
              onChange={() => setDelivery("email")}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold m-0 text-[14px]">{c.email.title}</p>
              <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                {c.email.body}
              </p>
            </div>
          </label>
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
              delivery === "print"
                ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-beige)]"
                : "border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-deep-green)]/60"
            }`}
          >
            <input
              type="radio"
              name="deliveryMode"
              checked={delivery === "print"}
              onChange={() => setDelivery("print")}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold m-0 text-[14px]">{c.print.title}</p>
              <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                {c.print.body}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{c.purchaserName}</label>
          <input
            name="purchaserName"
            type="text"
            required
            maxLength={200}
            className={inputBase}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{c.purchaserEmail}</label>
          <input
            name="purchaserEmail"
            type="email"
            required
            maxLength={255}
            className={inputBase}
          />
        </div>
      </div>

      {delivery === "email" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[var(--color-wh-beige)]/40 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">{c.recipientName}</label>
            <input
              name="recipientName"
              type="text"
              required={delivery === "email"}
              maxLength={200}
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{c.recipientEmail}</label>
            <input
              name="recipientEmail"
              type="email"
              required={delivery === "email"}
              maxLength={255}
              className={inputBase}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{c.message}</label>
        <textarea
          name="personalMessage"
          rows={3}
          maxLength={1000}
          placeholder={c.messageHint}
          className={inputBase}
        />
      </div>

      <div className="bg-[var(--color-wh-beige)]/60 rounded-lg p-4 text-[13px] text-[var(--color-wh-black)] leading-relaxed">
        <p className="m-0">{c.conditions}</p>
      </div>

      {error && (
        <p className="text-[14px] text-red-700 bg-red-50 rounded-lg px-3 py-2 m-0">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0">
          {c.due} <strong className="text-[var(--color-wh-deep-green)]">{value.toFixed(2)} €</strong>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {pending ? c.submitting : `${c.submit} — ${value} €`}
        </button>
      </div>
    </form>
  );
}
