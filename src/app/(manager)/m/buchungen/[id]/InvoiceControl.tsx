"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2, ExternalLink, Check, RefreshCw } from "lucide-react";
import {
  createInvoiceForBookingAction,
  reissueInvoiceForBookingAction,
  type InvoiceRow,
} from "./invoice-actions";

type Props = {
  bookingId: string;
  existing: InvoiceRow | null;
};

export function InvoiceControl({ bookingId, existing }: Props) {
  const [invoice, setInvoice] = useState<InvoiceRow | null>(existing);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [reissueInfo, setReissueInfo] = useState<string | null>(null);

  const create = () => {
    setError(null);
    start(async () => {
      const res = await createInvoiceForBookingAction(bookingId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setInvoice({
        id: res.invoiceId,
        invoiceNumber: res.invoiceNumber,
        status: "ausgestellt",
        issueDate: new Date().toISOString().slice(0, 10),
      });
      if (res.isNew) setJustCreated(true);
    });
  };

  const reissue = () => {
    if (
      !window.confirm(
        `Rechnung ${invoice?.invoiceNumber} wird storniert und mit dem aktuellen Buchungsstand (Personen, Preise) neu ausgestellt — mit neuer Rechnungsnummer. Fortfahren?`
      )
    )
      return;
    setError(null);
    setReissueInfo(null);
    start(async () => {
      const res = await reissueInvoiceForBookingAction(bookingId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setInvoice({
        id: res.invoiceId,
        invoiceNumber: res.invoiceNumber,
        status: "ausgestellt",
        issueDate: new Date().toISOString().slice(0, 10),
      });
      setJustCreated(true);
      if (res.cancelledNumbers.length > 0) {
        setReissueInfo(`${res.cancelledNumbers.join(", ")} storniert.`);
      }
    });
  };

  const pdfUrl = invoice ? `/api/invoices/${invoice.id}/pdf` : null;

  return (
    <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4">
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
        Rechnung
      </div>

      {invoice ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {justCreated && (
              <Check size={14} className="text-[var(--color-wh-deep-green)] shrink-0" />
            )}
            <span className="font-semibold text-[var(--color-wh-deep-green)]">
              {invoice.invoiceNumber}
            </span>
            <span className="text-[var(--color-wh-fg-muted)]">
              · {invoice.issueDate ?? "—"}
            </span>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-wh-deep-green)] underline underline-offset-2 hover:no-underline"
            >
              <FileText size={13} />
              PDF herunterladen
              <ExternalLink size={11} />
            </a>
          )}
          <div>
            <button
              type="button"
              onClick={reissue}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-wh-fg-muted)] underline underline-offset-2 hover:no-underline cursor-pointer bg-transparent border-0 p-0 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Rechnung neu erstellen (alte wird storniert)
            </button>
          </div>
          {reissueInfo && (
            <p className="text-xs text-[var(--color-wh-fg-muted)] m-0">{reissueInfo}</p>
          )}
          {error && <p className="text-xs text-[var(--color-wh-sunset)] m-0">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-wh-fg-muted)] m-0 leading-relaxed">
            Für diese Buchung wurde noch keine Rechnung erstellt.
          </p>
          <button
            type="button"
            onClick={create}
            disabled={pending}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] disabled:opacity-60 transition-colors"
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            {pending ? "Erstelle …" : "Rechnung jetzt erstellen"}
          </button>
          {error && (
            <p className="text-xs text-[var(--color-wh-sunset)] m-0">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
