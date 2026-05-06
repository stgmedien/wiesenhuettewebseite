import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { customers, bookings, discountCodes } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import Link from "next/link";
import { WeatherWidget } from "@/components/public/WeatherWidget";

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

  // Customer-Datensatz suchen
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

  // Aktive Loyalty-Codes (noch nicht eingeloest)
  const myLoyaltyCodes = customer
    ? await db
        .select()
        .from(discountCodes)
        .where(and(eq(discountCodes.customerId, customer.id), eq(discountCodes.active, true)))
    : [];
  const unusedCodes = myLoyaltyCodes.filter(
    (c) => c.redemptions < c.maxRedemptions
  );

  const membershipBadge = customer ? membershipBadgeFor(customer.membershipStatus) : null;

  return (
    <div className="container max-w-5xl mx-auto px-6 py-12">
      {welcome && (
        <div className="mb-6 rounded-2xl bg-[var(--color-wh-cream)] border-l-4 border-[var(--color-wh-forest)] p-5">
          <p className="font-semibold text-[var(--color-wh-forest)]">Willkommen!</p>
          <p className="text-sm text-[var(--color-wh-charcoal)] mt-1">
            Du bist eingeloggt. Hier siehst Du alle Deine Buchungen, Anfragen und das aktuelle
            Wetter im Hochsauerland.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow text-[var(--color-wh-forest)] uppercase tracking-wider text-xs font-semibold">
                Mein Konto
              </p>
              <h1 className="font-heading text-4xl text-[var(--color-wh-forest)]">
                {customer ? `Hallo ${customer.firstName}.` : "Hallo."}
              </h1>
              <p className="text-sm text-[var(--color-wh-charcoal)]/70 mt-1">{email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {membershipBadge}
                {customer && customer.completedStays > 0 && (
                  <LoyaltyBadge stays={customer.completedStays} tier={customer.loyaltyTier} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/konto/profil"
                className="text-[var(--color-wh-forest)] underline hover:opacity-70"
              >
                Profil
              </Link>
              <Link
                href="/konto/anfragen"
                className="text-[var(--color-wh-forest)] underline hover:opacity-70"
              >
                Anfragen
              </Link>
              <a
                href="/api/account/export"
                className="text-[var(--color-wh-forest)] underline hover:opacity-70"
                title="Alle Deine Daten als ZIP exportieren (DSGVO)"
              >
                Daten-Export
              </a>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-[var(--color-wh-forest)] underline hover:opacity-70"
                >
                  Abmelden
                </button>
              </form>
            </div>
          </div>

          {unusedCodes.length > 0 && (
            <section className="mb-6 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 p-5">
              <p className="text-xs uppercase tracking-wider text-amber-800 font-bold mb-2">
                🎁 Treue-Rabatt verfügbar
              </p>
              <ul className="space-y-2">
                {unusedCodes.map((c) => (
                  <li key={c.id}>
                    <p className="font-mono text-lg text-amber-900 font-bold">{c.code}</p>
                    <p className="text-sm text-amber-800">
                      {c.percentOff > 0 && `${c.percentOff}% Rabatt`}
                      {c.fixedOffCents > 0 && ` · ${formatEuro(c.fixedOffCents)} Rabatt`}
                      {c.issuedReason && ` · ${c.issuedReason}`}
                      {c.validUntil &&
                        ` · gültig bis ${new Date(c.validUntil).toLocaleDateString("de-DE")}`}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 mt-2">
                Code beim nächsten Buchen anwenden.
              </p>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-[var(--color-wh-forest)]">
              Deine Buchungen
            </h2>
            {myBookings.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[var(--color-wh-stone)]/50 p-6 text-sm text-[var(--color-wh-charcoal)]/70">
                Noch keine Buchungen.{" "}
                <Link
                  href="/buchen"
                  className="text-[var(--color-wh-forest)] underline font-medium"
                >
                  Jetzt buchen →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {myBookings.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/konto/buchungen/${b.id}`}
                      className="block rounded-2xl bg-white border border-[var(--color-wh-stone)]/50 p-5 no-underline hover:border-[var(--color-wh-forest)] transition"
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
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <WeatherWidget />
          <div className="rounded-2xl bg-white border border-[var(--color-wh-stone)]/50 p-5">
            <p className="font-heading text-lg text-[var(--color-wh-forest)] mb-2">
              Schnell-Aktionen
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/buchen" className="text-[var(--color-wh-forest)] underline">
                  Neue Buchung anlegen
                </Link>
              </li>
              <li>
                <Link href="/konto/anfragen" className="text-[var(--color-wh-forest)] underline">
                  Meine Anfragen
                </Link>
              </li>
              <li>
                <Link href="/konto/profil" className="text-[var(--color-wh-forest)] underline">
                  Profil bearbeiten
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-[var(--color-wh-forest)] underline">
                  Wirt kontaktieren
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LoyaltyBadge({ stays, tier }: { stays: number; tier: number }) {
  const label =
    tier >= 2
      ? "🏆 Treuer Stammgast"
      : tier >= 1
        ? "⭐ Stammgast"
        : `${stays} Aufenthalt${stays === 1 ? "" : "e"}`;
  const cls =
    tier >= 2
      ? "bg-amber-50 border-amber-300 text-amber-900"
      : tier >= 1
        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
        : "bg-[var(--color-wh-cream)] border-[var(--color-wh-stone)]/40 text-[var(--color-wh-charcoal)]";
  return (
    <span className={`px-3 py-1 rounded-full border text-xs font-medium ${cls}`}>{label}</span>
  );
}

function membershipBadgeFor(status: string) {
  if (status === "verified") {
    return (
      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
        ✓ Mitgliedschaft bestätigt
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
        Mitgliedschaft wird geprüft
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
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
