import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HandbookClient } from "./HandbookClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manager-Handbuch · Wiesenhütte" };

export default async function HandbuchPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  return (
    <div className="px-6 lg:px-8 py-8">
      <header className="mb-6 max-w-[1100px]">
        <p className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-1">
          Manager · Dokumentation
        </p>
        <h1 className="font-display font-bold text-4xl text-[var(--color-wh-deep-green)] m-0 mb-2">
          Manager-Handbuch
        </h1>
        <p className="text-[var(--color-wh-fg-muted)] m-0 max-w-2xl">
          Kompakte Anleitung für jede Funktion im Backend — durchsuchbar und mit
          Permalinks für jede Sektion. Bei Unklarheiten: Klick auf{" "}
          <em>FAQ &amp; Troubleshooting</em> oder direkt mit dem Suchfeld arbeiten.
        </p>
      </header>
      <HandbookClient />
    </div>
  );
}
