"use client";

import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useConsent, useConsentFor } from "./ConsentContext";

type Props = {
  category: "functional" | "analytics" | "marketing";
  /** Plain-language description: what is being embedded? */
  serviceName: string;
  /** Linked privacy policy of the third party (optional). */
  serviceUrl?: string;
  children: ReactNode;
  /** Optional placeholder dimensions. */
  className?: string;
};

/**
 * Guards a third-party embed (map, video, etc.) behind cookie consent.
 * Renders a placeholder with a one-click consent button until the user
 * has granted the relevant category.
 */
export const ConsentGate = ({
  category,
  serviceName,
  serviceUrl,
  children,
  className,
}: Props) => {
  const granted = useConsentFor(category);
  const { save, openSettings } = useConsent();

  if (granted) return <>{children}</>;

  return (
    <div
      className={
        "bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3 " +
        (className ?? "")
      }
    >
      <ShieldAlert className="text-[var(--color-wh-deep-green)]" size={28} strokeWidth={1.5} />
      <h3 className="m-0 text-[18px] sm:text-[20px]">{serviceName} ist nicht aktiv</h3>
      <p className="m-0 text-sm text-[var(--color-wh-fg-muted)] max-w-md leading-relaxed">
        Um diesen Inhalt anzuzeigen, müssen wir Daten an {serviceName} übertragen. Bitte stimme der
        Kategorie „Komfort & Einbettungen" zu — entweder einmalig für diesen Inhalt oder dauerhaft
        in den Cookie-Einstellungen.
        {serviceUrl ? (
          <>
            {" "}
            <a href={serviceUrl} target="_blank" rel="noreferrer" className="underline">
              Datenschutz {serviceName}
            </a>
            .
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-1">
        <button
          type="button"
          onClick={() => save({ [category]: true } as { [k: string]: boolean })}
          className="h-10 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
        >
          {serviceName} aktivieren
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="h-10 px-4 rounded-[var(--radius-btn)] border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-green-soft)] transition-colors"
        >
          Alle Einstellungen
        </button>
      </div>
    </div>
  );
};
