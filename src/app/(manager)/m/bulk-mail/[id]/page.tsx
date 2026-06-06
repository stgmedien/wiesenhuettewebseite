import { db } from "@/lib/db";
import { bulkMailCampaigns, bulkMailSends } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { sendCampaign, deleteCampaign } from "../actions";
import { markdownToHtml } from "@/lib/markdown-to-html";
import { AUDIENCE_LABELS } from "@/lib/bulk-mail-audience";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const { id } = await params;
  const c = (
    await db.select().from(bulkMailCampaigns).where(eq(bulkMailCampaigns.id, id)).limit(1)
  )[0];
  if (!c) notFound();

  const sends =
    c.status === "sent" || c.status === "sending"
      ? await db
          .select()
          .from(bulkMailSends)
          .where(eq(bulkMailSends.campaignId, id))
          .orderBy(desc(bulkMailSends.sentAt))
          .limit(500)
      : [];

  const previewHtml = markdownToHtml(c.body);

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[900px]">
      <Link
        href="/m/bulk-mail"
        className="text-sm text-[var(--color-wh-deep-green)] hover:underline mb-4 inline-block"
      >
        ← Zurück zur Übersicht
      </Link>
      <div className="eyebrow">Manager · Bulk-Mail</div>
      <h1 className="text-[32px] mt-2 mb-2">{c.subject}</h1>
      <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-6">
        Status: <strong>{c.status}</strong> · Audience:{" "}
        {AUDIENCE_LABELS[c.audience as keyof typeof AUDIENCE_LABELS] ?? c.audience} ·{" "}
        {c.totalRecipients} Empfänger geplant
      </p>

      {/* Vorschau */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mb-6">
        <h2 className="text-[16px] m-0 mb-4 font-semibold">Vorschau (Inhaltsbereich)</h2>
        <div className="bg-[var(--color-wh-snow)] rounded-lg p-5 border border-[var(--color-wh-winter-grey)]/40">
          <p className="text-[14px] m-0 mb-3 text-[var(--color-wh-fg-muted)]">
            Hallo <em>{"{firstName}"}</em>,
          </p>
          <div
            className="prose-block"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <hr className="border-[var(--color-wh-winter-grey)] my-5" />
          <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0">
            Diese Mail kommt von den Skifreunden Gütersloh e.V. — wir schreiben Dir nur ab und zu,
            wenn etwas Wichtiges rund um die Wiesenhütte ansteht. Falls Du keine weiteren Newsletter
            erhalten möchtest: <em className="underline">hier abmelden</em>.
          </p>
        </div>
      </section>

      {/* Send-Action */}
      {c.status === "draft" && (
        <section className="bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] p-6 mb-6">
          <h2 className="text-[16px] m-0 mb-2 font-semibold text-amber-900">
            Bereit zum Versand
          </h2>
          <p className="text-[14px] text-amber-900 m-0 mb-4">
            Diese Mail geht an <strong>{c.totalRecipients}</strong> Empfänger. Customer mit
            Opt-Out werden automatisch übersprungen. Versand kann nicht rückgängig gemacht
            werden.
          </p>
          <form
            action={async (fd) => {
              "use server";
              await sendCampaign(fd);
            }}
            className="flex items-center gap-3"
          >
            <input type="hidden" name="id" value={c.id} />
            <button
              type="submit"
              className="rounded-full bg-amber-700 text-white px-6 py-2.5 text-sm font-semibold"
            >
              Jetzt versenden
            </button>
            <span className="text-[12px] text-amber-900/70">
              Bitte vorher nochmal lesen!
            </span>
          </form>
        </section>
      )}

      {c.status === "sent" && (
        <section className="bg-emerald-50 border border-emerald-200 rounded-[var(--radius-card)] p-5 mb-6">
          <p className="font-semibold text-emerald-900 m-0 mb-1">
            ✓ Versandt am{" "}
            {c.sentAt?.toLocaleString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-[14px] text-emerald-900 m-0">
            {c.totalSent} versandt · {c.totalFailed} fehlgeschlagen
          </p>
        </section>
      )}

      {/* Sends-Liste */}
      {sends.length > 0 && (
        <section>
          <h2 className="text-[16px] m-0 mb-3 font-semibold">Empfänger-Log ({sends.length})</h2>
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-wh-beige)]/30 border-b border-[var(--color-wh-winter-grey)]">
                <tr>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wider font-semibold">
                    E-Mail
                  </th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wider font-semibold">
                    Status
                  </th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wider font-semibold">
                    Zeitpunkt
                  </th>
                </tr>
              </thead>
              <tbody>
                {sends.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--color-wh-winter-grey)]/30">
                    <td className="px-4 py-2 font-mono text-[12px]">{s.email}</td>
                    <td className="px-4 py-2 text-[12px]">
                      {s.status === "sent" ? "✓ versandt" : s.status === "failed" ? `✕ ${s.errorMessage ?? "Fehler"}` : s.status}
                    </td>
                    <td className="px-4 py-2 text-[12px] font-mono text-[var(--color-wh-fg-muted)]">
                      {s.sentAt.toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {c.status === "draft" && (
        <form
          action={async (fd) => {
            "use server";
            await deleteCampaign(fd);
            redirect("/m/bulk-mail");
          }}
          className="mt-8 pt-6 border-t border-[var(--color-wh-winter-grey)]/40"
        >
          <input type="hidden" name="id" value={c.id} />
          <button
            type="submit"
            className="rounded-full border border-red-300 text-red-700 px-4 py-1.5 text-xs hover:bg-red-50"
          >
            Entwurf löschen
          </button>
        </form>
      )}
    </div>
  );
}
