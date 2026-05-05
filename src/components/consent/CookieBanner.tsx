"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, Settings, X, ShieldCheck } from "lucide-react";
import { useConsent } from "./ConsentContext";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    key: "essential" as const,
    label: "Notwendig",
    body: "Authentifizierung des Manager-Logins, CSRF-Schutz, Buchungs-Sitzung. Diese Cookies sind technisch erforderlich und können nicht abgelehnt werden.",
    locked: true,
  },
  {
    key: "functional" as const,
    label: "Komfort & Einbettungen",
    body: "Erlaubt das Einbetten externer Karten (OpenStreetMap) und Videos (YouTube/Vimeo) in Blog-Beiträgen. Beim Aufruf werden Daten an den jeweiligen Anbieter übertragen.",
    locked: false,
  },
  {
    key: "analytics" as const,
    label: "Statistik",
    body: "Anonyme Nutzungsstatistiken zur Verbesserung der Webseite. Aktuell nicht aktiv — Reservierung für zukünftige privacy-freundliche Tools wie Plausible.",
    locked: false,
  },
  {
    key: "marketing" as const,
    label: "Marketing",
    body: "Personalisierte Werbung außerhalb dieser Webseite. Aktuell nicht aktiv und nicht geplant.",
    locked: false,
  },
];

export const CookieBanner = () => {
  const {
    needsDecision,
    consent,
    settingsOpen,
    closeSettings,
    openSettings,
    acceptAll,
    rejectAll,
    save,
  } = useConsent();

  const [draft, setDraft] = useState({
    functional: false,
    analytics: false,
    marketing: false,
  });

  // Sync draft with current consent each time settings opens
  useEffect(() => {
    if (settingsOpen) {
      setDraft({
        functional: consent?.functional ?? false,
        analytics: consent?.analytics ?? false,
        marketing: consent?.marketing ?? false,
      });
    }
  }, [settingsOpen, consent]);

  const showBanner = needsDecision && !settingsOpen;
  const showModal = settingsOpen;

  if (!showBanner && !showModal) return null;

  return (
    <>
      {showBanner && (
        <div
          role="dialog"
          aria-label="Cookie-Hinweis"
          className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-[460px] z-50 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] shadow-[var(--shadow-deep)] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <Cookie size={22} className="text-[var(--color-wh-deep-green)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="m-0 text-[18px] font-display font-semibold text-[var(--color-wh-deep-green)]">
                Cookies & Datenschutz
              </h2>
              <p className="m-0 mt-2 text-sm leading-relaxed text-[var(--color-wh-fg-muted)]">
                Wir nutzen technisch notwendige Cookies (Login, Buchungs-Sitzung). Optional aktivierst
                Du Karten- und Video-Einbettungen — Daten gehen dann an die jeweiligen Drittanbieter.
                Mehr in der{" "}
                <Link href="/datenschutz" className="underline">
                  Datenschutzerklärung
                </Link>
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={acceptAll}
                  className="h-11 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
                >
                  Alle akzeptieren
                </button>
                <button
                  onClick={rejectAll}
                  className="h-11 px-5 rounded-[var(--radius-btn)] bg-white border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-green-soft)] transition-colors"
                >
                  Nur Notwendige
                </button>
                <button
                  onClick={openSettings}
                  className="h-11 px-3 rounded-[var(--radius-btn)] text-[var(--color-wh-deep-green)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-green-soft)] inline-flex items-center gap-2 transition-colors"
                >
                  <Settings size={16} /> Einstellungen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal
          aria-label="Cookie-Einstellungen"
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSettings();
          }}
        >
          <div className="w-full max-w-[640px] bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-deep)] max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[var(--color-wh-winter-grey)]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} className="text-[var(--color-wh-deep-green)]" />
                <h2 className="m-0 text-[22px]">Cookie-Einstellungen</h2>
              </div>
              <button
                onClick={closeSettings}
                aria-label="Schließen"
                className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-3">
              <p className="text-sm text-[var(--color-wh-fg-muted)] m-0 leading-relaxed">
                Wir verwenden Cookies und ähnliche Technologien gemäß DSGVO und TTDSG. Notwendige
                Cookies sind technisch erforderlich, alles andere ist optional und nur mit Deiner
                Einwilligung aktiv.
              </p>

              {CATEGORIES.map((c) => {
                const checked = c.locked
                  ? true
                  : (draft[c.key as "functional" | "analytics" | "marketing"]);
                return (
                  <label
                    key={c.key}
                    className={cn(
                      "flex items-start gap-4 p-4 border rounded-[var(--radius-card)] transition-colors",
                      c.locked
                        ? "bg-[var(--color-wh-green-soft)]/40 border-[var(--color-wh-green)]/30 cursor-default"
                        : "border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-deep-green)] cursor-pointer"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={c.locked}
                      onChange={(e) => {
                        if (c.locked) return;
                        setDraft({ ...draft, [c.key]: e.target.checked });
                      }}
                      className="mt-1 w-5 h-5 accent-[var(--color-wh-deep-green)]"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--color-wh-deep-green)] flex items-center gap-2">
                        {c.label}
                        {c.locked && (
                          <span className="text-[10px] uppercase tracking-wider bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-2 py-0.5 rounded-full">
                            immer aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-wh-fg-muted)] m-0 mt-1 leading-relaxed">
                        {c.body}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="p-5 sm:p-6 border-t border-[var(--color-wh-winter-grey)] flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={rejectAll}
                  className="h-11 px-5 rounded-[var(--radius-btn)] bg-white border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-green-soft)]"
                >
                  Nur Notwendige
                </button>
                <button
                  onClick={acceptAll}
                  className="h-11 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)]"
                >
                  Alle akzeptieren
                </button>
              </div>
              <button
                onClick={() => save(draft)}
                className="h-11 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-wood)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-wood-hover)]"
              >
                Auswahl speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/** Footer-Link: re-opens the settings modal on click. */
export const CookieSettingsLink = ({ className }: { className?: string }) => {
  const { openSettings } = useConsent();
  return (
    <button
      type="button"
      onClick={openSettings}
      className={cn(
        "text-[var(--color-wh-snow)]/80 hover:underline cursor-pointer bg-transparent p-0 m-0 inline",
        className
      )}
    >
      Cookie-Einstellungen
    </button>
  );
};
