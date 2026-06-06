import { db } from "@/lib/db";
import { feedbackEntries, bookings, customers } from "@/lib/db/schema";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { averageRating, calculateNps } from "@/lib/feedback";

export const dynamic = "force-dynamic";
export const metadata = { title: "Feedback · Wiesenhütte Manager" };

const RATING_FIELDS = [
  { key: "overallRating", label: "Gesamt" },
  { key: "cleanlinessRating", label: "Sauberkeit" },
  { key: "comfortRating", label: "Komfort" },
  { key: "locationRating", label: "Lage" },
  { key: "communicationRating", label: "Kommunikation" },
  { key: "pricePerformanceRating", label: "Preis-Leistung" },
] as const;

export default async function FeedbackDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  // Alle Einträge holen (nicht zu viele erwartet — bei Bedarf paginieren)
  const allRows = await db
    .select({
      id: feedbackEntries.id,
      bookingId: feedbackEntries.bookingId,
      sentAt: feedbackEntries.sentAt,
      expiresAt: feedbackEntries.expiresAt,
      respondedAt: feedbackEntries.respondedAt,
      overallRating: feedbackEntries.overallRating,
      cleanlinessRating: feedbackEntries.cleanlinessRating,
      comfortRating: feedbackEntries.comfortRating,
      locationRating: feedbackEntries.locationRating,
      communicationRating: feedbackEntries.communicationRating,
      pricePerformanceRating: feedbackEntries.pricePerformanceRating,
      wouldRecommend: feedbackEntries.wouldRecommend,
      highlightText: feedbackEntries.highlightText,
      improvementText: feedbackEntries.improvementText,
      surpriseText: feedbackEntries.surpriseText,
      allowQuoteInternally: feedbackEntries.allowQuoteInternally,
      respondentName: feedbackEntries.respondentName,
      bookingNumber: bookings.bookingNumber,
      bookingArrival: bookings.arrival,
      bookingDeparture: bookings.departure,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
    })
    .from(feedbackEntries)
    .leftJoin(bookings, eq(feedbackEntries.bookingId, bookings.id))
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .orderBy(desc(feedbackEntries.respondedAt), desc(feedbackEntries.sentAt))
    .limit(500);

  // Stats
  const responded = allRows.filter((r) => r.respondedAt !== null);
  const sentTotal = allRows.length;
  const responseRate = sentTotal === 0 ? 0 : (responded.length / sentTotal) * 100;
  const nps = calculateNps(responded.map((r) => r.overallRating));

  const ratingAverages: Record<string, number | null> = {};
  for (const f of RATING_FIELDS) {
    ratingAverages[f.key] = averageRating(
      responded.map((r) => r[f.key as keyof typeof r] as number | null)
    );
  }
  const recommendYes = responded.filter((r) => r.wouldRecommend === true).length;
  const recommendNo = responded.filter((r) => r.wouldRecommend === false).length;
  const recommendRate =
    recommendYes + recommendNo === 0
      ? null
      : (recommendYes / (recommendYes + recommendNo)) * 100;

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="eyebrow">Manager · Feedback</div>
      <h1 className="text-[36px] mt-2 mb-1">Gäste-Insights.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8">
        Strukturiertes Feedback aus Token-Mails T+2 nach Abreise. Antworten sind intern und nicht
        öffentlich sichtbar.
      </p>

      {/* Stat-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Antworten"
          value={`${responded.length}`}
          sub={`von ${sentTotal} versendet (${responseRate.toFixed(0)}%)`}
        />
        <StatCard
          label="Ø Gesamt-Rating"
          value={
            ratingAverages.overallRating === null
              ? "—"
              : `${ratingAverages.overallRating.toFixed(2)} / 5`
          }
          sub="alle Antworten"
        />
        <StatCard
          label="NPS-artig"
          value={nps === null ? "—" : `${nps}`}
          sub="Promotoren minus Detraktoren"
          good={nps !== null && nps >= 50}
          warning={nps !== null && nps < 0}
        />
        <StatCard
          label="Würden weiterempfehlen"
          value={recommendRate === null ? "—" : `${recommendRate.toFixed(0)}%`}
          sub={`${recommendYes} Ja · ${recommendNo} Nein`}
        />
      </div>

      {/* Rating-Detail-Bars */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mb-10">
        <h2 className="text-[18px] m-0 mb-5 font-display font-bold">Ratings im Detail</h2>
        <div className="space-y-3">
          {RATING_FIELDS.map((f) => (
            <RatingBar
              key={f.key}
              label={f.label}
              value={ratingAverages[f.key]}
              count={responded.filter((r) => r[f.key as keyof typeof r] !== null).length}
            />
          ))}
        </div>
      </section>

      {/* Liste */}
      <section>
        <h2 className="text-[20px] m-0 mb-5 font-display font-bold">
          Letzte Antworten ({responded.length})
        </h2>
        {responded.length === 0 ? (
          <p className="text-[var(--color-wh-fg-muted)] italic">
            Noch keine Antworten — sobald Gäste die Token-Mail beantworten, erscheinen sie hier.
          </p>
        ) : (
          <div className="space-y-4">
            {responded.map((r) => (
              <FeedbackCard key={r.id} row={r} />
            ))}
          </div>
        )}
      </section>

      {/* Pending-Tokens (versendet, noch nicht beantwortet) */}
      <section className="mt-12 pt-6 border-t border-[var(--color-wh-winter-grey)]">
        <h2 className="text-[16px] m-0 mb-3 font-semibold text-[var(--color-wh-fg-muted)]">
          Offene Anfragen ({allRows.length - responded.length})
        </h2>
        <p className="text-[12px] text-[var(--color-wh-fg-muted)] italic m-0">
          Diese Buchungen haben eine Feedback-Mail erhalten, aber noch nicht geantwortet. Erinnern
          aktuell nicht — vielleicht in v2.
        </p>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  good,
  warning,
}: {
  label: string;
  value: string;
  sub?: string;
  good?: boolean;
  warning?: boolean;
}) {
  const valueColor = good
    ? "text-emerald-700"
    : warning
      ? "text-red-700"
      : "text-[var(--color-wh-deep-green)]";
  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] m-0 mb-2">
        {label}
      </p>
      <p className={`font-display font-bold text-[28px] m-0 leading-none ${valueColor}`}>{value}</p>
      {sub && <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-2">{sub}</p>}
    </div>
  );
}

function RatingBar({ label, value, count }: { label: string; value: number | null; count: number }) {
  const pct = value === null ? 0 : (value / 5) * 100;
  return (
    <div className="flex items-center gap-4">
      <span className="text-[13px] text-[var(--color-wh-black)] w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-[var(--color-wh-beige)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-wh-deep-green)] to-[var(--color-wh-deep-green)]/70 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[13px] font-mono text-[var(--color-wh-deep-green)] w-20 text-right shrink-0">
        {value === null ? "—" : `${value.toFixed(2)} / 5`}
      </span>
      <span className="text-[11px] text-[var(--color-wh-fg-muted)] w-12 text-right shrink-0">
        ({count})
      </span>
    </div>
  );
}

type FeedbackRow = {
  id: string;
  bookingId: string;
  respondedAt: Date | null;
  overallRating: number | null;
  cleanlinessRating: number | null;
  comfortRating: number | null;
  locationRating: number | null;
  communicationRating: number | null;
  pricePerformanceRating: number | null;
  wouldRecommend: boolean | null;
  highlightText: string | null;
  improvementText: string | null;
  surpriseText: string | null;
  allowQuoteInternally: boolean;
  respondentName: string | null;
  bookingNumber: string | null;
  bookingArrival: string | null;
  bookingDeparture: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
};

function FeedbackCard({ row }: { row: FeedbackRow }) {
  const stars = "★".repeat(row.overallRating ?? 0) + "☆".repeat(5 - (row.overallRating ?? 0));
  const respondedDate = row.respondedAt
    ? row.respondedAt.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const guest =
    row.respondentName ||
    [row.customerFirstName, row.customerLastName].filter(Boolean).join(" ") ||
    "Anonym";

  return (
    <article className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
      <header className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-amber-500 text-[18px] leading-none">{stars}</span>
            <span className="text-[13px] text-[var(--color-wh-fg-muted)]">
              {row.overallRating !== null ? `${row.overallRating}/5` : "—"}
            </span>
            {row.wouldRecommend === true && (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                empfiehlt weiter
              </span>
            )}
            {row.wouldRecommend === false && (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                eher nicht weiter
              </span>
            )}
            {row.allowQuoteInternally && (
              <span
                className="text-[10px] uppercase tracking-wider font-bold bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)] px-2 py-0.5 rounded-full"
                title="Gast erlaubt interne Quotes"
              >
                Quote OK
              </span>
            )}
          </div>
          <p className="font-semibold text-[15px] text-[var(--color-wh-deep-green)] m-0 mt-1">
            {guest}
          </p>
          <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0">
            Buchung{" "}
            {row.bookingNumber ? (
              <Link
                href={`/m/buchungen/${row.bookingId}`}
                className="font-mono hover:underline"
              >
                {row.bookingNumber}
              </Link>
            ) : (
              "—"
            )}
            {row.bookingArrival && row.bookingDeparture && (
              <>
                {" · "}
                {new Date(row.bookingArrival).toLocaleDateString("de-DE")} —{" "}
                {new Date(row.bookingDeparture).toLocaleDateString("de-DE")}
              </>
            )}
          </p>
        </div>
        <p className="text-[11px] font-mono text-[var(--color-wh-fg-muted)] shrink-0">
          {respondedDate}
        </p>
      </header>

      {/* Sub-Ratings als Mini-Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {RATING_FIELDS.slice(1).map((f) => {
          const v = row[f.key as keyof FeedbackRow] as number | null;
          if (v === null) return null;
          return (
            <span
              key={f.key}
              className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-wh-beige)] text-[var(--color-wh-black)]"
            >
              {f.label}: {v}/5
            </span>
          );
        })}
      </div>

      {row.highlightText && (
        <div className="mb-3 pl-3 border-l-2 border-emerald-300">
          <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold m-0 mb-1">
            Highlight
          </p>
          <p className="text-[14px] whitespace-pre-wrap m-0 italic">„{row.highlightText}"</p>
        </div>
      )}
      {row.improvementText && (
        <div className="mb-3 pl-3 border-l-2 border-amber-300">
          <p className="text-[11px] uppercase tracking-wider text-amber-700 font-semibold m-0 mb-1">
            Verbesserung
          </p>
          <p className="text-[14px] whitespace-pre-wrap m-0 italic">„{row.improvementText}"</p>
        </div>
      )}
      {row.surpriseText && (
        <div className="mb-1 pl-3 border-l-2 border-[var(--color-wh-deep-green)]/40">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold m-0 mb-1">
            Überraschung
          </p>
          <p className="text-[14px] whitespace-pre-wrap m-0 italic">„{row.surpriseText}"</p>
        </div>
      )}
    </article>
  );
}
