import Link from "next/link";
import { PartyPopper, Check, CalendarCheck, Dumbbell, Mail } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const dynamic = "force-dynamic";

export const metadata = { title: "Willkommen im Verein · Wiesenhütte" };

const COPY: Record<Locale, {
  okEyebrow: string;
  okH: string;
  okLead: string;
  nextTitle: string;
  next1t: string;
  next1b: string;
  next2t: string;
  next2b: string;
  next3t: string;
  next3b: string;
  ctaBook: string;
  ctaBack: string;
  pendingH: string;
  pendingBody: string;
}> = {
  de: {
    okEyebrow: "Skifreunde Gütersloh e.V.",
    okH: "Willkommen im Verein!",
    okLead:
      "Das war's schon — Du bist jetzt Mitglied der Skifreunde Gütersloh. Deine Mitgliedschaft ist sofort aktiv, und Du bist ab jetzt Teil von etwas, das seit 1956 wächst.",
    nextTitle: "So geht's weiter",
    next1t: "Bestätigung per Mail",
    next1b: "Deine Willkommensmail mit allen Details ist unterwegs.",
    next2t: "Mitgliederpreise aktiv",
    next2b: "50 % auf Übernachtungen — gilt ab sofort bei jeder Buchung mit Deiner E-Mail-Adresse.",
    next3t: "Skigymnastik & Vereinsleben",
    next3b: "Dienstags 18:30, donnerstags 20:00 — komm einfach vorbei. Die nächsten Events findest Du auf der Vereinsseite.",
    ctaBook: "Jetzt mit Mitgliederpreisen buchen",
    ctaBack: "Zur Vereinsseite",
    pendingH: "Fast geschafft!",
    pendingBody:
      "Deine Zahlung wird gerade verarbeitet. Sobald sie bestätigt ist, schalten wir Deine Mitgliedschaft automatisch frei und Du bekommst eine Willkommensmail — meist dauert das nur wenige Minuten.",
  },
  en: {
    okEyebrow: "Skifreunde Gütersloh e.V.",
    okH: "Welcome to the club!",
    okLead:
      "That's it — you're now a member of the Skifreunde Gütersloh. Your membership is active immediately, and you're part of something that has been growing since 1956.",
    nextTitle: "What happens next",
    next1t: "Confirmation by email",
    next1b: "Your welcome email with all the details is on its way.",
    next2t: "Member rates active",
    next2b: "50% off overnight stays — applies right away to every booking with your email address.",
    next3t: "Ski gymnastics & club life",
    next3b: "Tuesdays 6:30 pm, Thursdays 8 pm — just drop by. You'll find upcoming events on the club page.",
    ctaBook: "Book at member rates now",
    ctaBack: "To the club page",
    pendingH: "Almost there!",
    pendingBody:
      "Your payment is being processed. As soon as it's confirmed, we'll activate your membership automatically and send you a welcome email — this usually takes just a few minutes.",
  },
  nl: {
    okEyebrow: "Skifreunde Gütersloh e.V.",
    okH: "Welkom bij de vereniging!",
    okLead:
      "Dat was het al — je bent nu lid van de Skifreunde Gütersloh. Je lidmaatschap is meteen actief, en je bent vanaf nu deel van iets dat sinds 1956 groeit.",
    nextTitle: "Zo gaat het verder",
    next1t: "Bevestiging per mail",
    next1b: "Je welkomstmail met alle details is onderweg.",
    next2t: "Ledentarieven actief",
    next2b: "50% op overnachtingen — geldt per direct bij elke boeking met jouw e-mailadres.",
    next3t: "Skigymnastiek & verenigingsleven",
    next3b: "Dinsdag 18:30, donderdag 20:00 — kom gewoon langs. De komende evenementen vind je op de verenigingspagina.",
    ctaBook: "Nu boeken tegen ledentarieven",
    ctaBack: "Naar de verenigingspagina",
    pendingH: "Bijna klaar!",
    pendingBody:
      "Je betaling wordt verwerkt. Zodra die bevestigd is, activeren we je lidmaatschap automatisch en krijg je een welkomstmail — meestal duurt dat maar een paar minuten.",
  },
};

export default async function MitgliedDankePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; next?: string }>;
}) {
  const { session_id, next } = await searchParams;
  const locale = await getServerLocale();
  const c = COPY[locale];
  const bookHref = next && next.startsWith("/") && !next.startsWith("//") ? next : "/buchen";

  // Session serverseitig prüfen — ehrlicher Zustand statt blindem Jubel.
  let paid = false;
  let firstName: string | null = null;
  if (session_id && /^cs_[a-zA-Z0-9_]+$/.test(session_id)) {
    try {
      const s = await stripe.checkout.sessions.retrieve(session_id);
      paid =
        s.metadata?.kind === "membership-signup" &&
        (s.payment_status === "paid" || s.status === "complete");
      firstName = s.customer_details?.name?.split(" ")[0] ?? null;
    } catch (e) {
      console.error("[mitglied-werden/danke] session retrieve failed", e);
    }
  }

  return (
    <div className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-28 min-h-[70vh]">
      <div className="max-w-[760px] mx-auto text-center">
        <PartyPopper size={64} className="mx-auto text-[var(--color-wh-sunset)]" aria-hidden />
        <div className="text-xs uppercase tracking-[0.16em] font-semibold opacity-85 mt-6">
          {c.okEyebrow}
        </div>
        <h1 className="text-[40px] sm:text-[56px] leading-[1.02] mt-3 mb-5 text-[var(--color-wh-snow)]">
          {paid && firstName ? `${c.okH.replace("!", "")}, ${firstName}!` : paid ? c.okH : c.pendingH}
        </h1>
        <p className="text-base sm:text-[18px] leading-relaxed opacity-90 max-w-xl mx-auto m-0">
          {paid ? c.okLead : c.pendingBody}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 text-left">
          {[
            { Icon: Mail, t: c.next1t, b: c.next1b },
            { Icon: Check, t: c.next2t, b: c.next2b },
            { Icon: Dumbbell, t: c.next3t, b: c.next3b },
          ].map(({ Icon, t, b }) => (
            <div key={t} className="bg-white/8 border border-white/15 rounded-[var(--radius-card)] p-5">
              <Icon size={22} className="text-[var(--color-wh-sunset)]" aria-hidden />
              <div className="font-semibold text-sm mt-3">{t}</div>
              <div className="text-[13px] leading-relaxed opacity-80 mt-1">{b}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          <Link
            href={bookHref}
            className="inline-flex h-12 px-7 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] no-underline font-semibold hover:bg-white transition-colors"
          >
            <CalendarCheck size={17} aria-hidden />
            {c.ctaBook}
          </Link>
          <Link
            href="/verein"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] border border-white/35 text-[var(--color-wh-snow)] no-underline font-semibold hover:bg-white/10 transition-colors"
          >
            {c.ctaBack}
          </Link>
        </div>
      </div>
    </div>
  );
}
