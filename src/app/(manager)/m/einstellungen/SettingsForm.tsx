"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, BrushCleaning } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { saveSiteSettings } from "./actions";

type Props = {
  initial: { cleaningDaysAfterDeparture: number };
  updatedAt: string | null;
  updatedBy: string | null;
};

export default function SettingsForm({ initial, updatedAt, updatedBy }: Props) {
  const router = useRouter();
  const [cleaningDays, setCleaningDays] = useState(initial.cleaningDaysAfterDeparture);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const dirty = cleaningDays !== initial.cleaningDaysAfterDeparture;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveSiteSettings({ cleaningDaysAfterDeparture: cleaningDays });
      if (!res.ok) {
        setError(res.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden"
    >
      <div className="p-6 sm:p-8 space-y-6">
        <SettingRow
          icon={<BrushCleaning size={22} className="text-[var(--color-wh-deep-green)]" />}
          title="Reinigungspuffer nach Abreise"
          description="Anzahl Tage, an denen die Hütte nach einer Abreise nicht buchbar ist. 1 = nur der Abreisetag selbst (Standardfall — Reinigung am Tag der Abreise, Folgegäste können am nächsten Tag anreisen). 0 = back-to-back-Buchungen erlaubt."
        >
          <div className="flex items-center gap-2 flex-wrap">
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCleaningDays(n)}
                className={`min-w-14 h-12 px-4 rounded-[var(--radius-md)] border text-base font-semibold cursor-pointer transition-colors ${
                  cleaningDays === n
                    ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] border-[var(--color-wh-deep-green)]"
                    : "bg-white text-[var(--color-wh-deep-green)] border-[var(--color-wh-winter-grey)] hover:bg-[var(--color-wh-green-soft)]"
                }`}
              >
                {n} {n === 1 ? "Tag" : "Tage"}
              </button>
            ))}
            <input
              type="number"
              min={0}
              max={7}
              value={cleaningDays}
              onChange={(e) => setCleaningDays(Math.max(0, Math.min(7, Number(e.target.value) || 0)))}
              className="ml-2 w-20 h-12 px-3 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white text-center font-semibold"
              aria-label="Anzahl Tage manuell"
            />
          </div>
          <div className="mt-3 text-xs text-[var(--color-wh-fg-muted)] leading-relaxed">
            <strong>Beispiel:</strong> Bei {cleaningDays} {cleaningDays === 1 ? "Tag" : "Tagen"}{" "}
            Reinigungspuffer und Abreise am 16.05. (= letzter Buchungstag, Gäste reisen an dem
            Tag ab; gereinigt wird danach) ist die nächste Anreise frühestens am{" "}
            <strong>
              {new Date(2026, 4, 16 + cleaningDays + 1).toLocaleDateString("de-DE", {
                day: "numeric",
                month: "long",
              })}
            </strong>{" "}
            möglich.
          </div>
        </SettingRow>
      </div>

      <div className="px-6 sm:px-8 py-4 bg-[var(--color-wh-snow)] border-t border-[var(--color-wh-winter-grey)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-[var(--color-wh-fg-muted)]">
          {savedAt ? (
            <span className="text-[var(--color-wh-deep-green)] font-semibold inline-flex items-center gap-1.5">
              <Check size={14} /> Gespeichert {savedAt.toLocaleTimeString("de-DE")}
            </span>
          ) : updatedAt ? (
            <>
              Letzte Änderung:{" "}
              {new Date(updatedAt).toLocaleString("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {updatedBy ? ` · ${updatedBy}` : ""}
            </>
          ) : (
            <>Standard-Einstellungen</>
          )}
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCleaningDays(initial.cleaningDaysAfterDeparture)}
            >
              Zurücksetzen
            </Button>
          )}
          <Button type="submit" disabled={!dirty || pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            {pending ? " Speichere ..." : "Speichern"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-6 sm:px-8 py-3 bg-[var(--color-wh-sunset)]/10 text-[var(--color-wh-sunset)] text-sm font-medium border-t border-[var(--color-wh-winter-grey)]">
          {error}
        </div>
      )}
    </form>
  );
}

const SettingRow = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="shrink-0 w-12 h-12 rounded-full bg-[var(--color-wh-green-soft)] flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="m-0 text-[20px] mb-1">{title}</h3>
      <p className="m-0 mb-4 text-sm text-[var(--color-wh-fg-muted)] leading-relaxed">
        {description}
      </p>
      {children}
    </div>
  </div>
);
