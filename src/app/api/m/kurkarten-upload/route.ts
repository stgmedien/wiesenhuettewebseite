import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const form = await req.formData();
  const bookingId = form.get("bookingId");
  const file = form.get("file");
  if (typeof bookingId !== "string" || !(file instanceof Blob)) {
    return NextResponse.json({ error: "bookingId + file erforderlich" }, { status: 400 });
  }
  if ((file as File).type !== "application/pdf") {
    return NextResponse.json({ error: "Nur PDF-Dateien erlaubt." }, { status: 400 });
  }

  const filename = `kurkarten/${bookingId}/${Date.now()}-gaestekarten.pdf`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
  });

  await db
    .update(bookings)
    .set({ kurkartenPdfUrl: blob.url })
    .where(eq(bookings.id, bookingId));

  return NextResponse.json({ url: blob.url });
}
