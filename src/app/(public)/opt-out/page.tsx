import { db } from "@/lib/db";
import { customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyOptOutToken } from "@/lib/bulk-mail-audience";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Abmelden · Wiesenhütte",
  robots: { index: false, follow: false },
};

export default async function OptOutPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string }>;
}) {
  const { id, t } = await searchParams;
  if (!id || !t) {
    return <InvalidLink reason="invalid" />;
  }
  if (!verifyOptOutToken(id, t)) {
    return <InvalidLink reason="invalid" />;
  }

  const customer = (
    await db.select().from(customers).where(eq(customers.id, id)).limit(1)
  )[0];
  if (!customer) {
    return <InvalidLink reason="invalid" />;
  }

  // Idempotent: setze emailOptOut auf true
  const wasAlreadyOptedOut = customer.emailOptOut;
  if (!wasAlreadyOptedOut) {
    await db.update(customers).set({ emailOptOut: true }).where(eq(customers.id, id));
    await db.insert(activityLog).values({
      who: customer.email,
      what: "Newsletter-Abmeldung via Opt-Out-Link",
    });
  }

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[600px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <div className="text-[48px] mb-4">✓</div>
        <h1 className="text-[28px] sm:text-[32px] font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-3">
          {wasAlreadyOptedOut ? "Du bist bereits abgemeldet" : "Erfolgreich abgemeldet"}
        </h1>
        <p className="text-[15px] text-[var(--color-wh-fg-muted)] m-0">
          Wir schicken Dir keine Newsletter mehr. Buchungsbestätigungen, Anreise-Infos und
          ähnliche transaktionale Mails kommen weiterhin — die sind nicht abbestellbar.
        </p>
        <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0 mt-4">
          Falls Du Dich umentscheidest, kannst Du die Einstellung in Deinem{" "}
          <a href="/konto/profil" className="text-[var(--color-wh-deep-green)] underline">
            Konto-Profil
          </a>{" "}
          jederzeit wieder aktivieren.
        </p>
      </div>
    </div>
  );
}

function InvalidLink({ reason }: { reason: "invalid" }) {
  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[600px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <div className="text-[48px] mb-4">🤔</div>
        <h1 className="text-[28px] sm:text-[32px] font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-3">
          Abmelde-Link ungültig
        </h1>
        <p className="text-[15px] text-[var(--color-wh-fg-muted)] m-0">
          Wir können diesen Link nicht zuordnen. Falls Du Dich vom Newsletter abmelden willst,
          melde Dich gerne direkt bei uns.
        </p>
      </div>
    </div>
  );
}
