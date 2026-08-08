"use client";

// Gruppen-Hub-Sektion auf der Buchungs-Detailseite: Der Buchende erzeugt hier
// den teilbaren Planungs-Link für seine Mitreisenden (Stil angelehnt an
// AddPersonsForm/ExtendStayForm).

import { useState, useTransition } from "react";
import { createGroupHubLink } from "./actions";

type Props = {
  bookingId: string;
  /** Bereits existierender Hub-Link (Server-seitig geladen), sonst null. */
  existingUrl: string | null;
};

export function GroupHubSection({ bookingId, existingUrl }: Props) {
  const [url, setUrl] = useState<string | null>(existingUrl);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const create = () => {
    setError(null);
    start(async () => {
      const res = await createGroupHubLink({ bookingId });
      if (res.ok) {
        setUrl(res.url);
      } else {
        setError(res.error);
      }
    });
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback für ältere Browser: Link ist sichtbar und manuell kopierbar.
      setError("Kopieren hat nicht geklappt — markiert den Link einfach von Hand.");
    }
  };

  const share = () => {
    if (!url) return;
    if (typeof navigator.share === "function") {
      navigator
        .share({
          title: "Unser Gruppen-Hub für die Wiesenhütte",
          text: "Hier planen wir Packliste, Essen, Zimmer und Mitfahrten für unsere Hüttenfahrt:",
          url,
        })
        .catch(() => {
          /* Nutzer hat das Teilen abgebrochen — kein Fehler */
        });
    } else {
      void copy();
    }
  };

  return (
    <section className="rounded-2xl bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] p-6 mb-6">
      <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-1">
        🏔️ Gruppen-Hub
      </h2>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-4">
        Plant Euren Aufenthalt gemeinsam: Packliste zum Abhaken, Essensplan, Zimmeraufteilung
        und Mitfahrbörse — alle mit dem Link können mitmachen, ganz ohne Login. Der Link
        zeigt nur Zeitraum und Personenzahl, keine Buchungs- oder Zahlungsdaten.
      </p>

      {!url ? (
        <>
          <button
            type="button"
            onClick={create}
            disabled={pending}
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-3 text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Wird erstellt …" : "Hub-Link für Eure Gruppe erstellen"}
          </button>
          {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/50 px-4 py-3">
            <p className="text-xs text-[var(--color-wh-black)]/60 m-0 mb-1">Euer Hub-Link:</p>
            <p className="font-mono text-[13px] break-all m-0 text-[var(--color-wh-deep-green)]">
              {url}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copy}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold cursor-pointer hover:opacity-90"
            >
              {copied ? "✓ Kopiert!" : "Link kopieren"}
            </button>
            <button
              type="button"
              onClick={share}
              className="rounded-full border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2.5 text-sm font-semibold cursor-pointer hover:bg-white"
            >
              Teilen
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2.5 text-sm font-semibold no-underline hover:bg-white"
            >
              Hub öffnen ↗
            </a>
          </div>
          <p className="text-xs text-[var(--color-wh-black)]/60 m-0">
            Teilt den Link einfach in Eurem Gruppen-Chat — jede:r mit dem Link kann Einträge
            hinzufügen, abhaken und löschen.
          </p>
          {error && <p className="text-sm text-red-700 m-0">{error}</p>}
        </div>
      )}
    </section>
  );
}
