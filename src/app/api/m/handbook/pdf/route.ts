import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { ManagerHandbook } from "@/lib/manager-handbook-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";
  const generatedAt = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const buffer = await renderToBuffer(
    ManagerHandbook({ baseUrl, generatedAt })
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Wiesenhuette_Manager_Handbuch.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
