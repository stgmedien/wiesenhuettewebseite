"use client";

// Seitenuebergreifende Fahrt-Planung: was auf /fahrten oder /projekte
// angehakt wird, landet in derselben, im Browser gespeicherten Auswahl --
// so zaehlt sich der Zeitbedarf beider Seiten zu EINER Auslastungsanzeige
// zusammen, statt zwei getrennte Zahlen zu zeigen (Wunsch aus dem Chat,
// 23.08.2026: "Projekte mit in die Zeit reinrechnen").
//
// Bewusst nur im Browser (localStorage), kein Server-Zustand: es geht um
// eine unverbindliche Planungshilfe fuer die anfragende Lehrkraft, nicht
// um eine echte Buchung/Reservierung.

import { useCallback, useSyncExternalStore } from "react";
import { FAHRT_MODULE } from "@/app/(public)/fahrten/data";
import { PROJEKTE } from "@/app/(public)/projekte/data";

const STORAGE_KEY = "wh-fahrtplan-v1";
const CHANGE_EVENT = "wh-fahrtplan-change";

// Grober Richtwert, kein exaktes Zeitbudget: eine 4-Tage-Fahrt (3 Nächte)
// hat An- und Abreisetag, bleiben ~2 volle Tage für Programm.
export const TAGE_VERFUEGBAR = 2;

type Auswahl = {
  fahrten: string[];
  projekte: string[];
};

const LEER: Auswahl = { fahrten: [], projekte: [] };

function parseAuswahl(raw: string): Auswahl {
  if (!raw) return LEER;
  try {
    const parsed = JSON.parse(raw);
    return {
      fahrten: Array.isArray(parsed.fahrten) ? parsed.fahrten : [],
      projekte: Array.isArray(parsed.projekte) ? parsed.projekte : [],
    };
  } catch {
    return LEER;
  }
}

function liesSpeicher(): Auswahl {
  if (typeof window === "undefined") return LEER;
  return parseAuswahl(window.localStorage.getItem(STORAGE_KEY) ?? "");
}

function schreibeSpeicher(wert: Auswahl) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wert));
  // Eigenes Event: das native "storage"-Event feuert nur in ANDEREN Tabs,
  // nicht auf der Seite, die selbst gerade geschrieben hat.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot(): string {
  return "";
}

export function usePlanungsAuswahl() {
  // useSyncExternalStore statt useState+useEffect: localStorage ist ein
  // echtes externes System (auch von anderen Tabs/Komponenten beschreibbar),
  // dafuer ist dieser Hook gemacht -- kein Hydration-Mismatch (dank
  // getServerSnapshot) und kein synchrones setState im Effect-Body noetig.
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const auswahl = parseAuswahl(raw);

  const toggleFahrt = useCallback((id: string) => {
    const aktuell = liesSpeicher();
    const dabei = aktuell.fahrten.includes(id);
    const naechste: Auswahl = {
      ...aktuell,
      fahrten: dabei ? aktuell.fahrten.filter((x) => x !== id) : [...aktuell.fahrten, id],
    };
    schreibeSpeicher(naechste);
  }, []);

  const toggleProjekt = useCallback((key: string) => {
    const aktuell = liesSpeicher();
    const dabei = aktuell.projekte.includes(key);
    const naechste: Auswahl = {
      ...aktuell,
      projekte: dabei ? aktuell.projekte.filter((x) => x !== key) : [...aktuell.projekte, key],
    };
    schreibeSpeicher(naechste);
  }, []);

  const fahrtModule = FAHRT_MODULE.filter((m) => auswahl.fahrten.includes(m.id));
  const projektModule = PROJEKTE.filter((p) => auswahl.projekte.includes(p.key));
  const summe =
    fahrtModule.reduce((s, m) => s + m.tagesanteil, 0) +
    projektModule.reduce((s, p) => s + p.tagesanteil, 0);
  const anzahl = fahrtModule.length + projektModule.length;

  return { auswahl, toggleFahrt, toggleProjekt, fahrtModule, projektModule, summe, anzahl };
}

export type { Auswahl };

export function planungsStatus(summe: number): { label: string; color: string; bar: string } {
  if (summe === 0) {
    return {
      label: "Wählt Angebote und Bau-Bausteine aus, um eure Fahrt zusammenzustellen.",
      color: "text-[var(--color-wh-fg-muted)]",
      bar: "bg-[var(--color-wh-winter-grey)]",
    };
  }
  if (summe <= 1.5) {
    return {
      label: "Gut machbar.",
      color: "text-[var(--color-wh-deep-green)]",
      bar: "bg-[var(--color-wh-deep-green)]",
    };
  }
  if (summe <= TAGE_VERFUEGBAR) {
    return {
      label: "Knapp, aber passt in den Rahmen.",
      color: "text-[var(--color-wh-wood)]",
      bar: "bg-[var(--color-wh-wood)]",
    };
  }
  return {
    label: "Das wird eng — überlegt, was ihr streicht.",
    color: "text-[var(--color-wh-sunset)]",
    bar: "bg-[var(--color-wh-sunset)]",
  };
}
