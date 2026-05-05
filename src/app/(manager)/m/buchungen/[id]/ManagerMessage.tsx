"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, BadgeEuro, X, Copy, Check } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { sendBookingMessage } from "./actions";

export function ManagerMessage({
  bookingId,
  guestEmail,
  guestName,
  bookingNumber,
}: {
  bookingId: string;
  guestEmail: string;
  guestName: string;
  bookingNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [subject, setSubject] = useState(`Buchung ${bookingNumber} — Nachricht von der Wiesenhütte`);
  const [body, setBody] = useState(
    `Hallo ${guestName.split(" ")[0]},\n\nhier ist eine Nachricht zu Eurer Buchung ${bookingNumber}.\n\n`
  );
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ paymentUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await sendBookingMessage({
        bookingId,
        subject,
        body,
        paymentEnabled,
        paymentAmountEuros: paymentEnabled ? Number(amount) : undefined,
        paymentReason: paymentEnabled ? reason : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess({ paymentUrl: res.paymentUrl });
      router.refresh();
    });
  };

  const copyLink = async () => {
    if (success?.paymentUrl) {
      await navigator.clipboard.writeText(success.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-11 px-5 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
      >
        <Mail size={16} /> Mail an Bucher senden
      </button>
    );
  }

  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 sm:p-6 mt-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="eyebrow">Mail an {guestEmail}</div>
          <h3 className="text-[20px] m-0 mt-1">Nachricht & optionaler Zahlungslink</h3>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input
          id="subject"
          label="Betreff"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <Textarea
          id="body"
          label="Nachricht"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          required
        />

        <div className="border-t border-[var(--color-wh-winter-grey)] pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentEnabled}
              onChange={(e) => setPaymentEnabled(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[var(--color-wh-deep-green)]"
            />
            <div>
              <div className="font-semibold text-[var(--color-wh-deep-green)] flex items-center gap-1.5">
                <BadgeEuro size={16} /> Zahlungslink dazu erzeugen
              </div>
              <div className="text-xs text-[var(--color-wh-fg-muted)] mt-1">
                Erstellt eine Stripe-Checkout-URL und fügt sie in die Mail ein. Beispiel: Restzahlung,
                Schadensersatz, Zusatzleistung.
              </div>
            </div>
          </label>

          {paymentEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 mt-4">
              <Input
                id="amount"
                label="Betrag in €"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="z. B. 49,90"
                required={paymentEnabled}
              />
              <Input
                id="reason"
                label="Zweck (wird im Stripe-Beleg angezeigt)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="z. B. Schadensersatz: gesprungene Glasscheibe"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] px-3 py-3 rounded-md font-medium space-y-2">
            <div className="flex items-center gap-2">
              <Check size={16} /> Mail wurde versendet.
            </div>
            {success.paymentUrl && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs truncate flex-1 bg-white/60 px-2 py-1.5 rounded">
                  {success.paymentUrl}
                </span>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex h-8 px-3 items-center gap-1 rounded-md bg-white text-[var(--color-wh-deep-green)] text-xs font-semibold cursor-pointer hover:bg-[var(--color-wh-snow)]"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Kopiert" : "Kopieren"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Schließen
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Sende ..." : "Mail senden"}
          </Button>
        </div>
      </form>
    </div>
  );
}
