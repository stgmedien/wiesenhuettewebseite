import { db } from "@/lib/db";
import { communityEntries } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
  approveCommunityEntry,
  rejectCommunityEntry,
  deleteCommunityEntry,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community-Moderation · Wiesenhütte Manager" };

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

export default async function CommunityModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const sp = await searchParams;
  const filter = sp.filter === "approved" || sp.filter === "rejected" ? sp.filter : "pending";

  const entries = await db
    .select()
    .from(communityEntries)
    .where(eq(communityEntries.status, filter))
    .orderBy(desc(communityEntries.submittedAt))
    .limit(200);

  const pendingCount = (
    await db
      .select({ id: communityEntries.id })
      .from(communityEntries)
      .where(eq(communityEntries.status, "pending"))
  ).length;

  return (
    <div className="px-8 py-10 max-w-[1100px]">
      <div className="eyebrow">Manager · Community</div>
      <h1 className="text-[36px] mt-2 mb-1">Gästebuch & Schulprojekt.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-6">
        Eingehende Beiträge prüfen und freischalten. Pending-Einträge sind nicht öffentlich
        sichtbar. Beleidigende oder rechtswidrige Beiträge bitte ablehnen oder löschen.
      </p>

      <nav className="flex gap-2 mb-8 border-b border-[var(--color-wh-winter-grey)]">
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <a
            key={f}
            href={`/m/community?filter=${f}`}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              filter === f
                ? "border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)]"
                : "border-transparent text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)]"
            }`}
          >
            {f === "pending" ? `Pending (${pendingCount})` : f === "approved" ? "Freigegeben" : "Abgelehnt"}
          </a>
        ))}
      </nav>

      {entries.length === 0 ? (
        <p className="text-[var(--color-wh-fg-muted)] italic">
          Keine Einträge in dieser Kategorie.
        </p>
      ) : (
        <div className="space-y-6">
          {entries.map((e) => (
            <article
              key={e.id}
              className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6"
            >
              <header className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                        e.kind === "guestbook"
                          ? "bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)]"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {e.kind === "guestbook" ? "Gästebuch" : "Schulprojekt"}
                    </span>
                    <span className="text-[11px] text-[var(--color-wh-fg-muted)] font-mono">
                      {e.submittedAt.toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="m-0 font-semibold text-[16px] text-[var(--color-wh-deep-green)]">
                    {e.authorName}
                    {e.authorContext && (
                      <span className="text-[var(--color-wh-fg-muted)] font-normal ml-2">
                        ({e.authorContext})
                      </span>
                    )}
                  </p>
                  {e.authorEmail && (
                    <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                      ↳ {e.authorEmail}
                    </p>
                  )}
                  {e.visitDate && (
                    <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                      Aufenthalt: {new Date(e.visitDate).toLocaleDateString("de-DE")}
                    </p>
                  )}
                </div>
                {e.submittedIp && (
                  <span className="text-[11px] font-mono text-[var(--color-wh-fg-muted)]">
                    {e.submittedIp}
                  </span>
                )}
              </header>

              {e.title && (
                <h3 className="font-display font-bold text-[18px] m-0 mb-2">
                  {e.title}
                </h3>
              )}

              <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--color-wh-black)] mb-4">
                {e.body}
              </div>

              {e.photoUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {e.photoUrls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-md overflow-hidden bg-[var(--color-wh-beige)] block"
                    >
                      <Image
                        src={url}
                        alt={`Photo ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </a>
                  ))}
                </div>
              )}

              {filter === "pending" && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--color-wh-winter-grey)]/40">
                  <form
                    action={async (fd) => {
                      "use server";
                      await approveCommunityEntry(fd);
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700"
                    >
                      ✓ Freigeben
                    </button>
                  </form>

                  <form
                    action={async (fd) => {
                      "use server";
                      await rejectCommunityEntry(fd);
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={e.id} />
                    <input
                      type="text"
                      name="note"
                      placeholder="Grund (optional)"
                      className={`${inputBase} w-56`}
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-amber-400 text-amber-800 px-4 py-2 text-sm font-semibold hover:bg-amber-50"
                    >
                      Ablehnen
                    </button>
                  </form>

                  <form
                    action={async (fd) => {
                      "use server";
                      await deleteCommunityEntry(fd);
                    }}
                  >
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-300 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-50"
                      title="Komplett löschen (inkl. Photos)"
                    >
                      ✕ Löschen
                    </button>
                  </form>
                </div>
              )}

              {filter !== "pending" && (
                <div className="pt-4 border-t border-[var(--color-wh-winter-grey)]/40 flex items-center justify-between gap-4">
                  <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0">
                    {e.status === "approved" ? "Freigegeben" : "Abgelehnt"}
                    {e.moderatedBy && ` von ${e.moderatedBy}`}
                    {e.moderatedAt &&
                      ` am ${e.moderatedAt.toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}`}
                    {e.moderationNote && ` · Notiz: ${e.moderationNote}`}
                  </p>
                  <form
                    action={async (fd) => {
                      "use server";
                      await deleteCommunityEntry(fd);
                    }}
                  >
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-300 text-red-700 px-3 py-1 text-xs hover:bg-red-50"
                    >
                      Löschen
                    </button>
                  </form>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
