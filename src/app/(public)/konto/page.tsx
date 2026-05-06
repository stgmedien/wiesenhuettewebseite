import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { customers, bookings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mein Konto · Wiesenhütte" };

type Props = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function KontoPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const welcome = !!sp.welcome;
  const userId = (session.user as { id?: string }).id;
  const email = session.user.email!;

  const role = (session.user as { role?: string }).role;
  if (role === "manager" || role === "admin") {
    redirect("/m/dashboard");
  }

  // Customer-Datensatz suchen — entweder via userId oder via E-Mail
  const customerRow = userId
    ? await db.select().from(customers).where(eq(customers.userId, userId)).limit(1)
    : await db.select().from(customers).where(eq(customers.email, email.toLowerCase())).limit(1);
  const customer = customerRow[0];

  const myBookings = customer
    ? await db
        .select()
        .from(bookings)
        .where(eq(bookings.customerId, customer.id))
        .orderBy(desc(bookings.arrival))
        .limit(20)
    : [];

  const membershipBadge = customer ? membershipBadgeFor(customer.membershipStatus) : null;

  return (
    <div className="container max-w-3xl mx-auto px-6 py-12">
      {welcome && (
        <div className="mb-6 rounded-2xl bg-[var(--color-wh-cream)] border-l-4 border-[var(--color-wh-forest)] p-5">
          <p className="font-semibold text-[var(--color-wh-forest)]">Willkommen!</p>
          <p className="text-sm text-[var(--color-wh-charcoal)] mt-1">
            Du bist eingeloggt. Hier siehst Du alle Deine Buchungen.
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="eyebrow text-[var(--color-wh-forest)] uppercase tracking-wider text-xs font-semibold">
            Mein Konto
          </p>
          <h1 className="font-heading text-4xl text-[var(--color-wh-forest)]">
            {customer ? `Hallo ${customer.firstName}.` : "Hallo."}
          </h1>
          <p className="text-sm text-[var(--color-wh-charcoal)]/70 mt-1">{email}</p>
          {membershipBadge}
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-[var(--color-wh-forest)] underline hover:opacity-70"
          >
            Abmelden
          </button>
        </form>
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl text-[var(--color-wh-forest)]">Deine Buchungen</h2>
        {myBookings.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[var(--color-wh-stone)]/50 p-6 text-sm text-[var(--color-wh-charcoal)]/70">
            Noch keine Buchungen.{" "}
            <a href="/buchen" className="text-[var(--color-wh-forest)] underline font-medium">
              Jetzt buchen →
            </a>
          </div>
        ) : (
          <ul className="space-y-3">
            {myBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl bg-white border border-[var(--color-wh-stone)]/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-wh-charcoal)]/60 font-mono">
                      {b.bookingNumber}
                    </p>
                    <p className="font-heading text-lg text-[var(--color-wh-forest)]">
                      {formatDateLong(b.arrival)} – {formatDateLong(b.departure)}
                    </p>
                    <p className="text-sm text-[var(--color-wh-charcoal)]/80">
                      {b.persons} Personen · {b.nights} Nächte
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={statusPill(b.status)}>{statusLabel(b.status)}</span>
                    <p className="text-sm font-mono text-[var(--color-wh-forest)] mt-2">
                      {formatEuro(b.totalCents)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function membershipBadgeFor(status: string) {
  if (status === "verified") {
    return (
      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
        ✓ Mitgliedschaft bestätigt
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
        Mitgliedschaft wird geprüft
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
        Mitgliedschaft abgelehnt
      </span>
    );
  }
  return null;
}

function statusLabel(status: string): string {
  return (
    {
      angefragt: "Angefragt",
      bestaetigt: "Bestätigt",
      bezahlt: "Bezahlt",
      angereist: "Angereist",
      abgereist: "Abgereist",
      storniert: "Storniert",
      wartung: "Wartung",
    }[status] ?? status
  );
}

function statusPill(status: string): string {
  const base = "px-3 py-1 rounded-full text-xs font-medium";
  if (status === "bezahlt" || status === "angereist" || status === "abgereist")
    return `${base} bg-emerald-50 border border-emerald-200 text-emerald-800`;
  if (status === "bestaetigt") return `${base} bg-blue-50 border border-blue-200 text-blue-800`;
  if (status === "storniert") return `${base} bg-red-50 border border-red-200 text-red-800`;
  return `${base} bg-amber-50 border border-amber-200 text-amber-800`;
}
