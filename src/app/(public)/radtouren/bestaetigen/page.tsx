import Link from "next/link";
import { and, eq, isNotNull } from "drizzle-orm";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { rideInterests } from "@/lib/db/schema-rad";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { confirmRideInterest } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Radtouren-Interesse bestätigen · Wiesenhütte" };

const COPY: Record<Locale, {
  confirmH: string;
  confirmBody: string;
  confirmBtn: string;
  okH: string;
  okBody: string;
  failH: string;
  failBody: string;
  back: string;
}> = {
  de: {
    confirmH: "Interesse bestätigen",
    confirmBody:
      "Klicke auf den Button, um Dein Interesse an gemeinsamen Rad-Wochenenden zu bestätigen.",
    confirmBtn: "Jetzt bestätigen",
    okH: "Interesse bestätigt!",
    okBody:
      "Du bist dabei. Sobald sich 8 oder mehr Radbegeisterte für eines Deiner Wochenenden gefunden haben, bekommst Du automatisch eine Mail mit der Gruppe und den nächsten Schritten.",
    failH: "Link ungültig.",
    failBody:
      "Dieser Bestätigungslink ist nicht (mehr) gültig. Trag Dich einfach neu ein — das dauert nur eine Minute.",
    back: "Zur Radtouren-Seite",
  },
  en: {
    confirmH: "Confirm your interest",
    confirmBody: "Click the button to confirm your interest in joint cycling weekends.",
    confirmBtn: "Confirm now",
    okH: "Interest confirmed!",
    okBody:
      "You're in. As soon as 8 or more cyclists have picked one of your weekends, you'll automatically get an email with the group and the next steps.",
    failH: "Invalid link.",
    failBody:
      "This confirmation link is no longer valid. Just sign up again — it only takes a minute.",
    back: "To the bike tours page",
  },
  nl: {
    confirmH: "Interesse bevestigen",
    confirmBody: "Klik op de knop om je interesse in gezamenlijke fietsweekenden te bevestigen.",
    confirmBtn: "Nu bevestigen",
    okH: "Interesse bevestigd!",
    okBody:
      "Je doet mee. Zodra 8 of meer fietsers een van jouw weekenden hebben gekozen, krijg je automatisch een mail met de groep en de volgende stappen.",
    failH: "Link ongeldig.",
    failBody:
      "Deze bevestigingslink is niet (meer) geldig. Schrijf je gewoon opnieuw in — het duurt maar een minuut.",
    back: "Naar de fietstochten-pagina",
  },
};

export default async function RadBestaetigenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const { token, done } = await searchParams;
  const locale = await getServerLocale();
  const c = COPY[locale];

  const validFormat = !!token && token.length >= 32 && token.length <= 64;

  // Nach POST-Bestätigung: prüfen, ob der Token wirklich verifiziert wurde.
  let confirmed = false;
  if (done === "1" && validFormat) {
    const rows = await db
      .select({ id: rideInterests.id })
      .from(rideInterests)
      .where(and(eq(rideInterests.verifyToken, token!), isNotNull(rideInterests.verifiedAt)))
      .limit(1);
    confirmed = rows.length > 0;
  }

  // Token existiert noch (unbestätigt)? Dann Bestätigungs-Button zeigen —
  // bewusst POST statt GET-Seiteneffekt (Mail-Scanner sollen nicht bestätigen).
  let pending = false;
  if (!confirmed && validFormat) {
    const rows = await db
      .select({ id: rideInterests.id })
      .from(rideInterests)
      .where(eq(rideInterests.verifyToken, token!))
      .limit(1);
    pending = rows.length > 0;
  }

  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-28 min-h-[55vh]">
      <div className="max-w-[640px] mx-auto text-center">
        {confirmed ? (
          <>
            <CheckCircle2 size={56} className="mx-auto text-[var(--color-wh-green)]" />
            <h1 className="text-[32px] sm:text-[44px] mt-6 mb-4">{c.okH}</h1>
            <p className="text-[var(--color-wh-fg-muted)] text-base sm:text-[17px] leading-relaxed">
              {c.okBody}
            </p>
          </>
        ) : pending ? (
          <>
            <h1 className="text-[32px] sm:text-[44px] mt-2 mb-4">{c.confirmH}</h1>
            <p className="text-[var(--color-wh-fg-muted)] text-base sm:text-[17px] leading-relaxed mb-8">
              {c.confirmBody}
            </p>
            <form action={confirmRideInterest}>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="inline-flex h-12 px-7 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer"
              >
                {c.confirmBtn}
              </button>
            </form>
          </>
        ) : (
          <>
            <XCircle size={56} className="mx-auto text-[var(--color-wh-sunset)]" />
            <h1 className="text-[32px] sm:text-[44px] mt-6 mb-4">{c.failH}</h1>
            <p className="text-[var(--color-wh-fg-muted)] text-base sm:text-[17px] leading-relaxed">
              {c.failBody}
            </p>
          </>
        )}
        <div className="mt-8">
          <Link
            href="/radtouren"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold hover:bg-[var(--color-wh-green)] transition-colors"
          >
            {c.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
