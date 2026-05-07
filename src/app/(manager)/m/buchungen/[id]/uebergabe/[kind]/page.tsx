import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bookings, customers, handovers } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { HandoverWizard } from "./HandoverWizard";
import { formatDateLong } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Übergabeprotokoll · Wiesenhütte Manager" };

type Props = { params: Promise<{ id: string; kind: string }> };

export default async function HandoverPage({ params }: Props) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const { id, kind } = await params;
  if (kind !== "checkin" && kind !== "checkout") notFound();

  const found = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  const booking = found[0];
  if (!booking) notFound();

  const customer = booking.customerId
    ? (await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1))[0]
    : null;

  const previousHandovers = await db
    .select()
    .from(handovers)
    .where(and(eq(handovers.bookingId, id), eq(handovers.kind, kind)))
    .orderBy(desc(handovers.createdAt));
  const existing = previousHandovers[0];

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link
          href={`/m/buchungen/${id}`}
          className="text-sm text-[var(--color-wh-fg-muted)] no-underline mb-4 inline-block"
        >
          ← Zurück zur Buchung
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-heading text-[var(--color-wh-deep-green)] m-0">
            {kind === "checkin" ? "Anreise · Übergabeprotokoll" : "Abreise · Übernahmeprotokoll"}
          </h1>
          <p className="text-sm text-[var(--color-wh-fg-muted)] mt-1">
            {booking.bookingNumber} ·{" "}
            {kind === "checkin"
              ? `Anreise: ${formatDateLong(booking.arrival)}`
              : `Abreise: ${formatDateLong(booking.departure)}`}
            {customer && ` · ${customer.firstName} ${customer.lastName}`}
          </p>
        </div>

        {existing ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 mb-6">
            <p className="font-semibold text-emerald-900 mb-1">
              ✓ Bereits dokumentiert am{" "}
              {existing.completedAt
                ? new Date(existing.completedAt).toLocaleString("de-DE")
                : new Date(existing.createdAt).toLocaleString("de-DE")}{" "}
              durch {existing.by ?? "—"}
            </p>
            <p className="text-sm text-emerald-800 mb-3">
              {(existing.checklist as { ok: boolean }[]).filter((c) => c.ok).length}/
              {(existing.checklist as { ok: boolean }[]).length} Punkte ok ·{" "}
              {(existing.photoUrls as string[]).length} Fotos
            </p>
            {existing.notes && (
              <p className="text-sm text-[var(--color-wh-black)] italic">
                „{existing.notes}"
              </p>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-[var(--color-wh-deep-green)] underline">
                Neues Protokoll erfassen (überschreibt nicht das alte)
              </summary>
              <div className="mt-4">
                <HandoverWizard
                  bookingId={booking.id}
                  kind={kind}
                  bookingNumber={booking.bookingNumber}
                  initialGuestName={
                    customer ? `${customer.firstName} ${customer.lastName}` : ""
                  }
                />
              </div>
            </details>
          </div>
        ) : (
          <HandoverWizard
            bookingId={booking.id}
            kind={kind}
            bookingNumber={booking.bookingNumber}
            initialGuestName={
              customer ? `${customer.firstName} ${customer.lastName}` : ""
            }
          />
        )}
      </div>
    </div>
  );
}
