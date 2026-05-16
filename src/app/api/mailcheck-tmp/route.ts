// TEMPORÄRER Diagnose-Endpoint — prüft den PRODUKTIONS-Mailversand.
// Wird direkt nach dem Test wieder entfernt. Sendet EINE Mail an support@.
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail/send";
import KurtaxeInfoEmail from "@/lib/mail/templates/kurtaxe-info";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GUARD = "5dc43f4677bc768cfc800c988b97b0db85b574886af71e73";
const TO = "support@xn--wiesenhtte-geb.com";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== GUARD) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const mailFrom = process.env.MAIL_FROM ?? "(MAIL_FROM nicht gesetzt → Fallback)";
  const smtpUser = process.env.SMTP_USER ?? "";
  const smtpUserDomain = smtpUser.includes("@")
    ? "***@" + smtpUser.split("@")[1]
    : "(SMTP_USER nicht gesetzt)";
  const smtpHost = process.env.SMTP_HOST ?? "(nicht gesetzt)";

  try {
    await sendMail({
      to: TO,
      subject: "[PROD-TEST 2] Absender-Check Produktion nach Passwort-Update",
      template: "prod-mailcheck-2",
      react: KurtaxeInfoEmail({
        guestName: "Max Mustermann",
        bookingNumber: "WH-PROD-CHECK",
        arrival: "20.02.2026",
        departure: "23.02.2026",
      }),
    });
    return NextResponse.json({ ok: true, sentTo: TO, mailFrom, smtpHost, smtpUserDomain });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      mailFrom,
      smtpHost,
      smtpUserDomain,
    });
  }
}
