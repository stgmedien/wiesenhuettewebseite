import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ImportClient } from "./ImportClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mitglieder-Import · Wiesenhütte Manager" };

export default async function MitgliederImportPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1100px]">
      <Link
        href="/m/mitgliedschaften"
        className="text-sm text-[var(--color-wh-deep-green)] hover:underline mb-4 inline-block"
      >
        ← Zurück zur Mitgliederliste
      </Link>
      <div className="eyebrow">Manager · Mitglieder-Import</div>
      <h1 className="text-[36px] mt-2 mb-1">CSV-Import.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8 max-w-2xl">
        Bulk-Import der Vereinsmitgliederliste. Neue Datensätze werden als verifiziertes
        Mitglied angelegt (ohne Account-User — Mitglieder können sich später selbst
        registrieren, der Match passiert via Email-Adresse). Existierende Datensätze
        werden mit Mitgliedsnummer + verifiziertem Status aktualisiert.
      </p>

      <ImportClient />
    </div>
  );
}
