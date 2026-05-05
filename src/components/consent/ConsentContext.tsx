"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "wh_cookie_consent";
const VERSION = 1;

export type ConsentCategories = {
  essential: true; // always on, immutable
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentState = ConsentCategories & {
  version: number;
  decidedAt: string;
};

type ConsentContextValue = {
  /** True only on first visit (no localStorage entry yet). */
  needsDecision: boolean;
  /** Current settings; null if user hasn't decided yet. */
  consent: ConsentState | null;
  /** Accept all categories. */
  acceptAll: () => void;
  /** Reject all optional categories. */
  rejectAll: () => void;
  /** Save granular settings. */
  save: (patch: Partial<Omit<ConsentCategories, "essential">>) => void;
  /** Re-open the settings modal (linked from footer). */
  openSettings: () => void;
  /** Internal: are settings open? */
  settingsOpen: boolean;
  /** Internal: close settings. */
  closeSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

const readStored = (): ConsentState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
};

const persist = (next: ConsentState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — ignore */
  }
};

export const ConsentProvider = ({ children }: { children: React.ReactNode }) => {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readStored());
    setHydrated(true);
  }, []);

  const apply = (patch: Partial<Omit<ConsentCategories, "essential">>) => {
    const next: ConsentState = {
      essential: true,
      functional: patch.functional ?? consent?.functional ?? false,
      analytics: patch.analytics ?? consent?.analytics ?? false,
      marketing: patch.marketing ?? consent?.marketing ?? false,
      version: VERSION,
      decidedAt: new Date().toISOString(),
    };
    setConsent(next);
    persist(next);
    setSettingsOpen(false);
  };

  const acceptAll = () =>
    apply({ functional: true, analytics: true, marketing: true });

  const rejectAll = () =>
    apply({ functional: false, analytics: false, marketing: false });

  const value = useMemo<ConsentContextValue>(
    () => ({
      needsDecision: hydrated && consent === null,
      consent,
      acceptAll,
      rejectAll,
      save: apply,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      settingsOpen,
    }),
    [consent, hydrated, settingsOpen]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export const useConsent = (): ConsentContextValue => {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
};

/** Convenience hook for gating a specific embed/asset. */
export const useConsentFor = (
  category: "functional" | "analytics" | "marketing"
): boolean => {
  const { consent } = useConsent();
  return Boolean(consent?.[category]);
};
