"use client";

import { useState, useTransition } from "react";
import { createGiftCheckoutSession } from "./actions";

const PRESETS = [50, 100, 150, 250];

const inputBase =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none text-[15px]";

export function PurchaseClient() {
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
        <label className="block text-sm font-medium mb-2">Wertbetrag *</label>
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
          <span className="text-[var(--color-wh-fg-muted)]">oder individuell:</span>
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
        <label className="block text-sm font-medium mb-2">Versand *</label>
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
              <p className="font-semibold m-0 text-[14px]">Direkt an Empfänger:in per Mail</p>
              <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                Wir mailen den Gutschein-Code direkt nach Zahlung.
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
              <p className="font-semibold m-0 text-[14px]">Ich drucke selbst</p>
              <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                Wir mailen Dir das druckbare PDF — Du übergibst es persönlich.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Dein Name *</label>
          <input
            name="purchaserName"
            type="text"
            required
            maxLength={200}
            placeholder="z.B. Anna Müller"
            className={inputBase}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deine E-Mail *</label>
          <input
            name="purchaserEmail"
            type="email"
            required
            maxLength={255}
            placeholder="anna@example.com"
            className={inputBase}
          />
        </div>
      </div>

      {delivery === "email" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[var(--color-wh-beige)]/40 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Name des Empfängers *</label>
            <input
              name="recipientName"
              type="text"
              required={delivery === "email"}
              maxLength={200}
              placeholder="z.B. Max Beispiel"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-Mail des Empfängers *</label>
            <input
              name="recipientEmail"
              type="email"
              required={delivery === "email"}
              maxLength={255}
              placeholder="max@example.com"
              className={inputBase}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Persönliche Nachricht (optional)
        </label>
        <textarea
          name="personalMessage"
          rows={3}
          maxLength={1000}
          placeholder={`Erscheint auf dem Gutschein, z.B. „Für dein Wanderwochenende!"`}
          className={inputBase}
        />
      </div>

      <div className="bg-[var(--color-wh-beige)]/60 rounded-lg p-4 text-[13px] text-[var(--color-wh-black)] leading-relaxed">
        <p className="m-0">
          <strong>Gutschein-Bedingungen:</strong> 3 Jahre gültig ab Ausstellung. Einlösbar
          beim Buchen einer Übernachtung. Partielle Einlösung möglich (Restwert bleibt
          auf dem Code, bis erschöpft). Nicht in bar auszahlbar.
        </p>
      </div>

      {error && (
        <p className="text-[14px] text-red-700 bg-red-50 rounded-lg px-3 py-2 m-0">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0">
          Heute fällig: <strong className="text-[var(--color-wh-deep-green)]">{value.toFixed(2)} €</strong>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {pending ? "Weiterleitung zu Stripe …" : `Gutschein kaufen — ${value} €`}
        </button>
      </div>
    </form>
  );
}
