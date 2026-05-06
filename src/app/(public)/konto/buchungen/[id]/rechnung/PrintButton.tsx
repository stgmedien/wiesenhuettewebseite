"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-[var(--color-wh-forest)] text-white px-5 py-2 text-sm font-semibold"
    >
      Drucken / Als PDF speichern
    </button>
  );
}
