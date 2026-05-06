import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import { and, ilike, desc, gte, lte, eq, sql, type SQL } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit-Log · Wiesenhütte Manager" };

type Props = {
  searchParams: Promise<{
    who?: string;
    what?: string;
    bookingId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: Props) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") redirect("/m/dashboard");

  const sp = await searchParams;
  const who = sp.who?.trim() ?? "";
  const what = sp.what?.trim() ?? "";
  const bookingId = sp.bookingId?.trim() ?? "";
  const from = sp.from?.trim() ?? "";
  const to = sp.to?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const conds: (SQL | undefined)[] = [];
  if (who) conds.push(ilike(activityLog.who, `%${who}%`));
  if (what) conds.push(ilike(activityLog.what, `%${what}%`));
  if (bookingId) conds.push(eq(activityLog.bookingId, bookingId));
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) conds.push(gte(activityLog.at, fromDate));
  }
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      conds.push(lte(activityLog.at, toDate));
    }
  }
  const whereClause = conds.length > 0 ? and(...conds.filter((c): c is SQL => c !== undefined)) : undefined;

  const countRow = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(activityLog)
    .where(whereClause);
  const total = countRow[0]?.c ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = await db
    .select()
    .from(activityLog)
    .where(whereClause)
    .orderBy(desc(activityLog.at))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const buildPageHref = (n: number) => {
    const params = new URLSearchParams();
    if (who) params.set("who", who);
    if (what) params.set("what", what);
    if (bookingId) params.set("bookingId", bookingId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (n > 1) params.set("page", String(n));
    return `/m/audit${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="px-8 py-10 max-w-[1280px]">
      <div className="eyebrow">Sicherheit</div>
      <h1 className="text-[40px] mt-2 mb-1">Audit-Log</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2 max-w-2xl">
        Alle wichtigen Aktionen im Manager-Backend (Logins, Buchungs-Statuswechsel, Mail-Versand,
        Nutzer-Mutationen, Cron-Läufe). Sichtbar nur für Admins.
      </p>

      <form method="get" className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4">
        <FilterInput name="who" label="Wer (Name/E-Mail)" defaultValue={who} placeholder="z. B. Jonathan" />
        <FilterInput name="what" label="Was (Volltextsuche)" defaultValue={what} placeholder="z. B. Storno" />
        <FilterInput name="bookingId" label="Buchungs-UUID" defaultValue={bookingId} placeholder="optional" />
        <FilterInput name="from" type="date" label="Von" defaultValue={from} />
        <FilterInput name="to" type="date" label="Bis" defaultValue={to} />
        <div className="lg:col-span-5 flex justify-end gap-2">
          <a
            href="/m/audit"
            className="inline-flex h-10 px-4 items-center rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-sm font-semibold text-[var(--color-wh-deep-green)] no-underline hover:bg-[var(--color-wh-green-soft)]"
          >
            Filter zurücksetzen
          </a>
          <button
            type="submit"
            className="inline-flex h-10 px-5 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer"
          >
            Filtern
          </button>
        </div>
      </form>

      <div className="mt-6 text-sm text-[var(--color-wh-fg-muted)]">
        {total} Einträge · Seite {page} von {pages}
      </div>

      <div className="mt-3 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-wh-snow)] border-b border-[var(--color-wh-winter-grey)] text-left">
            <tr>
              <Th className="w-[160px]">Zeitpunkt</Th>
              <Th className="w-[180px]">Wer</Th>
              <Th>Was</Th>
              <Th className="w-[280px]">Buchungs-Bezug</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-wh-fg-muted)]">
                  Keine Einträge gefunden.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[var(--color-wh-winter-grey)] last:border-b-0 align-top"
              >
                <Td className="text-xs text-[var(--color-wh-fg-muted)] font-mono whitespace-nowrap">
                  {new Date(r.at).toLocaleString("de-DE", {
                    dateStyle: "short",
                    timeStyle: "medium",
                  })}
                </Td>
                <Td className="font-semibold">{r.who}</Td>
                <Td className="leading-relaxed">{r.what}</Td>
                <Td className="font-mono text-xs">
                  {r.bookingId ? (
                    <a
                      href={`/m/buchungen/${r.bookingId}`}
                      className="text-[var(--color-wh-deep-green)] no-underline"
                    >
                      {r.bookingId.slice(0, 8)}…
                    </a>
                  ) : (
                    <span className="text-[var(--color-wh-fg-muted)]">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={buildPageHref(page - 1)}
              className="inline-flex h-10 px-4 items-center rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-sm no-underline text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
            >
              ← Zurück
            </a>
          )}
          <span className="text-sm text-[var(--color-wh-fg-muted)] px-3">
            Seite {page} / {pages}
          </span>
          {page < pages && (
            <a
              href={buildPageHref(page + 1)}
              className="inline-flex h-10 px-4 items-center rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-sm no-underline text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
            >
              Weiter →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th
    className={`px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] ${className}`}
  >
    {children}
  </th>
);
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);

const FilterInput = ({
  name,
  label,
  type = "text",
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue: string;
  placeholder?: string;
}) => (
  <label className="flex flex-col gap-1.5 text-sm">
    <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">
      {label}
    </span>
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white text-sm"
    />
  </label>
);
