import { db } from "@/lib/db";
import { communityEntries } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { CommunityEntryCard, type CommunityEntryView } from "@/components/public/CommunityEntryCard";
import { CommunitySubmitForm } from "@/components/public/CommunitySubmitForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gästebuch · Wiesenhütte",
  description:
    "Eindrücke, Anekdoten und Erinnerungen von Gästen, die in der Wiesenhütte zu Besuch waren. Persönlich, gemeinschaftlich, ehrlich.",
};

export default async function GaestebuchPage() {
  const rows = await db
    .select({
      id: communityEntries.id,
      authorName: communityEntries.authorName,
      authorContext: communityEntries.authorContext,
      title: communityEntries.title,
      body: communityEntries.body,
      photoUrls: communityEntries.photoUrls,
      visitDate: communityEntries.visitDate,
      submittedAt: communityEntries.submittedAt,
    })
    .from(communityEntries)
    .where(
      and(
        eq(communityEntries.kind, "guestbook"),
        eq(communityEntries.status, "approved")
      )
    )
    .orderBy(desc(communityEntries.submittedAt))
    .limit(100);

  const entries: CommunityEntryView[] = rows;

  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--color-wh-deep-green)] text-white px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-white/85 mb-2">
            Stimmen aus der Hütte
          </div>
          <h1 className="text-[36px] sm:text-[56px] md:text-[64px] m-0 mb-4 leading-[1.05] font-display font-bold">
            Gästebuch.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-white/90 m-0">
            Hier sammeln wir, was Gäste über ihre Tage in der Wiesenhütte schreiben — Anekdoten,
            Eindrücke, kleine Geschichten. Persönlich statt anonym. Alle Beiträge werden vor
            Veröffentlichung gelesen.
          </p>
        </div>
      </section>

      {/* Einträge */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[760px] mx-auto">
          {entries.length === 0 ? (
            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-8 text-center">
              <p className="text-[var(--color-wh-fg-muted)] italic m-0">
                Noch keine Einträge — möchtest Du der erste sein?
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {entries.map((e) => (
                <CommunityEntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Submit-Form */}
      <section id="schreiben" className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[760px] mx-auto">
          <CommunitySubmitForm kind="guestbook" />
        </div>
      </section>
    </div>
  );
}
