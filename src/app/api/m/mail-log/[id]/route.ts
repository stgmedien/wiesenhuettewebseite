import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Params) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const [row] = await db
    .select({ subject: emailLog.subject, to: emailLog.to, bodyHtml: emailLog.bodyHtml })
    .from(emailLog)
    .where(eq(emailLog.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (!row.bodyHtml) {
    return new NextResponse(
      "Für diese Mail wurde kein Inhalt gespeichert (verschickt vor Einführung dieser Funktion, oder aus Sicherheitsgründen ausgeschlossen — z. B. Login-Links).",
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  return new NextResponse(row.bodyHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
