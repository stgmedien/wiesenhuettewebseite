import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const formatDateDe = (d: Date | string): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateLong = (d: Date | string): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "short",
  });
};

/**
 * ISO-Date-String ("YYYY-MM-DD") aus einer LOKALEN Date-Repräsentation.
 * Achtung: `d.toISOString().slice(0,10)` ist hier FALSCH, weil es das Datum
 * in UTC ausgibt — in DE/CEST verschiebt das LOKAL-Mitternacht um -1 oder -2
 * Stunden in den Vortag (klassischer Off-by-one-Bug im Kalender).
 */
export const toLocalIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const generateBookingNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `WH-${year}-${rand}`;
};
