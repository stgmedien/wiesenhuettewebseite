import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLog, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  SIGNED_MELDESCHEIN_ROOT,
  signedMeldescheinDeleteAfter,
  signedMeldescheinPrefix,
} from "@/lib/meldeschein-signiert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") return null;
  return session;
}

/** Foto/Scan des unterschriebenen Meldescheins hochladen (Bild oder PDF). */
export async function POST(req: NextRequest) {
  const session = await requireManager();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });

  const form = await req.formData();
  const bookingId = form.get("bookingId");
  const file = form.get("file");
  if (typeof bookingId !== "string" || !(file instanceof Blob)) {
    return NextResponse.json({ error: "bookingId + file erforderlich" }, { status: 400 });
  }
  const type = (file as File).type;
  if (!(type.startsWith("image/") || type === "application/pdf")) {
    return NextResponse.json({ error: "Nur Fotos oder PDF erlaubt." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max. 15 MB)." }, { status: 400 });
  }

  const [booking] = await db
    .select({ departure: bookings.departure })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  const deleteAfter = signedMeldescheinDeleteAfter(booking.departure);
  const ext = ((file as File).name.split(".").pop() || (type === "application/pdf" ? "pdf" : "jpg"))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const blob = await put(
    `${signedMeldescheinPrefix(bookingId)}loeschen-ab-${deleteAfter}/meldeschein.${ext}`,
    file,
    { access: "public", addRandomSuffix: true, contentType: type }
  );

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Unterschriebenen Meldeschein hochgeladen — wird am ${deleteAfter.split("-").reverse().join(".")} automatisch gelöscht.`,
    bookingId,
  });

  return NextResponse.json({ url: blob.url, deleteAfter });
}

/** Einzelnes Foto vorzeitig löschen. */
export async function DELETE(req: NextRequest) {
  const session = await requireManager();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  const { bookingId, url } = (await req.json().catch(() => ({}))) as { bookingId?: string; url?: string };
  if (!bookingId || !url) return NextResponse.json({ error: "bookingId + url erforderlich" }, { status: 400 });
  // Nur Dateien aus dem Meldeschein-Ordner DIESER Buchung.
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
  }
  if (!pathname.startsWith(SIGNED_MELDESCHEIN_ROOT) || !pathname.startsWith(signedMeldescheinPrefix(bookingId))) {
    return NextResponse.json({ error: "Ungültige Datei" }, { status: 400 });
  }
  await del(url);
  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: "Unterschriebenen Meldeschein gelöscht.",
    bookingId,
  });
  return NextResponse.json({ ok: true });
}
