import { db } from "@/lib/db";
import { bookings, customers, payments, notes, mailTemplates } from "@/lib/db/schema";
import { eq, desc, and, isNotNull, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import { StatusPill } from "@/components/manager/StatusPill";
import { StatusActions } from "./StatusActions";
import { ManagerMessage } from "./ManagerMessage";
import { DepositHoldControl } from "./DepositHoldControl";
import { Kundenakte } from "./Kundenakte";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function BookingDetail({ params }: Props) {
  const { id } = await params;
  const found = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  const b = found[0];
  if (!b) notFound();

  const customer = b.customerId
    ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
    : null;

  const pmts = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, id))
    .orderBy(desc(payments.createdAt));

  const bookingNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.scope, "booking"), eq(notes.refId, id)))
    .orderBy(desc(notes.createdAt));

  // Verfuegbare Mail-Templates fuer den ManagerMessage-Picker (nur die mit aktiver Version)
  const availableTemplates = await db
    .select({
      id: mailTemplates.id,
      key: mailTemplates.key,
      name: mailTemplates.name,
    })
    .from(mailTemplates)
    .where(isNotNull(mailTemplates.activeVersionId))
    .orderBy(asc(mailTemplates.name));

  return (
    <div className="px-8 py-10 max-w-[1200px]">
      <Link
        href="/m/buchungen"
        className="text-sm text-[var(--color-wh-fg-muted)] no-underline"
      >
        ← Zurück zur Liste
      </Link>
      <div className="flex items-start justify-between gap-4 mt-3">
        <div>
          <div className="eyebrow">Buchung</div>
          <h1 className="text-[40px] mt-2 mb-1">{b.bookingNumber}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusPill status={b.status} />
            <span className="text-[var(--color-wh-fg-muted)]">
              {formatDateLong(b.arrival)} → {formatDateLong(b.departure)} · {b.nights} Nächte
            </span>
          </div>
        </div>
        <StatusActions bookingId={b.id} currentStatus={b.status} />
      </div>

      {customer && (
        <ManagerMessage
          bookingId={b.id}
          guestEmail={customer.email}
          guestName={`${customer.firstName} ${customer.lastName}`.trim()}
          bookingNumber={b.bookingNumber}
          templates={availableTemplates}
        />
      )}

      {/* Übergabeprotokoll-Buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Link
          href={`/m/buchungen/${b.id}/uebergabe/checkin`}
          className="rounded-full border-2 border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2 text-sm font-semibold no-underline hover:bg-[var(--color-wh-deep-green)] hover:text-white transition"
        >
          📋 Anreise-Übergabe
        </Link>
        <Link
          href={`/m/buchungen/${b.id}/uebergabe/checkout`}
          className="rounded-full border-2 border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2 text-sm font-semibold no-underline hover:bg-[var(--color-wh-deep-green)] hover:text-white transition"
        >
          📋 Abreise-Übernahme
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-8">
        <div className="space-y-6">
          <Section title="Gast">
            {customer ? (
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <Dt>Name</Dt>
                <Dd>
                  {customer.firstName} {customer.lastName}
                </Dd>
                <Dt>E-Mail</Dt>
                <Dd>
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                </Dd>
                <Dt>Telefon</Dt>
                <Dd>{customer.phone ?? "—"}</Dd>
                <Dt>Typ</Dt>
                <Dd className="capitalize">{customer.type}</Dd>
                {customer.company && (
                  <>
                    <Dt>Firma / Verein</Dt>
                    <Dd>{customer.company}</Dd>
                  </>
                )}
                <Dt>Adresse</Dt>
                <Dd>
                  {[customer.street, customer.zip + " " + (customer.city ?? "")].filter(Boolean).join(", ")}
                </Dd>
              </dl>
            ) : (
              <div className="text-[var(--color-wh-fg-muted)]">Kein Kundendatensatz</div>
            )}
          </Section>

          <Section title="Aufenthalt">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <Dt>Anlass</Dt>
              <Dd>{b.purpose ?? "—"}</Dd>
              <Dt>Personen</Dt>
              <Dd>
                {b.persons} (
                {[
                  b.adults && `${b.adults} Erw.`,
                  b.members && `${b.members} Mitgl.`,
                  b.children && `${b.children} Kinder`,
                  b.pupils && `${b.pupils} Schüler`,
                  b.teachers && `${b.teachers} Lehrer`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                )
              </Dd>
              <Dt>Endreinigung</Dt>
              <Dd>{b.cleaningOptedIn ? "Ja" : "Nein"}</Dd>
              <Dt>Allein-Nutzung</Dt>
              <Dd>{b.soloUse ? "Ja" : "Nein"}</Dd>
              <Dt>Quelle</Dt>
              <Dd>{b.source}</Dd>
              {b.customerMessage && (
                <>
                  <Dt>Nachricht</Dt>
                  <Dd>{b.customerMessage}</Dd>
                </>
              )}
            </dl>
          </Section>

          <Section title="Zahlungen">
            {pmts.length === 0 ? (
              <div className="text-[var(--color-wh-fg-muted)] text-sm">Noch keine Zahlung erfasst.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                  <tr>
                    <th className="py-2">Datum</th>
                    <th>Art</th>
                    <th>Methode</th>
                    <th>Status</th>
                    <th className="text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {pmts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-[var(--color-wh-winter-grey)]"
                    >
                      <td className="py-2">
                        {p.receivedAt
                          ? new Date(p.receivedAt).toLocaleString("de-DE")
                          : new Date(p.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td className="capitalize">{p.kind}</td>
                      <td>{p.method ?? "—"}</td>
                      <td className="capitalize">{p.status}</td>
                      <td className="text-right font-semibold">{formatEuro(p.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>

        <aside>
          <Section title="Preisübersicht">
            <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
              <Dt>Übernachtung</Dt>
              <Dd className="text-right">{formatEuro(b.accommodationCents)}</Dd>
              <Dt>Energiepauschale</Dt>
              <Dd className="text-right">{formatEuro(b.energyFlatCents)}</Dd>
              <Dt>Endreinigung</Dt>
              <Dd className="text-right">{formatEuro(b.cleaningCents)}</Dd>
              {b.soloSurchargeCents > 0 && (
                <>
                  <Dt>Allein-Aufschlag</Dt>
                  <Dd className="text-right">{formatEuro(b.soloSurchargeCents)}</Dd>
                </>
              )}
              {b.kurtaxeCents > 0 && (
                <>
                  <Dt>Kurtaxe (Altbestand)</Dt>
                  <Dd className="text-right">{formatEuro(b.kurtaxeCents)}</Dd>
                </>
              )}
            </dl>
            <div className="border-t border-[var(--color-wh-winter-grey)] mt-3 pt-3 flex justify-between font-semibold">
              <span>Zwischensumme</span>
              <span>{formatEuro(b.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-wh-fg-muted)] mt-1">
              <span>+ Kaution</span>
              <span>{formatEuro(b.depositCents)}</span>
            </div>
            <div className="flex justify-between text-base mt-3 pt-3 border-t border-[var(--color-wh-winter-grey)] font-bold">
              <span>Gesamt</span>
              <span className="text-[var(--color-wh-deep-green)]">
                {formatEuro(b.subtotalCents + b.depositCents)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-3">
              <span>Bezahlt</span>
              <span
                className={
                  b.paidCents >= b.subtotalCents + b.depositCents
                    ? "text-[var(--color-wh-deep-green)] font-semibold"
                    : "text-[var(--color-wh-sunset)] font-semibold"
                }
              >
                {formatEuro(b.paidCents)}
              </span>
            </div>

            {b.depositCents > 0 && (
              <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4">
                <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                  Kaution-Auto-Refund
                </div>
                <p className="text-xs text-[var(--color-wh-fg-muted)] m-0 leading-relaxed">
                  Cron erstattet die {formatEuro(b.depositCents)} automatisch 14 Tage nach Abreise,
                  sofern Status &bdquo;abgereist&ldquo; und kein Hold gesetzt ist.
                </p>
                <DepositHoldControl
                  bookingId={b.id}
                  currentHold={b.depositHold}
                  reason={b.depositHoldReason}
                  heldBy={b.depositHoldBy}
                  heldAt={b.depositHoldAt}
                />
              </div>
            )}
          </Section>
        </aside>
      </div>

      <Kundenakte
        bookingId={b.id}
        customerId={customer?.id ?? null}
        customerTags={customer?.tags ?? []}
        notes={bookingNotes.map((n) => ({
          id: n.id,
          body: n.body,
          pinned: n.pinned,
          internal: n.internal,
          by: n.by,
          createdAt: n.createdAt,
          scope: n.scope,
        }))}
      />
    </div>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
    <h3 className="text-[20px] m-0 mb-4">{title}</h3>
    {children}
  </section>
);

const Dt = ({ children }: { children: React.ReactNode }) => (
  <dt className="text-[var(--color-wh-fg-muted)]">{children}</dt>
);
const Dd = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <dd className={`m-0 ${className}`}>{children}</dd>
);
