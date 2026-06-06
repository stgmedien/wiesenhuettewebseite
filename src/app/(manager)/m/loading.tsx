// Wird in Next.js sofort beim Navigieren in /m/* angezeigt, während die
// (force-dynamic) Server-Komponente ihre DB-Queries ausführt. Das Layout
// (Sidebar/Shell) bleibt stehen — nur dieser Inhaltsbereich zeigt das
// Skeleton. Verwandelt das frühere Blank-Freeze-Gefühl in „instant".
export default function ManagerLoading() {
  return (
    <div
      className="p-5 sm:p-8 animate-pulse"
      role="status"
      aria-label="Lädt …"
    >
      {/* Kopfzeile */}
      <div className="h-3 w-20 rounded bg-[var(--color-wh-winter-grey)]/60 mb-3" />
      <div className="h-8 w-64 max-w-[70%] rounded-lg bg-[var(--color-wh-winter-grey)]/70 mb-8" />

      {/* KPI-/Karten-Reihe */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/50 p-4"
          >
            <div className="h-3 w-16 rounded bg-[var(--color-wh-winter-grey)]/60 mb-3" />
            <div className="h-7 w-20 rounded bg-[var(--color-wh-winter-grey)]/70" />
          </div>
        ))}
      </div>

      {/* Inhalts-/Tabellenblock */}
      <div className="rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/50 overflow-hidden">
        <div className="h-12 border-b border-[var(--color-wh-winter-grey)]/40 bg-[var(--color-wh-beige)]/30" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 h-14 border-b border-[var(--color-wh-winter-grey)]/30 last:border-b-0"
          >
            <div className="h-4 w-4 rounded bg-[var(--color-wh-winter-grey)]/50 shrink-0" />
            <div className="h-4 flex-1 max-w-[200px] rounded bg-[var(--color-wh-winter-grey)]/60" />
            <div className="h-4 w-24 rounded bg-[var(--color-wh-winter-grey)]/40 hidden sm:block" />
            <div className="h-4 w-16 rounded bg-[var(--color-wh-winter-grey)]/40 ml-auto" />
          </div>
        ))}
      </div>

      <span className="sr-only">Inhalt wird geladen …</span>
    </div>
  );
}
