import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

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

  const ext = (file as File).name?.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = /^(jpg|jpeg|png|webp|heic)$/i.test(ext) ? ext : "jpg";
  const filename = `handover/${bookingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: (file as File).type ?? "image/jpeg",
  });

  return NextResponse.json({ url: blob.url });
}
