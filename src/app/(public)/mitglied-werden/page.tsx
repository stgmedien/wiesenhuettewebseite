import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, membershipTiers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n";
import { JoinWizard } from "./JoinWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mitglied werden · Wiesenhütte",
  description:
    "Werde online Mitglied der Skifreunde Gütersloh — ab 15 € im Jahr. Sofort aktiv, sofort Mitgliederpreise an der Wiesenhütte.",
};

export default async function MitgliedWerdenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; next?: string }>;
}) {
  const { status, next } = await searchParams;
  const locale = await getServerLocale();

  const tiers = await db
    .select({
      code: membershipTiers.code,
      name: membershipTiers.name,
      annualFeeCents: membershipTiers.annualFeeCents,
    })
    .from(membershipTiers)
    .where(eq(membershipTiers.active, true))
    .orderBy(asc(membershipTiers.sortOrder));

  // Eingeloggte Nutzer: Daten vorbefüllen + Mitglieds-Status erkennen.
  const session = await auth();
  let prefill: {
    loggedIn: boolean;
    firstName: string;
    lastName: string;
    email: string;
    alreadyVerified: boolean;
    pendingClaim: boolean;
  } = {
    loggedIn: false,
    firstName: "",
    lastName: "",
    email: "",
    alreadyVerified: false,
    pendingClaim: false,
  };

  if (session?.user?.email) {
    const rows = await db
      .select({
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        membershipStatus: customers.membershipStatus,
      })
      .from(customers)
      .where(eq(customers.email, session.user.email.toLowerCase()))
      .limit(1);
    const c = rows[0];
    prefill = {
      loggedIn: true,
      firstName: c?.firstName ?? "",
      lastName: c?.lastName ?? "",
      email: session.user.email.toLowerCase(),
      alreadyVerified: c?.membershipStatus === "verified",
      pendingClaim: c?.membershipStatus === "pending",
    };
  }

  return (
    <JoinWizard
      locale={locale}
      tiers={tiers}
      prefill={prefill}
      status={status ?? null}
      next={next && next.startsWith("/") && !next.startsWith("//") ? next : null}
    />
  );
}
