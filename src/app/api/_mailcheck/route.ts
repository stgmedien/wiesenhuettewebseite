// TEMPORÄRER Diagnose-Endpoint — prüft, mit welchem Absender die PRODUKTIONS-
// Umgebung Mails verschickt. Wird direkt nach dem Test wieder entfernt.
// Schickt genau EINE Test-Mail an das eigene Support-Postfach.
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail/send";
import KurtaxeInfoEmail from "@/lib/mail/templates/kurtaxe-info";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GUARD = "c2f3381e49fb55da8115d135672d95bb9ef509797d721612";
const TO = "support@xn--wiesenhtte-geb.com";

function maskFrom(v: string | undefined): string {
  if (!v) return "(MAIL_FROM nicht gesetzt → Fallback)";
  return v; // From-Header ist kein Secret
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== GUARD) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const mailFrom = maskFrom(process.env.MAIL_FROM);
  const smtpUser = process.env.SMTP_USER ?? "";
  const smtpUserDomain = smtpUser.includes("@") ? "***@" + smtpUser.split("@")[1] : "(SMTP_USER nicht gesetzt)";
  const smtpHost = process.env.SMTP_HOST ?? "(nicht gesetzt)";

  try {
    await sendMail({
      to: TO,
      subject: "[PROD-TEST] Absender-Check Produktion",
      template: "prod-mailcheck",
      react: KurtaxeInfoEmail({
        guestName: "Max Mustermann",
        bookingNumber: "WH-PROD-CHECK",
        arrival: "20.02.2026",
        departure: "23.02.2026",
      }),
    });
    return NextResponse.json({
      ok: true,
      sentTo: TO,
      mailFrom,
      smtpHost,
      smtpUserDomain,
    });
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
