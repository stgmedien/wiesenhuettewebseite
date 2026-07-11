import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = (process.env.SMTP_SECURE ?? "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASSWORD not set");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
};

export type MailAttachment = {
  filename: string;
  content: string;
  contentType: string;
};

export type SendMailArgs = {
  to: string;
  subject: string;
  template: string; // template id, used for logging
  react: ReactElement;
  bookingId?: string;
  replyTo?: string;
  bcc?: string;
  attachments?: MailAttachment[];
};

// Vorlagen mit Login-/Verifizierungs-Links werden NIE ins Archiv kopiert:
// eine BCC-Kopie eines Magic-Links wäre ein fertiger Konto-Zugang für jeden
// mit Zugriff auf das Archiv-Postfach.
const ARCHIVE_EXCLUDED_TEMPLATES = new Set([
  "magic_link",
  "welcome",
  "welcome_with_booking",
  "user-welcome",
  "member-welcome",
  "email-verification",
  "email_verification",
  "rad-verify",
]);

export const sendMail = async (args: SendMailArgs): Promise<void> => {
  const html = await render(args.react);
  const text = await render(args.react, { plainText: true });

  const from = process.env.MAIL_FROM ?? "Wiesenhütte <noreply@wiesenhuette.de>";

  // Optionales Versand-Archiv: Wenn MAIL_BCC_ARCHIVE gesetzt ist (z. B. ein
  // Vereins-Postfach), bekommt es jede ausgehende Mail als Blindkopie — so
  // ist im Postfach nachvollziehbar, was das System verschickt hat. SMTP
  // legt sonst keine Kopie in einem "Gesendet"-Ordner ab.
  const archiveBcc =
    process.env.MAIL_BCC_ARCHIVE && !ARCHIVE_EXCLUDED_TEMPLATES.has(args.template)
      ? process.env.MAIL_BCC_ARCHIVE
      : undefined;
  const bcc = [args.bcc, archiveBcc].filter((v): v is string => Boolean(v));

  try {
    const info = await getTransporter().sendMail({
      from,
      to: args.to,
      subject: args.subject,
      html,
      text,
      replyTo: args.replyTo,
      bcc: bcc.length > 0 ? bcc : undefined,
      attachments: args.attachments,
    });

    await db.insert(emailLog).values({
      to: args.to,
      subject: args.subject,
      template: args.template,
      status: "sent",
      bookingId: args.bookingId,
    });

    console.log(`[mail] ${args.template} → ${args.to} (${info.messageId})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.insert(emailLog).values({
      to: args.to,
      subject: args.subject,
      template: args.template,
      status: "failed",
      error: message,
      bookingId: args.bookingId,
    });
    console.error(`[mail] FAILED ${args.template} → ${args.to}:`, message);
    throw err;
  }
};
