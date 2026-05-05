const COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  angefragt: { bg: "#EFE6D8", fg: "#8A5A38", label: "Angefragt" },
  bestaetigt: { bg: "#e3ecdc", fg: "#2F4A35", label: "Bestätigt" },
  bezahlt: { bg: "#6FA05F", fg: "#F7F7F2", label: "Bezahlt" },
  angereist: { bg: "#2F4A35", fg: "#F7F7F2", label: "Angereist" },
  abgereist: { bg: "#C8CEC4", fg: "#2F4A35", label: "Abgereist" },
  storniert: { bg: "#f3d5cb", fg: "#B85C38", label: "Storniert" },
  wartung: { bg: "#111111", fg: "#F7F7F2", label: "Wartung" },
};

export const StatusPill = ({ status }: { status: string }) => {
  const c = COLORS[status] ?? { bg: "#EFE6D8", fg: "#8A5A38", label: status };
  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[var(--radius-pill)]"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
};
