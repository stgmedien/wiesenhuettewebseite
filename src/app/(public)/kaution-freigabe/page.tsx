import { db } from "@/lib/db";
import { bookings, customers, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import {
  DEPOSIT_RELEASE_METHOD,
  depositReturnReference,
  verifyDepositReleaseToken,
} from "@/lib/deposit-release";
import { confirmDepositTransfer } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kaution zurücküberweisen · Wiesenhütte",
  robots: { index: false, follow: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KautionFreigabePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string }>;
}) {
  const { id, t } = await searchParams;
  if (!id || !t || !UUID_RE.test(id) || !verifyDepositReleaseToken(id, t)) {
    return (
      <Card icon="🤔" title="Dieser Link ist nicht gültig">
        Bitte den Link aus der Auftragsmail vollständig öffnen oder beim Hüttenteam nachfragen.
      </Card>
    );
  }

  const p = (await db.select().from(payments).where(eq(payments.id, id)).limit(1))[0];
  if (!p || p.kind !== "rueckerstattung") {
    return (
      <Card icon="↩️" title="Freigabe zurückgezogen">
        Diese Freigabe wurde im Buchungssystem zurückgezogen. Bitte <strong>nicht</strong>{" "}
        überweisen — das Hüttenteam meldet sich, falls es einen neuen Auftrag gibt.
      </Card>
    );
  }

  const b = (await db.select().from(bookings).where(eq(bookings.id, p.bookingId)).limit(1))[0];
  const c = b?.customerId
    ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
    : undefined;
  const guestName = c ? `${c.firstName} ${c.lastName}`.trim() : "—";

  const details = b && (
    <dl className="text-left text-[15px] grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 my-6">
      <dt className="text-[var(--color-wh-fg-muted)]">Betrag</dt>
      <dd className="m-0 font-semibold">{formatEuro(p.amountCents)}</dd>
      <dt className="text-[var(--color-wh-fg-muted)]">Empfänger</dt>
      <dd className="m-0">{guestName}</dd>
      <dt className="text-[var(--color-wh-fg-muted)]">Verwendungszweck</dt>
      <dd className="m-0">{depositReturnReference(b.bookingNumber)}</dd>
      <dt className="text-[var(--color-wh-fg-muted)]">Buchung</dt>
      <dd className="m-0">
        {b.bookingNumber} · {formatDateLong(b.arrival)} → {formatDateLong(b.departure)}
      </dd>
    </dl>
  );

  if (p.status === "erstattet") {
    return (
      <Card icon="✓" title="Überweisung bestätigt">
        Danke! Die Rückzahlung ist verbucht
        {p.receivedAt
          ? ` (${new Date(p.receivedAt).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })})`
          : ""}
        , der Gast ist informiert.
        {details}
      </Card>
    );
  }

  if (p.status !== "offen" || p.method !== DEPOSIT_RELEASE_METHOD) {
    return (
      <Card icon="🤔" title="Kein offener Auftrag">
        Zu diesem Link gibt es keinen offenen Auftrag mehr. Bitte beim Hüttenteam nachfragen.
      </Card>
    );
  }

  return (
    <Card icon="💶" title="Kaution zurücküberweisen">
      Die Kaution ist freigegeben. Bitte den Betrag auf das Konto überweisen, von dem die Zahlung
      des Gastes kam, und danach hier bestätigen.
      {details}
      <form action={confirmDepositTransfer}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="t" value={t} />
        <button
          type="submit"
          className="inline-flex items-center h-11 px-6 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-white text-[15px] font-semibold cursor-pointer hover:opacity-90"
        >
          Überweisung ist raus — bestätigen
        </button>
      </form>
      <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0 mt-4">
        Mit der Bestätigung bekommt der Gast die Mail, dass die Kaution unterwegs ist.
      </p>
    </Card>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-4 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[600px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-10 text-center">
        <div className="text-[48px] mb-4">{icon}</div>
        <h1 className="text-[28px] sm:text-[32px] font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-3">
          {title}
        </h1>
        <div className="text-[15px] text-[var(--color-wh-fg-muted)]">{children}</div>
      </div>
    </div>
  );
}
