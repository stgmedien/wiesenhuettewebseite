import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, customers, membershipTiers } from "@/lib/db/schema";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil · Wiesenhütte" };

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const customerRow = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  const u = userRow[0];
  if (!u) redirect("/login");
  const c = customerRow[0] ?? null;

  // Aktive Beitrags-Tarife mit hinterlegter Stripe Price-ID — diese können
  // automatisch via Stripe-Abo abgerechnet werden. Tiers ohne Price-ID
  // erscheinen nicht in der Auswahl.
  const subscribableTiersRaw = await db
    .select({
      code: membershipTiers.code,
      name: membershipTiers.name,
      annualFeeCents: membershipTiers.annualFeeCents,
    })
    .from(membershipTiers)
    .where(and(eq(membershipTiers.active, true), isNotNull(membershipTiers.stripePriceId)))
    .orderBy(asc(membershipTiers.sortOrder));

  return (
    <div className="container max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/konto"
        className="text-sm text-[var(--color-wh-deep-green)] hover:underline mb-4 inline-block"
      >
        ← Zurück zum Konto
      </Link>
      <h1 className="font-heading text-3xl text-[var(--color-wh-deep-green)] mb-6">
        Mein Profil
      </h1>
      <ProfileClient
        user={{ email: u.email, hasPassword: !!u.passwordHash }}
        customer={
          c
            ? {
                firstName: c.firstName,
                lastName: c.lastName,
                phone: c.phone,
                birthDate: c.birthDate,
                emailOptOut: c.emailOptOut,
                street: c.street,
                zip: c.zip,
                city: c.city,
                country: c.country,
                membershipStatus: c.membershipStatus as
                  | "none"
                  | "pending"
                  | "verified"
                  | "rejected",
                membershipRejectedReason: c.membershipRejectedReason,
                memberId: c.memberId,
                membershipTierCode: c.membershipTierCode,
                stripeSubscriptionId: c.stripeSubscriptionId,
                stripeSubscriptionCustomerId: c.stripeSubscriptionCustomerId,
                subscriptionStatus: c.subscriptionStatus,
                subscriptionCurrentPeriodEnd: c.subscriptionCurrentPeriodEnd
                  ? c.subscriptionCurrentPeriodEnd.toISOString()
                  : null,
              }
            : null
        }
        subscribableTiers={subscribableTiersRaw}
      />
    </div>
  );
}
