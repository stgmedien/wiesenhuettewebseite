"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = [
  { value: "", label: "Alle Status" },
  { value: "angefragt", label: "Angefragt" },
  { value: "bestaetigt", label: "Bestätigt" },
  { value: "bezahlt", label: "Bezahlt" },
  { value: "angereist", label: "Angereist" },
  { value: "abgereist", label: "Abgereist" },
  { value: "storniert", label: "Storniert" },
];

export function BookingsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";
  const currentSort = searchParams.get("sort") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams();
    if (currentSort) params.set("sort", currentSort);
    if (value) params.set("status", value);
    router.push(`/m/buchungen${params.size ? `?${params}` : ""}`);
  }

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      className="h-10 px-3 pr-8 rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] bg-white text-sm text-[var(--color-wh-black)] cursor-pointer"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
