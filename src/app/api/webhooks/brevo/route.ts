/**
 * Empfängt Zustell-Events von Brevo (delivered/bounced/blocked/spam/...) und
 * trägt den echten Zustellstatus in emailLog nach — unser eigenes Log weiß
 * sonst nur, ob die SMTP-Übergabe an Brevo geklappt hat, nicht ob die Mail
 * beim Empfänger ankam. Zuordnung über die Message-ID (siehe send.ts).
 *
 * Absicherung: Brevo bietet kein HMAC-Signing für Webhooks, nur Basic-Auth
 * über die konfigurierte URL (https://user:pass@.../api/webhooks/brevo) —
 * siehe https://developers.brevo.com/docs/username-and-password-authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const user = process.env.BREVO_WEBHOOK_USER;
  const pass = process.env.BREVO_WEBHOOK_PASSWORD;
  if (!user || !pass) return false;
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
  } catch {
    return false;
  }
  return decoded === `${user}:${pass}`;
}

function normalizeMessageId(id: unknown): string | null {
  if (typeof id !== "string" || !id) return null;
  return id.replace(/^<|>$/g, "");
}

// Nur zustellrelevante Events abbilden — click/opened/unsubscribed/deferred/
// sent/request sagen nichts darüber aus, ob die Mail ankam oder nicht.
const EVENT_TO_DELIVERY_STATUS: Record<string, string> = {
  delivered: "delivered",
  hardBounce: "bounced",
  softBounce: "bounced",
  blocked: "blocked",
  spam: "spam",
  invalid: "invalid",
};

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : null;
  const messageId = normalizeMessageId(
    body["message-id"] ?? body.messageId ?? body.message_id
  );
  const deliveryStatus = event ? EVENT_TO_DELIVERY_STATUS[event] : undefined;

  // Kein Fehler an Brevo zurückmelden (sonst deaktivieren die den Webhook
  // nach zu vielen Fehlschlägen) — unbekannte/irrelevante Events einfach
  // quittieren und ignorieren.
  if (!messageId || !deliveryStatus) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await db
      .update(emailLog)
      .set({ deliveryStatus, deliveryStatusAt: new Date() })
      .where(eq(emailLog.messageId, messageId));
  } catch (err) {
    console.error("[brevo-webhook] update failed:", err);
  }

  return NextResponse.json({ ok: true });
}
