import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { approveMembership, rejectMembership } from "./actions";
import { formatDateLong } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mitgliedschaften · Wiesenhütte Manager" };

export default async function MitgliedschaftenPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const pending = await db
    .select()
    .from(customers)
    .where(eq(customers.membershipStatus, "pending"))
    .orderBy(desc(customers.createdAt));

  const recentDecisions = await db
    .select()
    .from(customers)
    .where(eq(customers.membershipStatus, "verified"))
    .orderBy(desc(customers.membershipVerifiedAt))
    .limit(10);

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold">
          Manager
        </p>
        <h1 className="font-heading text-3xl text-[var(--color-wh-deep-green)]">Mitgliedschaften</h1>
        <p className="text-sm text-[var(--color-wh-black)]/70 mt-1">
          {pending.length} offene Verifizierung{pending.length === 1 ? "" : "en"}.
        </p>
      </header>

      <section className="space-y-3 mb-12">
        <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-3">
          Zur Prüfung
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/50 p-6 text-sm text-[var(--color-wh-black)]/70">
            Keine offenen Verifizierungen.
          </div>
        ) : (
          pending.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/50 p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-heading text-lg text-[var(--color-wh-deep-green)]">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-sm text-[var(--color-wh-black)]/80">{c.email}</p>
                  {c.phone && (
                    <p className="text-sm text-[var(--color-wh-black)]/80">📞 {c.phone}</p>
                  )}
                  {c.memberId && (
                    <p className="text-sm font-mono mt-1 text-[var(--color-wh-black)]">
                      Beantragte Mitgliedsnr.: {c.memberId}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-wh-black)]/60 mt-2">
                    Beantragt am {formatDateLong(c.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--color-wh-winter-grey)]/40">
                <form action={approveMembership} className="flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    name="memberId"
                    type="text"
                    defaultValue={c.memberId ?? ""}
                    placeholder="Mitgliedsnr. (optional)"
                    className="flex-1 rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold whitespace-nowrap"
                  >
                    ✓ Bestätigen
                  </button>
                </form>
                <form action={rejectMembership} className="flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    name="reason"
                    type="text"
                    placeholder="Grund (optional)"
                    className="flex-1 rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold whitespace-nowrap"
                  >
                    Ablehnen
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-3">
          Zuletzt bestätigt
        </h2>
        {recentDecisions.length === 0 ? (
          <div className="text-sm text-[var(--color-wh-black)]/60">Noch keine Bestätigungen.</div>
        ) : (
          <ul className="space-y-2">
            {recentDecisions.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/40 px-4 py-3 text-sm"
              >
                <span>
                  <strong>
                    {c.firstName} {c.lastName}
                  </strong>{" "}
                  · {c.email}
                  {c.memberId && (
                    <span className="font-mono text-[var(--color-wh-black)]/70 ml-2">
                      #{c.memberId}
                    </span>
                  )}
                </span>
                <span className="text-xs text-[var(--color-wh-black)]/60">
                  bestätigt von {c.membershipVerifiedBy ?? "—"}
                  {c.membershipVerifiedAt &&
                    ` · ${formatDateLong(c.membershipVerifiedAt)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
