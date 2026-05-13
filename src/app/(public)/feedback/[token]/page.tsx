import { db } from "@/lib/db";
import { feedbackEntries, bookings, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashFeedbackToken } from "@/lib/feedback";
import { FeedbackClient } from "./FeedbackClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dein Feedback · Wiesenhütte",
  description: "Erzähl uns, wie Dein Aufenthalt in der Wiesenhütte war.",
  // Suchmaschinen ausschließen — das ist keine indexierbare Seite
  robots: { index: false, follow: false },
};

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = hashFeedbackToken(token);

  const rows = await db
    .select({
      id: feedbackEntries.id,
      bookingId: feedbackEntries.bookingId,
      expiresAt: feedbackEntries.expiresAt,
      respondedAt: feedbackEntries.respondedAt,
    })
    .from(feedbackEntries)
    .where(eq(feedbackEntries.tokenHash, tokenHash))
    .limit(1);
  const entry = rows[0];

  return (
    <div className="bg-[var(--color-wh-beige)] min-h-[100vh]">
      <section className="px-6 sm:px-8 py-10 sm:py-16">
        <div className="max-w-[680px] mx-auto">
          {!entry && <InvalidLink reason="not-found" />}
          {entry && entry.expiresAt.getTime() < Date.now() && <InvalidLink reason="expired" />}
          {entry && entry.respondedAt && <InvalidLink reason="already-done" />}
          {entry && !entry.respondedAt && entry.expiresAt.getTime() >= Date.now() && (
            <FeedbackForm token={token} bookingId={entry.bookingId} />
          )}
        </div>
      </section>
    </div>
  );
}

async function FeedbackForm({ token, bookingId }: { token: string; bookingId: string }) {
  // Buchungs-Kontext laden für Header („vom DATUM bis DATUM")
  const rows = await db
    .select({
      bookingNumber: bookings.bookingNumber,
      arrival: bookings.arrival,
      departure: bookings.departure,
      customerId: bookings.customerId,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const booking = rows[0];
  if (!booking) {
    return <InvalidLink reason="not-found" />;
  }

  let guestName = "";
  if (booking.customerId) {
    const cr = await db
      .select({ firstName: customers.firstName, lastName: customers.lastName })
      .from(customers)
      .where(eq(customers.id, booking.customerId))
      .limit(1);
    if (cr[0]) {
      guestName = `${cr[0].firstName} ${cr[0].lastName}`.trim();
    }
  }

  return (
    <FeedbackClient
      token={token}
      guestName={guestName}
      bookingNumber={booking.bookingNumber}
      arrival={booking.arrival}
      departure={booking.departure}
    />
  );
}

function InvalidLink({ reason }: { reason: "not-found" | "expired" | "already-done" }) {
  const config: Record<typeof reason, { emoji: string; title: string; body: string }> = {
    "not-found": {
      emoji: "🤔",
      title: "Link unbekannt",
      body:
        "Wir können diesen Feedback-Link nicht zuordnen. Vielleicht ist er ein bisschen falsch kopiert? Wenn Du sicher bist, dass Du bei uns warst und Feedback geben wolltest, melde Dich gerne direkt — wir hören gerne zu.",
    },
    expired: {
      emoji: "⌛",
      title: "Link ist abgelaufen",
      body:
        "Schade — wir hätten Dein Feedback gerne gehört. Wenn Du noch etwas teilen möchtest, schreib uns einfach eine kurze Mail.",
    },
    "already-done": {
      emoji: "✨",
      title: "Du hast schon Feedback gegeben",
      body:
        "Vielen Dank dafür! Pro Aufenthalt nehmen wir nur einmal Feedback an, damit unsere Auswertung sauber bleibt. Wenn Du noch etwas Wichtiges ergänzen möchtest, schreib uns gerne direkt.",
    },
  };
  const c = config[reason];

  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[28px] p-8 sm:p-12 text-center shadow-[0_8px_30px_rgba(47,74,53,0.08)]">
      <div className="text-[64px] mb-4">{c.emoji}</div>
      <h1 className="font-display font-bold text-[28px] sm:text-[36px] text-[var(--color-wh-deep-green)] m-0 mb-4">
        {c.title}
      </h1>
      <p className="text-[16px] text-[var(--color-wh-black)] leading-relaxed max-w-xl mx-auto m-0">
        {c.body}
      </p>
      <a
        href="/kontakt"
        className="inline-block mt-6 rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold no-underline"
      >
        Kontakt aufnehmen
      </a>
    </div>
  );
}
