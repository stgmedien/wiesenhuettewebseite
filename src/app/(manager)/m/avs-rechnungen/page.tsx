import { list } from "@vercel/blob";
import { desc, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import AvsInvoiceForm from "./AvsInvoiceForm";
import { AVS_INVOICE_TEMPLATE } from "./constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "AVS-Rechnungen · Wiesenhütte Manager" };

const fmt = (d: Date) =>
  d.toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AvsRechnungenPage() {
  const financeTo = process.env.MAIL_FINANCE_TO;

  const sent = await db
    .select({
      id: emailLog.id,
      subject: emailLog.subject,
      to: emailLog.to,
      status: emailLog.status,
      deliveryStatus: emailLog.deliveryStatus,
      sentAt: emailLog.sentAt,
    })
    .from(emailLog)
    .where(eq(emailLog.template, AVS_INVOICE_TEMPLATE))
    .orderBy(desc(emailLog.sentAt))
    .limit(50);

  let files: { url: string; pathname: string; uploadedAt: Date }[] = [];
  try {
    files = (await list({ prefix: "avs-rechnungen/", limit: 200 })).blobs;
  } catch (err) {
    console.error("[avs-rechnungen] Blob-Liste fehlgeschlagen:", err);
  }
  files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="eyebrow">Finanzen</div>
      <h1 className="text-[40px] mt-2 mb-1">AVS-Rechnungen</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 max-w-[760px]">
        Rechnungen der AVS bzw. Kurverwaltung hier als PDF hochladen. Sie gehen sofort per Mail
        mit Anhang an {financeTo ? <strong>{financeTo}</strong> : "die Finanzen"} (Norbert) zur
        Zahlung.
      </p>
      {!financeTo && (
        <p className="mt-3 text-sm text-[#7a3a20]">
          Achtung: MAIL_FINANCE_TO ist nicht gesetzt — Versand ist gerade nicht möglich.
        </p>
      )}

      <div className="grid lg:grid-cols-[400px_minmax(0,1fr)] gap-6 mt-8 items-start">
        <AvsInvoiceForm />

        <div className="space-y-6 min-w-0">
          <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 overflow-x-auto">
            <h3 className="text-[20px] m-0 mb-4">Verschickt</h3>
            {sent.length === 0 ? (
              <p className="text-sm text-[var(--color-wh-fg-muted)] m-0">Noch nichts verschickt.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                    <th className="py-2 pr-3">Datum</th>
                    <th className="py-2 pr-3">Betreff</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sent.map((m) => (
                    <tr key={m.id} className="border-t border-[var(--color-wh-winter-grey)]">
                      <td className="py-2 pr-3 whitespace-nowrap">{fmt(m.sentAt)}</td>
                      <td className="py-2 pr-3">{m.subject.replace(/^AVS-Rechnung: /, "")}</td>
                      <td className="py-2 whitespace-nowrap">
                        {m.status === "failed" ? (
                          <span className="text-[#7a3a20]">fehlgeschlagen</span>
                        ) : m.deliveryStatus && m.deliveryStatus !== "delivered" ? (
                          <span className="text-[#7a3a20]">{m.deliveryStatus}</span>
                        ) : m.deliveryStatus === "delivered" ? (
                          <span className="text-emerald-700">zugestellt</span>
                        ) : (
                          <span>verschickt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {files.length > 0 && (
            <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
              <h3 className="text-[20px] m-0 mb-4">Abgelegte PDFs</h3>
              <ul className="m-0 p-0 list-none space-y-1.5 text-sm">
                {files.map((f) => (
                  <li key={f.url} className="flex items-center gap-2">
                    <span className="text-[var(--color-wh-fg-muted)] whitespace-nowrap">
                      {f.uploadedAt.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}
                    </span>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-wh-deep-green)] inline-flex items-center gap-1 break-all"
                    >
                      {f.pathname.split("/").pop()} <ExternalLink size={11} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
