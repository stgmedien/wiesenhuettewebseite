const COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  angefragt: { bg: "#EFE6D8", fg: "#8A5A38", label: "Angefragt" },
  bestaetigt: { bg: "#e3ecdc", fg: "#2F4A35", label: "Bestätigt" },
  bezahlt: { bg: "#6FA05F", fg: "#F7F7F2", label: "Bezahlt" },
  angereist: { bg: "#2F4A35", fg: "#F7F7F2", label: "Angereist" },
  abgereist: { bg: "#C8CEC4", fg: "#2F4A35", label: "Abgereist" },
  storniert: { bg: "#f3d5cb", fg: "#B85C38", label: "Storniert" },
  wartung: { bg: "#111111", fg: "#F7F7F2", label: "Wartung" },
};

// Teilzahlungs-Variante von "bezahlt": Der Webhook setzt den Status schon
// nach der Anzahlung auf "bezahlt" — für den Vorstand liest sich das wie
// "alles bezahlt". Wenn der Aufrufer Zahlungsstände mitgibt, zeigt die Pill
// deshalb "Angezahlt", solange noch Restzahlung aussteht.
const ANGEZAHLT = { bg: "#A8C29A", fg: "#2F4A35", label: "Angezahlt" };

// Manuelle Buchungen (Banküberweisung, kein Stripe-Zahlungsvorgang) laufen
// nicht automatisch durch — eigene lila Farbgebung statt der grünen Töne,
// damit sie im Blick bleiben und nicht zwischen den automatisierten
// Buchungen untergehen (Dana/Johannes-Wunsch).
const BEZAHLT_MANUAL = { bg: "#7B5EA7", fg: "#F7F7F2", label: "Bezahlt (manuell)" };
const ANGEZAHLT_MANUAL = { bg: "#C9B8E8", fg: "#4A3B6B", label: "Angezahlt (manuell)" };

export const StatusPill = ({
  status,
  paidCents,
  dueCents,
  manual = false,
}: {
  status: string;
  /** Bisher gezahlter Betrag (optional — nur für die Angezahlt-Anzeige). */
  paidCents?: number;
  /** Gesamtforderung inkl. Kaution (optional — nur für die Angezahlt-Anzeige). */
  dueCents?: number;
  /** Kein Stripe-Zahlungsvorgang (Banküberweisung) — färbt "Bezahlt"/"Angezahlt" lila statt grün. */
  manual?: boolean;
}) => {
  const partial =
    status === "bezahlt" &&
    typeof paidCents === "number" &&
    typeof dueCents === "number" &&
    paidCents < dueCents;
  const c = partial
    ? (manual ? ANGEZAHLT_MANUAL : ANGEZAHLT)
    : status === "bezahlt" && manual
      ? BEZAHLT_MANUAL
      : (COLORS[status] ?? { bg: "#EFE6D8", fg: "#8A5A38", label: status });
  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[var(--radius-pill)]"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
};
