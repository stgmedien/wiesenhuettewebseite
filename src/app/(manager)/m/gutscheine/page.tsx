import { db } from "@/lib/db";
import { vouchers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gutscheine · Wiesenhütte Manager" };

function formatEuro(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default async function GutscheineManagerPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const all = await db.select().from(vouchers).orderBy(desc(vouchers.createdAt)).limit(500);

  // Stats
  const paid = all.filter((v) => v.paidAt !== null);
  const totalSoldCents = paid.reduce((sum, v) => sum + v.valueCents, 0);
  const totalRedeemedCents = paid.reduce((sum, v) => sum + v.redeemedCents, 0);
  const outstandingCents = totalSoldCents - totalRedeemedCents;
  const fullyRedeemedCount = paid.filter((v) => v.fullyRedeemed).length;

  return (
    <div className="px-8 py-10 max-w-[1200px]">
      <div className="eyebrow">Manager · Gutscheine</div>
      <h1 className="text-[36px] mt-2 mb-1">Geschenk-Gutscheine.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8 max-w-2xl">
        Verkaufte Gutscheine und ihr Einlöse-Status. Käufer kaufen unter{" "}
        <code>/geschenk</code>, Empfänger lösen den Code im normalen{" "}
        <code>/buchen</code>-Flow ein.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Verkauft" value={`${paid.length}`} sub={formatEuro(totalSoldCents)} />
        <StatCard label="Eingelöst" value={`${fullyRedeemedCount} voll`} sub={formatEuro(totalRedeemedCents)} />
        <StatCard
          label="Offen (Verbindlichkeit)"
          value={formatEuro(outstandingCents)}
          sub="Restwert auf aktiven Codes"
          warning={outstandingCents > 0}
        />
        <StatCard
          label="Pending Zahlung"
          value={`${all.length - paid.length}`}
          sub="Checkout gestartet, nicht abgeschlossen"
        />
      </div>

      {/* Liste */}
      {all.length === 0 ? (
        <p className="text-[var(--color-wh-fg-muted)] italic">Noch keine Gutscheine verkauft.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-beige)]/30">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider">Wert</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider">Eingelöst</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Käufer</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Empfänger</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Erstellt</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Gültig bis</th>
              </tr>
            </thead>
            <tbody>
              {all.map((v) => {
                const status = !v.paidAt
                  ? { label: "Pending", color: "bg-gray-100 text-gray-700" }
                  : v.fullyRedeemed
                    ? { label: "Voll eingelöst", color: "bg-emerald-100 text-emerald-800" }
                    : v.redeemedCents > 0
                      ? { label: "Teilweise", color: "bg-amber-100 text-amber-900" }
                      : { label: "Aktiv", color: "bg-blue-100 text-blue-800" };
                return (
                  <tr key={v.id} className="border-b border-[var(--color-wh-winter-grey)]/30">
                    <td className="px-4 py-3 font-mono text-[12px]">{v.code}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatEuro(v.valueCents)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatEuro(v.redeemedCents)}
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      <p className="m-0 font-medium">{v.purchaserName}</p>
                      <p className="m-0 text-[var(--color-wh-fg-muted)]">{v.purchaserEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      {v.recipientName ? (
                        <>
                          <p className="m-0 font-medium">{v.recipientName}</p>
                          {v.recipientEmail && (
                            <p className="m-0 text-[var(--color-wh-fg-muted)]">{v.recipientEmail}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-[var(--color-wh-fg-muted)]">— (Print)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[var(--color-wh-fg-muted)]">
                      {v.createdAt.toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[var(--color-wh-fg-muted)]">
                      {v.expiresAt ? v.expiresAt.toLocaleDateString("de-DE") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  warning,
}: {
  label: string;
  value: string;
  sub?: string;
  warning?: boolean;
}) {
  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] m-0 mb-2">
        {label}
      </p>
      <p
        className={`font-display font-bold text-[24px] m-0 leading-none ${warning ? "text-amber-700" : "text-[var(--color-wh-deep-green)]"}`}
      >
        {value}
      </p>
      {sub && <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-2">{sub}</p>}
    </div>
  );
}
