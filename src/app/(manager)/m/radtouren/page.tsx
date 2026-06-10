import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { rideInterests, rideMatches } from "@/lib/db/schema-rad";
import { upcomingWeekends, formatSlotLabel, RAD_MATCH_THRESHOLD } from "@/lib/rad";

export const dynamic = "force-dynamic";
export const metadata = { title: "Radtouren · Wiesenhütte Manager" };

export default async function RadtourenManagerPage() {
  const slots = upcomingWeekends();
  const interests = await db
    .select()
    .from(rideInterests)
    .orderBy(desc(rideInterests.createdAt));
  const matches = await db.select().from(rideMatches);
  const matchedSlots = new Set(matches.map((m) => m.slot));

  const verifiedFor = (slotId: string) =>
    new Set(
      interests
        .filter((i) => i.verifiedAt && (i.slots ?? []).includes(slotId))
        .map((i) => i.email)
    ).size;

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1400px]">
      <div className="eyebrow">Radtouren</div>
      <h1 className="text-[28px] sm:text-[40px] mt-2 mb-1">Radtouren-Matching</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0">
        Interessen für gemeinsame Rad-Wochenenden. Ab {RAD_MATCH_THRESHOLD} bestätigten
        Personen je Slot verschickt der tägliche Cron automatisch die Match-Mails — inkl.
        interner Info fürs Gerke-Lunchpaket (02758 280).
      </p>

      {/* Slot-Übersicht */}
      <h2 className="text-[20px] mt-10 mb-4">Kommende Wochenenden</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {slots.map((s) => {
          const n = verifiedFor(s.id);
          const matched = matchedSlots.has(s.id);
          return (
            <div
              key={s.id}
              className={
                "rounded-[var(--radius-card)] border p-4 " +
                (matched
                  ? "bg-[var(--color-wh-green-soft)] border-[var(--color-wh-green)]"
                  : "bg-white border-[var(--color-wh-winter-grey)]")
              }
            >
              <div className="text-xs text-[var(--color-wh-fg-muted)]">
                {formatSlotLabel(s, "de")}
              </div>
              <div className="font-display text-[26px] font-bold text-[var(--color-wh-deep-green)] mt-1">
                {n}
                <span className="text-sm font-normal text-[var(--color-wh-fg-muted)]">
                  {" "}
                  / {RAD_MATCH_THRESHOLD}
                </span>
              </div>
              <div className="text-xs mt-1 font-semibold">
                {matched ? (
                  <span className="text-[var(--color-wh-deep-green)]">✓ Match verschickt</span>
                ) : n > 0 ? (
                  <span className="text-[var(--color-wh-sunset)]">sammelt …</span>
                ) : (
                  <span className="text-[var(--color-wh-fg-muted)]">leer</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alle Einträge */}
      <h2 className="text-[20px] mt-12 mb-4">Alle Interessen ({interests.length})</h2>
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-[var(--color-wh-snow)] border-b border-[var(--color-wh-winter-grey)]">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">E-Mail</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">Name</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">Wunsch-Slots</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">Lunchpaket</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {interests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-wh-fg-muted)]">
                    Noch keine Einträge.
                  </td>
                </tr>
              )}
              {interests.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-[var(--color-wh-winter-grey)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium">{i.email}</td>
                  <td className="px-4 py-3">{i.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-wh-fg-muted)]">
                    {(i.slots ?? []).join(" · ")}
                  </td>
                  <td className="px-4 py-3">{i.lunch ? "ja" : "—"}</td>
                  <td className="px-4 py-3">
                    {i.verifiedAt ? (
                      <span className="text-[var(--color-wh-deep-green)] font-semibold">bestätigt</span>
                    ) : (
                      <span className="text-[var(--color-wh-fg-muted)]">unbestätigt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
