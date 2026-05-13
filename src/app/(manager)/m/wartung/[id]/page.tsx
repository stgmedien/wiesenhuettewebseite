import { db } from "@/lib/db";
import { maintenanceTickets, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { updateTicket, deleteTicket } from "../actions";

export const dynamic = "force-dynamic";

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const { id } = await params;
  const ticket = (
    await db.select().from(maintenanceTickets).where(eq(maintenanceTickets.id, id)).limit(1)
  )[0];
  if (!ticket) notFound();

  const booking = ticket.bookingId
    ? (await db.select().from(bookings).where(eq(bookings.id, ticket.bookingId)).limit(1))[0]
    : null;

  return (
    <div className="px-8 py-10 max-w-[900px]">
      <Link
        href="/m/wartung"
        className="text-sm text-[var(--color-wh-deep-green)] hover:underline mb-4 inline-block"
      >
        ← Zurück zur Liste
      </Link>
      <div className="eyebrow">Manager · Wartung</div>
      <h1 className="text-[32px] mt-2 mb-1">{ticket.title}</h1>
      <p className="text-[12px] text-[var(--color-wh-fg-muted)] mb-8">
        Angelegt am{" "}
        {ticket.createdAt.toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {ticket.createdBy && ` von ${ticket.createdBy}`}
        {ticket.resolvedAt && (
          <>
            {" · Erledigt am "}
            {ticket.resolvedAt.toLocaleString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </>
        )}
      </p>

      <form
        action={async (fd) => {
          "use server";
          await updateTicket(fd);
        }}
        encType="multipart/form-data"
        className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 space-y-4"
      >
        <input type="hidden" name="id" value={ticket.id} />
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Titel
          </label>
          <input
            type="text"
            name="title"
            defaultValue={ticket.title}
            required
            className={`${inputBase} w-full`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Status
            </label>
            <select name="status" defaultValue={ticket.status} className={`${inputBase} w-full`}>
              <option value="open">Offen</option>
              <option value="in_progress">In Arbeit</option>
              <option value="resolved">Erledigt</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Schweregrad
            </label>
            <select
              name="severity"
              defaultValue={ticket.severity}
              className={`${inputBase} w-full`}
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="urgent">Dringend</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Ort
            </label>
            <input
              type="text"
              name="location"
              defaultValue={ticket.location ?? ""}
              className={`${inputBase} w-full`}
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Beschreibung
          </label>
          <textarea
            name="description"
            defaultValue={ticket.description ?? ""}
            rows={4}
            className={`${inputBase} w-full`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Zugewiesen an (E-Mail oder Name)
          </label>
          <input
            type="text"
            name="assignedTo"
            defaultValue={ticket.assignedTo ?? ""}
            placeholder="z.B. hausmeister@…"
            className={`${inputBase} w-full max-w-md`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Auflösungs-Notiz (Pflicht beim Schliessen)
          </label>
          <textarea
            name="resolutionNote"
            defaultValue={ticket.resolutionNote ?? ""}
            rows={3}
            placeholder="Wie wurde es gelöst? Welche Teile/Tools verwendet?"
            className={`${inputBase} w-full`}
          />
        </div>
        {ticket.photoUrls.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
              Bestehende Photos
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ticket.photoUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded overflow-hidden bg-[var(--color-wh-beige)]"
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                </a>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Weitere Photos hinzufügen (optional)
          </label>
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="text-sm w-full"
          />
        </div>
        {booking && (
          <p className="text-[12px] text-[var(--color-wh-fg-muted)]">
            Verknüpft mit Buchung{" "}
            <Link
              href={`/m/buchungen/${booking.id}`}
              className="font-mono hover:underline"
            >
              {booking.bookingNumber}
            </Link>
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-wh-winter-grey)]/40">
          <button
            type="submit"
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2 text-sm font-semibold"
          >
            Speichern
          </button>
        </div>
      </form>

      <form
        action={async (fd) => {
          "use server";
          await deleteTicket(fd);
          redirect("/m/wartung");
        }}
        className="mt-6"
      >
        <input type="hidden" name="id" value={ticket.id} />
        <button
          type="submit"
          className="rounded-full border border-red-300 text-red-700 px-4 py-1.5 text-xs hover:bg-red-50"
        >
          Ticket löschen
        </button>
      </form>
    </div>
  );
}
