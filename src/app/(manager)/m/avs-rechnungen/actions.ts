"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/mail/send";
import AvsInvoiceFinanceEmail from "@/lib/mail/templates/avs-invoice-finance";
import { AVS_INVOICE_TEMPLATE } from "./constants";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel-Funktionen nehmen max. ~4,5 MB Request-Body

type Result = { ok: true; sentTo: string; count: number } | { ok: false; error: string };

const safeName = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120) || "rechnung.pdf";

/**
 * AVS-/Kurbeitrags-Rechnungen hochladen und direkt an die Vereinsfinanzen
 * (Norbert, MAIL_FINANCE_TO) schicken. Die PDFs werden zusaetzlich im Blob
 * abgelegt, damit der Verlauf auf /m/avs-rechnungen sie verlinken kann.
 */
export async function sendAvsInvoices(formData: FormData): Promise<Result> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") return { ok: false, error: "Nicht autorisiert" };

  const financeTo = process.env.MAIL_FINANCE_TO;
  if (!financeTo) {
    return { ok: false, error: "Keine Finanz-Adresse hinterlegt (MAIL_FINANCE_TO) — nichts verschickt." };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Bitte mindestens eine PDF auswählen." };
  if (files.some((f) => f.type !== "application/pdf")) {
    return { ok: false, error: "Nur PDF-Dateien erlaubt." };
  }
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > MAX_BYTES) {
    return { ok: false, error: "Zusammen zu groß (max. 4 MB) — bitte einzeln hochladen." };
  }
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || undefined;

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
  const attachments = await Promise.all(
    files.map(async (f) => ({
      filename: safeName(f.name),
      content: Buffer.from(await f.arrayBuffer()),
      contentType: "application/pdf",
    }))
  );

  // Ablage fuer den Verlauf. Scheitert sie, geht die Mail trotzdem raus —
  // Norbert hat die PDF dann im Anhang.
  try {
    await Promise.all(
      attachments.map((a) =>
        put(`avs-rechnungen/${today}/${a.filename}`, a.content, {
          access: "public",
          addRandomSuffix: true,
          contentType: "application/pdf",
        })
      )
    );
  } catch (err) {
    console.error("[avs-rechnungen] Blob-Ablage fehlgeschlagen:", err);
  }

  const names = attachments.map((a) => a.filename);
  try {
    await sendMail({
      to: financeTo,
      subject: `AVS-Rechnung: ${names.join(", ")}`.slice(0, 250),
      template: AVS_INVOICE_TEMPLATE,
      attachments,
      replyTo: session?.user?.email ?? undefined,
      react: AvsInvoiceFinanceEmail({
        fileNames: names,
        note,
        uploadedBy: session?.user?.name ?? session?.user?.email ?? "Manager",
      }),
    });
  } catch {
    return { ok: false, error: "Mailversand fehlgeschlagen — bitte später nochmal versuchen." };
  }

  revalidatePath("/m/avs-rechnungen");
  return { ok: true, sentTo: financeTo, count: names.length };
}
