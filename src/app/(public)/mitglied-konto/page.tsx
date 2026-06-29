import { ClaimForm } from "./ClaimForm";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

const PAGE_COPY: Record<
  Locale,
  {
    eyebrow: string;
    h1: string;
    lead: string;
    secure: string;
    altTitle: string;
    altRegister: string;
    altJoin: string;
  }
> = {
  de: {
    eyebrow: "Wiesenhütte · Mitglieder",
    h1: "Schon Mitglied? Konto freischalten.",
    lead: "Bist Du bereits Mitglied der Skifreunde Gütersloh, brauchst Du Dich nicht neu zu registrieren. Gib Deine E-Mail ein — wir gleichen sie automatisch mit unserer Mitgliederliste ab und schalten Dein Konto sofort frei. Damit buchst Du die Hütte zum halben Preis.",
    secure:
      "Aus Sicherheitsgründen schließt Du die Freischaltung über einen Login-Link ab, den wir an genau diese Adresse schicken — so kann nur der echte Inhaber das Konto aktivieren.",
    altTitle: "Passt nicht?",
    altRegister: "Nur ein normales Konto anlegen",
    altJoin: "Neu beitreten (Online-Mitgliedschaft)",
  },
  en: {
    eyebrow: "Wiesenhütte · Members",
    h1: "Already a member? Unlock your account.",
    lead: "If you're already a member of the Skifreunde Gütersloh, there's no need to register again. Enter your email — we'll match it against our member list automatically and unlock your account right away, so you can book the cabin at half price.",
    secure:
      "For security, you complete the unlock via a login link we send to that exact address — so only the real owner can activate the account.",
    altTitle: "Not the right fit?",
    altRegister: "Just create a regular account",
    altJoin: "Join now (online membership)",
  },
  nl: {
    eyebrow: "Wiesenhütte · Leden",
    h1: "Al lid? Schakel je account vrij.",
    lead: "Ben je al lid van de Skifreunde Gütersloh, dan hoef je je niet opnieuw te registreren. Vul je e-mailadres in — we vergelijken het automatisch met onze ledenlijst en schakelen je account meteen vrij, zodat je de hut voor de halve prijs boekt.",
    secure:
      "Voor de zekerheid rond je de vrijschakeling af via een login-link die we naar precies dat adres sturen — zo kan alleen de echte eigenaar het account activeren.",
    altTitle: "Past dit niet?",
    altRegister: "Gewoon een account aanmaken",
    altJoin: "Nu lid worden (online lidmaatschap)",
  },
};

export const metadata = {
  title: "Mitglieds-Konto freischalten · Wiesenhütte",
  description:
    "Bestehende Vereinsmitglieder schalten hier ihr Konto frei und buchen zum halben Preis.",
};
export const dynamic = "force-dynamic";

export default async function MitgliedKontoPage() {
  const locale = await getServerLocale();
  const pc = PAGE_COPY[locale];

  return (
    <div className="container max-w-md mx-auto px-6 py-16">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        {pc.eyebrow}
      </p>
      <h1 className="font-heading text-4xl text-[var(--color-wh-deep-green)] mb-3">{pc.h1}</h1>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-5">{pc.lead}</p>

      <ClaimForm locale={locale} />

      <p className="text-xs text-[var(--color-wh-black)]/55 mt-4 leading-relaxed">{pc.secure}</p>

      <div className="mt-10 pt-6 border-t border-[var(--color-wh-winter-grey)]">
        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-black)]/50 mb-3">
          {pc.altTitle}
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <a className="text-[var(--color-wh-deep-green)] font-medium hover:underline" href="/registrieren">
            {pc.altRegister} →
          </a>
          <a className="text-[var(--color-wh-deep-green)] font-medium hover:underline" href="/mitglied-werden">
            {pc.altJoin} →
          </a>
        </div>
      </div>
    </div>
  );
}
