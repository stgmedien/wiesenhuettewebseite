import { db } from "@/lib/db";
import { maintenanceTickets } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createTicket } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wartung · Wiesenhütte Manager" };

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

const SEVERITY_LABEL: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  urgent: "Dringend",
};

const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  in_progress: "In Arbeit",
  resolved: "Erledigt",
};

const STATUSES_FILTER = ["open", "in_progress", "resolved", "all"] as const;

export default async function WartungPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const sp = await searchParams;
  const filter = (STATUSES_FILTER.includes(sp.status as never) ? sp.status : "open") as
    | "open"
    | "in_progress"
    | "resolved"
    | "all";

  const tickets =
    filter === "all"
      ? await db
          .select()
          .from(maintenanceTickets)
          .orderBy(
            // urgent > high > medium > low; dann createdAt desc
            sql`CASE severity WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
            desc(maintenanceTickets.createdAt)
          )
      : await db
          .select()
          .from(maintenanceTickets)
          .where(eq(maintenanceTickets.status, filter))
          .orderBy(
            sql`CASE severity WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
            desc(maintenanceTickets.createdAt)
          );

  // Counter pro Tab
  const allCounts = await db
    .select({
      status: maintenanceTickets.status,
      count: sql<number>`count(*)::int`,
    })
    .from(maintenanceTickets)
    .groupBy(maintenanceTickets.status);
  const countByStatus = Object.fromEntries(allCounts.map((r) => [r.status, r.count])) as Record<
    string,
    number
  >;

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="eyebrow">Manager · Wartung</div>
      <h1 className="text-[36px] mt-2 mb-1">Wartungs-Tickets.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8">
        Mängel-Liste für den Hüttenwart. Tickets werden nach Schweregrad sortiert (urgent
        zuerst). Photos via Vercel Blob, Verlinkung zu Buchungen optional.
      </p>

      {/* Filter-Tabs */}
      <nav className="flex gap-2 mb-6 border-b border-[var(--color-wh-winter-grey)]">
        {STATUSES_FILTER.map((s) => {
          const label = s === "all" ? "Alle" : STATUS_LABEL[s];
          const count = s === "all" ? undefined : countByStatus[s] ?? 0;
          return (
            <a
              key={s}
              href={`/m/wartung?status=${s}`}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                filter === s
                  ? "border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)]"
                  : "border-transparent text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)]"
              }`}
            >
              {label}
              {count !== undefined && ` (${count})`}
            </a>
          );
        })}
      </nav>

      {/* Liste */}
      {tickets.length === 0 ? (
        <p className="text-[var(--color-wh-fg-muted)] italic mb-8">
          Keine Tickets in dieser Kategorie.
        </p>
      ) : (
        <div className="space-y-3 mb-12">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/m/wartung/${t.id}`}
              className="block bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 no-underline hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${SEVERITY_BADGE[t.severity] ?? "bg-gray-100"}`}
                  >
                    {SEVERITY_LABEL[t.severity] ?? t.severity}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-wh-fg-muted)]">
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                  {t.location && (
                    <span className="text-[11px] text-[var(--color-wh-fg-muted)]">
                      · {t.location}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-[var(--color-wh-fg-muted)]">
                  {t.createdAt.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </span>
              </div>
              <p className="font-semibold text-[15px] text-[var(--color-wh-deep-green)] m-0">
                {t.title}
              </p>
              {t.description && (
                <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0 mt-1 line-clamp-2">
                  {t.description}
                </p>
              )}
              {t.photoUrls.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {t.photoUrls.slice(0, 4).map((url, i) => (
                    <div
                      key={i}
                      className="relative w-12 h-12 rounded overflow-hidden bg-[var(--color-wh-beige)]"
                    >
                      <Image src={url} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  ))}
                  {t.photoUrls.length > 4 && (
                    <div className="w-12 h-12 rounded bg-[var(--color-wh-beige)] flex items-center justify-center text-[11px] font-mono text-[var(--color-wh-fg-muted)]">
                      +{t.photoUrls.length - 4}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Neues Ticket */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <h2 className="text-[20px] m-0 mb-4 font-display font-bold">Neues Ticket anlegen</h2>
        <form
          action={async (fd) => {
            "use server";
            await createTicket(fd);
          }}
          encType="multipart/form-data"
          className="space-y-3"
        >
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Titel *
            </label>
            <input
              type="text"
              name="title"
              required
              maxLength={200}
              placeholder="z.B. Wasserhahn Bad EG tropft"
              className={`${inputBase} w-full`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Ort
              </label>
              <input
                type="text"
                name="location"
                maxLength={200}
                placeholder="z.B. Bad EG, Küche, Außen"
                className={`${inputBase} w-full`}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Schweregrad *
              </label>
              <select name="severity" defaultValue="medium" className={`${inputBase} w-full`}>
                <option value="low">Niedrig (kann warten)</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Beschreibung
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={5000}
              placeholder="Was ist passiert? Wann gemerkt? Wer hat's gemeldet?"
              className={`${inputBase} w-full`}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Photos (optional, max. 6)
            </label>
            <input
              type="file"
              name="photos"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="text-sm w-full"
            />
          </div>
          <div>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold"
            >
              Ticket anlegen
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
