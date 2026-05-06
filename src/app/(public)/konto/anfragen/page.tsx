import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { inquiries, customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { formatDateLong } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anfragen · Wiesenhütte" };

export default async function AnfragenPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id?: string }).id;
  const email = session.user.email!.toLowerCase();

  // Customer-Record suchen (per userId oder Email-Match)
  const customerRow = userId
    ? await db.select().from(customers).where(eq(customers.userId, userId)).limit(1)
    : [];
  const customer = customerRow[0];

  const myInquiries = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.email, customer?.email ?? email))
    .orderBy(desc(inquiries.createdAt))
    .limit(50);

  return (
    <div className="container max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/konto"
        className="text-sm text-[var(--color-wh-deep-green)] hover:underline mb-4 inline-block"
      >
        ← Zurück zum Konto
      </Link>
      <h1 className="font-heading text-3xl text-[var(--color-wh-deep-green)] mb-2">
        Meine Anfragen
      </h1>
      <p className="text-sm text-[var(--color-wh-black)]/70 mb-8">
        Hier siehst Du alle Anfragen, die Du an die Wiesenhütte gestellt hast — auch wenn sie noch
        nicht zu einer Buchung geworden sind.
      </p>

      {myInquiries.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-8 text-center text-sm text-[var(--color-wh-black)]/70">
          Du hast noch keine Anfragen gestellt. Direkte Buchungen findest Du im{" "}
          <Link href="/konto" className="text-[var(--color-wh-deep-green)] underline">
            Konto
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {myInquiries.map((i) => (
            <li
              key={i.id}
              className="rounded-2xl bg-white border border-[var(--color-wh-winter-grey)]/40 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-mono text-[var(--color-wh-black)]/60">
                    {i.inquiryNumber}
                  </p>
                  <p className="font-heading text-lg text-[var(--color-wh-deep-green)] mt-1">
                    {i.arrival && i.departure
                      ? `${formatDateLong(i.arrival)} – ${formatDateLong(i.departure)}`
                      : "Datum noch offen"}
                  </p>
                  {i.persons && (
                    <p className="text-sm text-[var(--color-wh-black)]/80">
                      ca. {i.persons} Personen
                      {i.purpose && ` · ${i.purpose}`}
                    </p>
                  )}
                  {i.message && (
                    <p className="text-sm text-[var(--color-wh-black)]/70 mt-2 italic">
                      &ldquo;{i.message.slice(0, 180)}
                      {i.message.length > 180 ? "…" : ""}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-wh-black)]/50 mt-3">
                    Eingereicht am {formatDateLong(i.createdAt)}
                    {i.repliedAt && ` · beantwortet am ${formatDateLong(i.repliedAt)}`}
                  </p>
                </div>
                <span className={inquiryStatusPill(i.status)}>
                  {inquiryStatusLabel(i.status)}
                </span>
              </div>
              {i.convertedToBookingId && (
                <Link
                  href={`/konto/buchungen/${i.convertedToBookingId}`}
                  className="inline-block mt-3 text-sm text-[var(--color-wh-deep-green)] underline"
                >
                  → Zur Buchung
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function inquiryStatusLabel(s: string): string {
  return (
    {
      new: "Neu",
      in_progress: "In Bearbeitung",
      replied: "Beantwortet",
      converted: "Buchung",
      rejected: "Abgesagt",
    }[s] ?? s
  );
}

function inquiryStatusPill(status: string): string {
  const base = "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap";
  if (status === "converted") return `${base} bg-emerald-50 border border-emerald-200 text-emerald-800`;
  if (status === "replied") return `${base} bg-blue-50 border border-blue-200 text-blue-800`;
  if (status === "rejected") return `${base} bg-red-50 border border-red-200 text-red-800`;
  return `${base} bg-amber-50 border border-amber-200 text-amber-800`;
}
