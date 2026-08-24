"use client";

import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";

type PlanItem = { titel: string; tagesanteil: number };

export function ProgrammUebersichtModal({
  open,
  onClose,
  fahrtItems,
  projektItems,
}: {
  open: boolean;
  onClose: () => void;
  fahrtItems: PlanItem[];
  projektItems?: PlanItem[];
}) {
  if (!open) return null;

  const alleItems = [...fahrtItems, ...(projektItems ?? [])];

  return createPortal(
    <div
      id="programm-druck"
      className="fixed inset-0 z-[100] bg-black/40 flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-8"
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #programm-druck, #programm-druck * { visibility: visible; }
          #programm-druck {
            position: absolute; inset: 0; background: white; padding: 24px;
            overflow: visible;
          }
          #programm-druck .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white rounded-[var(--radius-card,16px)] max-w-[640px] w-full p-6 sm:p-8 relative">
        <button
          type="button"
          onClick={onClose}
          className="no-print absolute right-4 top-4 text-[var(--color-wh-fg-muted,#5b5b56)] hover:text-black"
          aria-label="Schließen"
        >
          <X size={20} />
        </button>

        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted,#5b5b56)] mb-1">
          Wiesenhütte
        </p>
        <h2 className="font-display font-bold text-[24px] sm:text-[28px] text-[var(--color-wh-deep-green,#2F4A35)] mt-0 mb-1">
          Programm-Übersicht
        </h2>
        <p className="text-[14px] text-[var(--color-wh-fg-muted,#5b5b56)] mb-6">
          Eure Auswahl zum Ausdrucken und Mitnehmen.
        </p>

        {alleItems.length > 0 ? (
          <div className="mb-6">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green,#2F4A35)] mb-2">
              Eure Auswahl
            </p>
            <ul className="text-[14px] leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {alleItems.map((it) => (
                <li key={it.titel}>
                  {it.titel} <span className="text-[var(--color-wh-fg-muted,#5b5b56)]">(≈ {it.tagesanteil.toFixed(1)} Tag)</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[14px] text-[var(--color-wh-fg-muted,#5b5b56)] mb-6">
            Noch nichts ausgewählt.
          </p>
        )}

        <div className="bg-[var(--color-wh-beige,#EFE6D8)] rounded-[var(--radius-md,10px)] p-4 mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green,#2F4A35)] mb-2">
            Nicht vergessen
          </p>
          <ul className="text-[13.5px] leading-relaxed list-disc list-inside space-y-1">
            <li>Küchendienst für Frühstück, Mittag- und Abendessen einteilen</li>
            <li>Einkaufen einplanen — meist am Anreisetag</li>
            <li>
              Abspül-/Reinigungsdienst: Geschirrspüler muss am Abreisetag fertig durchgelaufen und
              ausgeräumt sein (siehe Hausordnung)
            </li>
            <li>Ein paar freie Blöcke ohne festes Programm lassen</li>
            <li>Fußballplatz und Spielplatz ausprobieren — direkt im Ort, kostenfrei</li>
          </ul>
        </div>

        <div className="no-print flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-full font-semibold border border-[var(--color-wh-winter-grey,#C8CEC4)]"
          >
            Schließen
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full font-semibold bg-[var(--color-wh-deep-green,#2F4A35)] text-white"
          >
            <Printer size={16} /> Drucken
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
