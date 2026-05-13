import { db } from "@/lib/db";
import { externalReviews } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Star, Eye, EyeOff, Sparkles, Trash2, Plus } from "lucide-react";
import {
  togglePublishedAction,
  toggleHighlightAction,
  deleteReviewAction,
  addReviewAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bewertungen · Wiesenhütte Manager" };

const SOURCE_LABEL: Record<string, string> = {
  google: "Google",
  gruppenhaus: "Gruppenhaus.de",
  gruppenunterkuenfte: "Gruppenunterkünfte.de",
  manual: "Manuell",
};

const SOURCE_COLOR: Record<string, string> = {
  google: "bg-blue-50 text-blue-800 border-blue-200",
  gruppenhaus: "bg-amber-50 text-amber-800 border-amber-200",
  gruppenunterkuenfte: "bg-purple-50 text-purple-800 border-purple-200",
  manual: "bg-slate-50 text-slate-800 border-slate-200",
};

export default async function BewertungenPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  type ReviewRow = typeof externalReviews.$inferSelect;
  let all: ReviewRow[] = [];
  let dbError: string | null = null;
  try {
    all = await db
      .select()
      .from(externalReviews)
      .orderBy(desc(externalReviews.reviewedAt), desc(externalReviews.createdAt));
  } catch (err) {
    dbError =
      err instanceof Error
        ? err.message
        : "Tabelle external_reviews nicht erreichbar.";
  }

  if (dbError) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-3">Bewertungen</h1>
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded p-4 text-sm">
          <p className="m-0 mb-2 font-semibold">Tabelle <code>external_reviews</code> noch nicht angelegt.</p>
          <p className="m-0 mb-2">Lokal ausführen:</p>
          <pre className="bg-white border border-amber-200 rounded p-2 text-xs overflow-x-auto"><code>npm run db:migrate
npm run db:seed:reviews</code></pre>
          <p className="m-0 mt-2 text-xs text-amber-900/70">DB-Fehler: {dbError}</p>
        </div>
      </div>
    );
  }

  // Aggregat pro Quelle (nur published)
  const aggregates: Record<string, { count: number; avg: number | null; published: number }> = {};
  for (const r of all) {
    const s = r.source as string;
    if (!aggregates[s]) aggregates[s] = { count: 0, avg: null, published: 0 };
    aggregates[s].count++;
    if (r.published) aggregates[s].published++;
  }
  for (const s of Object.keys(aggregates)) {
    const rated = all.filter((r) => r.source === s && r.published && r.rating !== null);
    if (rated.length > 0) {
      const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0);
      aggregates[s].avg = sum / rated.length;
    }
  }

  const totalPublished = all.filter((r) => r.published).length;
  const totalHighlights = all.filter((r) => r.published && r.highlight).length;
  const ratedPublished = all.filter((r) => r.published && r.rating !== null);
  const overallAvg = ratedPublished.length
    ? ratedPublished.reduce((a, r) => a + (r.rating ?? 0), 0) / ratedPublished.length
    : null;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Bewertungen</h1>
          <p className="text-sm text-[var(--color-wh-fg-muted)] m-0">
            Externe Bewertungen aus Google + Plattformen. Steuere hier, was auf der
            Landing-Page als Trust-Badge erscheint.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Veröffentlicht"
          value={totalPublished.toString()}
          sub={`von ${all.length}`}
        />
        <StatCard
          label="Ø Sterne"
          value={overallAvg !== null ? overallAvg.toFixed(2) : "—"}
          sub={`${ratedPublished.length} mit Rating`}
        />
        <StatCard
          label="Highlights"
          value={totalHighlights.toString()}
          sub="im Carousel"
        />
        <StatCard label="Quellen" value={Object.keys(aggregates).length.toString()} sub="" />
      </div>

      {/* Per-Source Aggregat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Object.entries(aggregates).map(([source, agg]) => (
          <div
            key={source}
            className="bg-white border border-[var(--color-wh-winter-grey)] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                  SOURCE_COLOR[source] ?? "bg-slate-50 text-slate-800"
                }`}
              >
                {SOURCE_LABEL[source] ?? source}
              </span>
              <span className="text-xs text-[var(--color-wh-fg-muted)]">
                {agg.published}/{agg.count} aktiv
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-wh-deep-green)]">
              {agg.avg !== null ? agg.avg.toFixed(2) : "—"}
              <span className="text-sm font-normal text-[var(--color-wh-fg-muted)] ml-1">/ 5</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add manuell */}
      <details className="mb-6 bg-white border border-[var(--color-wh-winter-grey)] rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-sm flex items-center gap-2">
          <Plus size={16} />
          Neue Bewertung manuell hinzufügen
        </summary>
        <form action={addReviewAction} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[var(--color-wh-winter-grey)]">
          <Field label="Quelle">
            <select name="source" defaultValue="manual" className={inputCls}>
              <option value="manual">Manuell</option>
              <option value="google">Google</option>
              <option value="gruppenhaus">Gruppenhaus.de</option>
              <option value="gruppenunterkuenfte">Gruppenunterkünfte.de</option>
            </select>
          </Field>
          <Field label="Autor*in">
            <input name="authorName" required maxLength={200} className={inputCls} />
          </Field>
          <Field label="Sterne (1-5, leer = kein Rating)">
            <input name="rating" type="number" min={1} max={5} className={inputCls} />
          </Field>
          <Field label="Datum (YYYY-MM-DD, optional)">
            <input name="reviewedAt" type="date" className={inputCls} />
          </Field>
          <Field label='Relative Zeit (z.B. "vor 2 Jahren", optional)'>
            <input name="relativeTime" maxLength={60} className={inputCls} />
          </Field>
          <Field label="Quelle-URL (optional)">
            <input name="sourceUrl" type="url" className={inputCls} />
          </Field>
          <Field label="Text" className="sm:col-span-2">
            <textarea name="text" rows={3} maxLength={4000} className={inputCls + " resize-y"} />
          </Field>
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="highlight" />
            Direkt als Highlight markieren (im Trust-Badge zeigen)
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-[var(--color-wh-deep-green)] text-white rounded-full px-5 py-2 text-sm font-semibold"
            >
              <Plus size={16} />
              Hinzufügen
            </button>
          </div>
        </form>
      </details>

      {/* Liste */}
      <div className="space-y-3">
        {all.map((r) => (
          <div
            key={r.id}
            className={`bg-white border rounded-lg p-4 ${
              r.published
                ? "border-[var(--color-wh-winter-grey)]"
                : "border-[var(--color-wh-winter-grey)] opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold">{r.authorName}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      SOURCE_COLOR[r.source] ?? "bg-slate-50 text-slate-800"
                    }`}
                  >
                    {SOURCE_LABEL[r.source] ?? r.source}
                  </span>
                  {r.rating !== null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < (r.rating ?? 0) ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                  )}
                  {r.highlight && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                      <Sparkles size={12} /> Highlight
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-wh-fg-muted)]">
                  {r.relativeTime ?? r.reviewedAt ?? ""}
                  {r.translated && (
                    <span className="ml-2">
                      · übersetzt aus {r.originalLanguage?.toUpperCase()}
                    </span>
                  )}
                </div>
                {r.text && <p className="text-sm mt-2 m-0 whitespace-pre-wrap">{r.text}</p>}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <form action={togglePublishedAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    title={r.published ? "Depublizieren" : "Veröffentlichen"}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      r.published
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {r.published ? <Eye size={12} /> : <EyeOff size={12} />}
                    {r.published ? "Public" : "Hidden"}
                  </button>
                </form>
                <form action={toggleHighlightAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    title="Highlight an/aus"
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      r.highlight
                        ? "bg-amber-100 border-amber-300 text-amber-900"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <Sparkles size={12} />
                    {r.highlight ? "An" : "Aus"}
                  </button>
                </form>
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    title="Löschen"
                    className="inline-flex items-center text-xs text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {all.length === 0 && (
          <div className="text-center py-12 text-[var(--color-wh-fg-muted)]">
            Noch keine externen Bewertungen importiert. Lege oben manuell welche an oder
            führe <code className="bg-[var(--color-wh-beige)] px-1.5 py-0.5 rounded text-xs">npm run db:seed:reviews</code> aus.
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none";

const StatCard = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-lg p-4">
    <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
      {label}
    </div>
    <div className="text-2xl font-bold text-[var(--color-wh-deep-green)]">{value}</div>
    {sub && <div className="text-xs text-[var(--color-wh-fg-muted)] mt-0.5">{sub}</div>}
  </div>
);

const Field = ({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <label className={`block text-xs ${className}`}>
    <span className="block font-medium text-[var(--color-wh-deep-green)] mb-1">{label}</span>
    {children}
  </label>
);

// Mark referenced to avoid drizzle tree-shaking unused
void sql;
