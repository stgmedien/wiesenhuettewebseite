import { db } from "@/lib/db";
import { feedbackEntries, bookings, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashFeedbackToken } from "@/lib/feedback";
import { FeedbackClient } from "./FeedbackClient";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

const INVALID_COPY: Record<Locale, {
  not_found: { title: string; body: string };
  expired: { title: string; body: string };
  already_done: { title: string; body: string };
  contact: string;
}> = {
  de: {
    not_found: { title: "Link unbekannt", body: "Wir können diesen Feedback-Link nicht zuordnen. Vielleicht ist er ein bisschen falsch kopiert? Wenn Du sicher bist, dass Du bei uns warst und Feedback geben wolltest, melde Dich gerne direkt — wir hören gerne zu." },
    expired: { title: "Link ist abgelaufen", body: "Schade — wir hätten Dein Feedback gerne gehört. Wenn Du noch etwas teilen möchtest, schreib uns einfach eine kurze Mail." },
    already_done: { title: "Du hast schon Feedback gegeben", body: "Vielen Dank dafür! Pro Aufenthalt nehmen wir nur einmal Feedback an, damit unsere Auswertung sauber bleibt. Wenn Du noch etwas Wichtiges ergänzen möchtest, schreib uns gerne direkt." },
    contact: "Kontakt aufnehmen",
  },
  en: {
    not_found: { title: "Link not recognised", body: "We can't match this feedback link to anything. Maybe it was copied incorrectly? If you're sure you stayed with us and wanted to give feedback, just get in touch — we'd love to hear it." },
    expired: { title: "Link has expired", body: "Sorry — we'd have loved to hear your feedback. If you'd still like to share something, just send us a short email." },
    already_done: { title: "You've already given feedback", body: "Thanks for that! We only accept feedback once per stay so our analysis stays clean. If you'd like to add something important, just write directly." },
    contact: "Get in touch",
  },
  nl: {
    not_found: { title: "Link onbekend", body: "We kunnen deze feedback-link niet plaatsen. Misschien is hij niet helemaal goed gekopieerd? Als je zeker weet dat je bij ons was en feedback wilde geven, meld je dan direct — we horen het graag." },
    expired: { title: "Link is verlopen", body: "Jammer — we hadden je feedback graag gehoord. Wil je toch nog iets delen, stuur ons gewoon een kort mailtje." },
    already_done: { title: "Je hebt al feedback gegeven", body: "Veel dank daarvoor! Per verblijf nemen we maar één keer feedback aan, zodat onze analyse zuiver blijft. Wil je iets belangrijks aanvullen, schrijf ons gewoon direct." },
    contact: "Contact opnemen",
  },
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dein Feedback · Wiesenhütte",
  description: "Erzähl uns, wie Dein Aufenthalt in der Wiesenhütte war.",
  // Suchmaschinen ausschließen — das ist keine indexierbare Seite
  robots: { index: false, follow: false },
};

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const locale = await getServerLocale();
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
          {!entry && <InvalidLink reason="not-found" locale={locale} />}
          {entry && entry.expiresAt.getTime() < Date.now() && <InvalidLink reason="expired" locale={locale} />}
          {entry && entry.respondedAt && <InvalidLink reason="already-done" locale={locale} />}
          {entry && !entry.respondedAt && entry.expiresAt.getTime() >= Date.now() && (
            <FeedbackForm token={token} bookingId={entry.bookingId} locale={locale} />
          )}
        </div>
      </section>
    </div>
  );
}

async function FeedbackForm({ token, bookingId, locale }: { token: string; bookingId: string; locale: Locale }) {
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
    return <InvalidLink reason="not-found" locale={locale} />;
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
      locale={locale}
    />
  );
}

function InvalidLink({ reason, locale }: { reason: "not-found" | "expired" | "already-done"; locale: Locale }) {
  const ic = INVALID_COPY[locale];
  const mapping = {
    "not-found": { emoji: "🤔", ...ic.not_found },
    expired: { emoji: "⌛", ...ic.expired },
    "already-done": { emoji: "✨", ...ic.already_done },
  } as const;
  const c = mapping[reason];

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
        {ic.contact}
      </a>
    </div>
  );
}
