"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  Heart,
  GraduationCap,
  Hammer,
  Dumbbell,
  Tent,
  Sparkles,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n-shared";
import { startMembershipJoin } from "./actions";

type Tier = { code: string; name: string; annualFeeCents: number };
type Prefill = {
  loggedIn: boolean;
  firstName: string;
  lastName: string;
  email: string;
  alreadyVerified: boolean;
  pendingClaim: boolean;
};

// =============================================================
// COPY — DE/EN/NL. Der Flow soll sich nach Mitmachen anfühlen,
// nicht nach Behördenformular: jede Etappe erzählt, was der
// Beitrag an der Hütte und im Schulprojekt bewirkt.
// =============================================================
const COPY: Record<Locale, {
  eyebrow: string;
  h1: string;
  lead: string;
  steps: [string, string, string];
  stepDone: string;
  tierTitle: string;
  tierLead: string;
  perYear: string;
  perMonthAbout: string;
  tierChosen: string;
  tierCta: string;
  dataTitle: string;
  dataLead: string;
  firstName: string;
  lastName: string;
  email: string;
  emailLockedHint: string;
  phone: string;
  phoneOptional: string;
  terms1: string;
  termsAgb: string;
  terms2: string;
  termsPrivacy: string;
  terms3: string;
  back: string;
  reviewTitle: string;
  reviewLead: string;
  reviewTier: string;
  reviewName: string;
  reviewEmail: string;
  reviewYearly: string;
  reviewCancel: string;
  payCta: string;
  paySecure: string;
  instantTitle: string;
  instantBody: string;
  impactTitle: string;
  impacts: { icon: "school" | "hammer" | "gym" | "tent" | "heart"; title: string; body: string }[];
  benefitsTitle: string;
  benefits: string[];
  alreadyTitle: string;
  alreadyBody: string;
  alreadyCta: string;
  pendingHint: string;
  proveTitle: string;
  proveBody: string;
  proveCta: string;
  statusCancelled: string;
  statusError: string;
  statusAlready: string;
  nextBookingNote: string;
}> = {
  de: {
    eyebrow: "Skifreunde Gütersloh e.V.",
    h1: "Werde Teil der Wiese.",
    lead:
      "Online beitreten dauert drei Minuten. Dein Beitrag hält die Hütte am Leben — und Deine Mitgliedschaft ist sofort aktiv: Mitgliederpreise gelten ab der nächsten Buchung.",
    steps: ["Beitrag wählen", "Deine Daten", "Beitreten"],
    stepDone: "Fertig",
    tierTitle: "Welcher Beitrag passt zu Dir?",
    tierLead: "Sieben faire Kategorien — alle tragen dieselbe Hütte.",
    perYear: "pro Jahr",
    perMonthAbout: "≈ {m} € im Monat",
    tierChosen: "Schöne Wahl. Damit machst Du echte Hüttenarbeit möglich.",
    tierCta: "Weiter",
    dataTitle: "Wer tritt bei?",
    dataLead: "Mehr als das brauchen wir nicht — versprochen.",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    emailLockedHint: "Beitritt läuft über Dein eingeloggtes Konto.",
    phone: "Telefon",
    phoneOptional: "optional",
    terms1: "Ich akzeptiere die ",
    termsAgb: "Vereinsbedingungen",
    terms2: " und die ",
    termsPrivacy: "Datenschutzerklärung",
    terms3: ". Der Jahresbeitrag verlängert sich automatisch und ist jederzeit zum Jahresende kündbar.",
    back: "Zurück",
    reviewTitle: "Ein Klick bis zur Mitgliedschaft.",
    reviewLead: "So geht's weiter: sichere Zahlung über Stripe, danach ist Deine Mitgliedschaft sofort aktiv.",
    reviewTier: "Beitragskategorie",
    reviewName: "Name",
    reviewEmail: "E-Mail",
    reviewYearly: "Jahresbeitrag",
    reviewCancel: "jederzeit zum Jahresende kündbar",
    payCta: "Jetzt Mitglied werden",
    paySecure: "Sichere Zahlung über Stripe — Karte oder SEPA-Lastschrift.",
    instantTitle: "Sofort aktiv",
    instantBody: "Direkt nach der Zahlung gelten für Dich die Mitgliederpreise — 50 % auf Übernachtungen.",
    impactTitle: "Was Du möglich machst",
    impacts: [
      {
        icon: "school",
        title: "Schüler:innen lernen mit Kopf und Hand",
        body: "Klassen des ESG bauen, schrauben und wachsen an der Hütte — Dein Beitrag trägt das Schulprojekt mit.",
      },
      {
        icon: "hammer",
        title: "Die Hütte bleibt in Schuss",
        body: "Seit 1956 in Eigenleistung gebaut und gepflegt. Beiträge zahlen Holz, Farbe und neue Projekte wie das Zeltpodest.",
      },
      {
        icon: "gym",
        title: "Skigymnastik inklusive",
        body: "Dienstags 18:30 & donnerstags 20:00 — als Mitglied trainierst Du einfach mit.",
      },
      {
        icon: "tent",
        title: "Ein Ort für Generationen",
        body: "Vereinsfahrten, Grünkohlwanderung, Adventskaffee — seit über 70 Jahren Gemeinschaft.",
      },
    ],
    benefitsTitle: "Deine Mitgliedschaft",
    benefits: [
      "50 % auf Übernachtungen an der Wiesenhütte",
      "Skigymnastik dienstags & donnerstags inklusive",
      "Vereinsfahrten & Veranstaltungen durchs Jahr",
      "Sofort aktiv — direkt mit Mitgliederpreisen buchen",
    ],
    alreadyTitle: "Du bist schon Mitglied! 🎉",
    alreadyBody:
      "Deine Mitgliedschaft ist bestätigt — beim Buchen gelten für Dich automatisch die Mitgliederpreise.",
    alreadyCta: "Mit Mitgliederpreisen buchen",
    pendingHint:
      "Dein Mitglieds-Nachweis wird gerade geprüft. Wenn Du stattdessen direkt online beitreten möchtest, geht das hier — die Mitgliedschaft ist dann sofort aktiv.",
    proveTitle: "Schon Mitglied bei den Skifreunden?",
    proveBody:
      "Dann brauchst Du nichts zu kaufen: Leg ein Konto an und gib an, dass Du Mitglied bist — wir schalten Dich nach kurzer Prüfung frei.",
    proveCta: "Mitgliedschaft nachweisen",
    statusCancelled: "Zahlung abgebrochen — kein Problem. Deine Auswahl ist noch da, probier's einfach nochmal.",
    statusError: "Das hat leider nicht geklappt. Bitte prüfe Deine Angaben und versuch es noch einmal.",
    statusAlready: "Du bist bereits bestätigtes Mitglied — ein Online-Beitritt ist nicht nötig.",
    nextBookingNote: "Danach geht's direkt zurück zu Deiner Buchung.",
  },
  en: {
    eyebrow: "Skifreunde Gütersloh e.V.",
    h1: "Become part of the meadow.",
    lead:
      "Joining online takes three minutes. Your fee keeps the cabin alive — and your membership is active immediately: member rates apply from your very next booking.",
    steps: ["Choose your fee", "Your details", "Join"],
    stepDone: "Done",
    tierTitle: "Which fee fits you?",
    tierLead: "Seven fair categories — all carrying the same cabin.",
    perYear: "per year",
    perMonthAbout: "≈ €{m} a month",
    tierChosen: "Great choice. You're making real cabin work possible.",
    tierCta: "Continue",
    dataTitle: "Who is joining?",
    dataLead: "That's all we need — promise.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    emailLockedHint: "You're joining with your logged-in account.",
    phone: "Phone",
    phoneOptional: "optional",
    terms1: "I accept the ",
    termsAgb: "club terms",
    terms2: " and the ",
    termsPrivacy: "privacy policy",
    terms3: ". The annual fee renews automatically and can be cancelled at any time effective year-end.",
    back: "Back",
    reviewTitle: "One click to membership.",
    reviewLead: "What happens next: secure payment via Stripe, then your membership is active immediately.",
    reviewTier: "Fee category",
    reviewName: "Name",
    reviewEmail: "Email",
    reviewYearly: "Annual fee",
    reviewCancel: "cancellable any time, effective year-end",
    payCta: "Join now",
    paySecure: "Secure payment via Stripe — card or SEPA direct debit.",
    instantTitle: "Active immediately",
    instantBody: "Right after payment, member rates apply for you — 50% off overnight stays.",
    impactTitle: "What you make possible",
    impacts: [
      {
        icon: "school",
        title: "Students learn with head and hands",
        body: "ESG school classes build, fix and grow at the cabin — your fee helps carry the school project.",
      },
      {
        icon: "hammer",
        title: "The cabin stays in shape",
        body: "Built and maintained by members since 1956. Fees pay for timber, paint and new projects like the beach volleyball court.",
      },
      {
        icon: "gym",
        title: "Ski gymnastics included",
        body: "Tuesdays 6:30 pm & Thursdays 8 pm — as a member you simply train along.",
      },
      {
        icon: "tent",
        title: "A place for generations",
        body: "Club trips, the kale hike, advent coffee — community for over 70 years.",
      },
    ],
    benefitsTitle: "Your membership",
    benefits: [
      "50% off overnight stays at the Wiesenhütte",
      "Ski gymnastics on Tuesdays & Thursdays included",
      "Club trips & events all year round",
      "Active immediately — book at member rates right away",
    ],
    alreadyTitle: "You're already a member! 🎉",
    alreadyBody: "Your membership is confirmed — member rates apply automatically when you book.",
    alreadyCta: "Book at member rates",
    pendingHint:
      "Your membership proof is being reviewed. If you'd rather join online directly, you can do that here — membership is then active immediately.",
    proveTitle: "Already a Skifreunde member?",
    proveBody:
      "Then there's nothing to buy: create an account and tell us you're a member — we'll unlock you after a quick check.",
    proveCta: "Prove membership",
    statusCancelled: "Payment cancelled — no problem. Your selection is still here, just try again.",
    statusError: "That didn't work, unfortunately. Please check your details and try again.",
    statusAlready: "You're already a confirmed member — no online joining needed.",
    nextBookingNote: "Afterwards you'll head straight back to your booking.",
  },
  nl: {
    eyebrow: "Skifreunde Gütersloh e.V.",
    h1: "Word deel van de wei.",
    lead:
      "Online lid worden duurt drie minuten. Jouw bijdrage houdt de hut in leven — en je lidmaatschap is meteen actief: ledentarieven gelden vanaf je eerstvolgende boeking.",
    steps: ["Bijdrage kiezen", "Jouw gegevens", "Lid worden"],
    stepDone: "Klaar",
    tierTitle: "Welke bijdrage past bij jou?",
    tierLead: "Zeven eerlijke categorieën — allemaal dragen ze dezelfde hut.",
    perYear: "per jaar",
    perMonthAbout: "≈ €{m} per maand",
    tierChosen: "Mooie keuze. Hiermee maak je echt huttenwerk mogelijk.",
    tierCta: "Verder",
    dataTitle: "Wie wordt lid?",
    dataLead: "Meer hebben we niet nodig — beloofd.",
    firstName: "Voornaam",
    lastName: "Achternaam",
    email: "E-mail",
    emailLockedHint: "Je wordt lid met je ingelogde account.",
    phone: "Telefoon",
    phoneOptional: "optioneel",
    terms1: "Ik accepteer de ",
    termsAgb: "verenigingsvoorwaarden",
    terms2: " en de ",
    termsPrivacy: "privacyverklaring",
    terms3: ". De jaarlijkse bijdrage verlengt automatisch en is altijd opzegbaar per jaareinde.",
    back: "Terug",
    reviewTitle: "Eén klik tot lidmaatschap.",
    reviewLead: "Zo gaat het verder: veilige betaling via Stripe, daarna is je lidmaatschap meteen actief.",
    reviewTier: "Bijdragecategorie",
    reviewName: "Naam",
    reviewEmail: "E-mail",
    reviewYearly: "Jaarlijkse bijdrage",
    reviewCancel: "altijd opzegbaar per jaareinde",
    payCta: "Nu lid worden",
    paySecure: "Veilige betaling via Stripe — kaart of SEPA-incasso.",
    instantTitle: "Meteen actief",
    instantBody: "Direct na betaling gelden voor jou de ledentarieven — 50% op overnachtingen.",
    impactTitle: "Wat jij mogelijk maakt",
    impacts: [
      {
        icon: "school",
        title: "Leerlingen leren met hoofd en handen",
        body: "Schoolklassen van het ESG bouwen, sleutelen en groeien bij de hut — jouw bijdrage draagt het schoolproject mee.",
      },
      {
        icon: "hammer",
        title: "De hut blijft in vorm",
        body: "Sinds 1956 door leden gebouwd en onderhouden. Bijdragen betalen hout, verf en nieuwe projecten zoals de tentvlonder.",
      },
      {
        icon: "gym",
        title: "Skigymnastiek inbegrepen",
        body: "Dinsdag 18:30 & donderdag 20:00 — als lid train je gewoon mee.",
      },
      {
        icon: "tent",
        title: "Een plek voor generaties",
        body: "Verenigingsreizen, Grünkohl-wandeling, adventkoffie — al ruim 70 jaar gemeenschap.",
      },
    ],
    benefitsTitle: "Jouw lidmaatschap",
    benefits: [
      "50% op overnachtingen in de Wiesenhütte",
      "Skigymnastiek op dinsdag & donderdag inbegrepen",
      "Verenigingsreizen & evenementen het hele jaar",
      "Meteen actief — direct boeken tegen ledentarieven",
    ],
    alreadyTitle: "Je bent al lid! 🎉",
    alreadyBody: "Je lidmaatschap is bevestigd — bij het boeken gelden automatisch de ledentarieven.",
    alreadyCta: "Boeken tegen ledentarieven",
    pendingHint:
      "Je lidmaatschapsbewijs wordt momenteel gecontroleerd. Wil je liever direct online lid worden, dan kan dat hier — het lidmaatschap is dan meteen actief.",
    proveTitle: "Al lid van de Skifreunde?",
    proveBody:
      "Dan hoef je niets te kopen: maak een account aan en geef aan dat je lid bent — we schakelen je na een korte controle vrij.",
    proveCta: "Lidmaatschap aantonen",
    statusCancelled: "Betaling afgebroken — geen probleem. Je keuze staat er nog, probeer het gewoon opnieuw.",
    statusError: "Dat is helaas niet gelukt. Controleer je gegevens en probeer het opnieuw.",
    statusAlready: "Je bent al een bevestigd lid — online lid worden is niet nodig.",
    nextBookingNote: "Daarna ga je direct terug naar je boeking.",
  },
};

// Beschreibungen je Beitragskategorie (DB liefert nur den deutschen Namen).
const TIER_META: Record<string, { de: string; en: string; nl: string }> = {
  erwachsene: {
    de: "Für Dich allein — der Klassiker.",
    en: "Just for you — the classic.",
    nl: "Voor jou alleen — de klassieker.",
  },
  ehepaare: {
    de: "Für Paare — gemeinsam dabei.",
    en: "For couples — in it together.",
    nl: "Voor stellen — samen erbij.",
  },
  familie_unter_14: {
    de: "Eltern + Kinder bis 14 Jahre.",
    en: "Parents + children up to 14.",
    nl: "Ouders + kinderen t/m 14 jaar.",
  },
  familie_ueber_14: {
    de: "Eltern + Kinder ab 14 Jahren.",
    en: "Parents + children from 14.",
    nl: "Ouders + kinderen vanaf 14 jaar.",
  },
  jugendliche_einzeln: {
    de: "Für Kinder & Jugendliche solo.",
    en: "For kids & teens on their own.",
    nl: "Voor kinderen & jongeren solo.",
  },
  schueler_studenten: {
    de: "Für alle, die noch lernen.",
    en: "For everyone still studying.",
    nl: "Voor iedereen die nog studeert.",
  },
  rentner: {
    de: "Für den Ruhestand mit Aussicht.",
    en: "For retirement with a view.",
    nl: "Voor een pensioen met uitzicht.",
  },
};

const TIER_NAME_I18N: Record<string, { en: string; nl: string }> = {
  erwachsene: { en: "Adults", nl: "Volwassenen" },
  ehepaare: { en: "Couples", nl: "Echtparen" },
  familie_unter_14: { en: "Families (children up to 14)", nl: "Gezinnen (kinderen t/m 14)" },
  familie_ueber_14: { en: "Families (children from 14)", nl: "Gezinnen (kinderen vanaf 14)" },
  jugendliche_einzeln: { en: "Kids & teens (individual)", nl: "Kinderen & jongeren (individueel)" },
  schueler_studenten: { en: "Pupils & students", nl: "Scholieren & studenten" },
  rentner: { en: "Retirees", nl: "Gepensioneerden" },
};

const IMPACT_ICONS = {
  school: GraduationCap,
  hammer: Hammer,
  gym: Dumbbell,
  tent: Tent,
  heart: Heart,
} as const;

// Gleicher Input-Stil wie im SignupForm (/registrieren).
const INPUT =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 focus:border-[var(--color-wh-deep-green)] focus:outline-none";

const euro = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

export const JoinWizard = ({
  locale,
  tiers,
  prefill,
  status,
  next,
}: {
  locale: Locale;
  tiers: Tier[];
  prefill: Prefill;
  status: string | null;
  next: string | null;
}) => {
  const c = COPY[locale];
  const [step, setStep] = useState(0);
  const [tierCode, setTierCode] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(prefill.firstName);
  const [lastName, setLastName] = useState(prefill.lastName);
  const [email, setEmail] = useState(prefill.email);
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tier = useMemo(() => tiers.find((t) => t.code === tierCode) ?? null, [tiers, tierCode]);
  const tierName = (t: Tier) =>
    locale === "de" ? t.name : (TIER_NAME_I18N[t.code]?.[locale] ?? t.name);

  const dataValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Bereits bestätigte Mitglieder brauchen den Kaufflow nicht.
  if (prefill.alreadyVerified) {
    return (
      <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-28 min-h-[55vh]">
        <div className="max-w-[640px] mx-auto text-center">
          <PartyPopper size={56} className="mx-auto text-[var(--color-wh-green)]" />
          <h1 className="text-[32px] sm:text-[44px] mt-6 mb-4">{c.alreadyTitle}</h1>
          <p className="text-[var(--color-wh-fg-muted)] text-base sm:text-[17px] leading-relaxed mb-8">
            {c.alreadyBody}
          </p>
          <Link
            href={next ?? "/buchen"}
            className="inline-flex h-12 px-7 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold hover:bg-[var(--color-wh-green)] transition-colors"
          >
            {c.alreadyCta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-wh-snow)]">
      {/* ---------- Hero ---------- */}
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-xs uppercase tracking-[0.16em] font-semibold opacity-85 flex items-center gap-2">
            <Heart size={14} className="text-[var(--color-wh-sunset)]" aria-hidden />
            {c.eyebrow}
          </div>
          <h1 className="text-[40px] sm:text-[60px] leading-[1.02] mt-4 mb-5 text-[var(--color-wh-snow)]">
            {c.h1}
          </h1>
          <p className="text-base sm:text-[18px] leading-relaxed max-w-2xl opacity-90 m-0">
            {c.lead}
          </p>
        </div>
      </section>

      <section className="px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[1080px] mx-auto">
          {/* Status-Meldungen aus Redirects */}
          {status === "abgebrochen" && <Notice tone="info" text={c.statusCancelled} />}
          {status === "fehler" && <Notice tone="error" text={c.statusError} />}
          {status === "schon-mitglied" && <Notice tone="info" text={c.statusAlready} />}
          {prefill.pendingClaim && <Notice tone="info" text={c.pendingHint} />}

          {/* ---------- Stepper ---------- */}
          <ol className="flex items-center gap-2 sm:gap-3 mb-10 list-none p-0 m-0" aria-label="Schritte">
            {c.steps.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => done && setStep(i)}
                    disabled={!done}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors border",
                      active &&
                        "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] border-[var(--color-wh-deep-green)]",
                      done &&
                        "bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] border-[var(--color-wh-green)] cursor-pointer",
                      !active && !done && "bg-white text-[var(--color-wh-fg-muted)] border-[var(--color-wh-winter-grey)]"
                    )}
                  >
                    {done ? <Check size={14} aria-label={c.stepDone} /> : <span>{i + 1}</span>}
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                  {i < c.steps.length - 1 && (
                    <span className="w-5 sm:w-8 h-px bg-[var(--color-wh-winter-grey)]" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* ---------- Hauptspalte: Schritte ---------- */}
            <div className="lg:col-span-7">
              {step === 0 && (
                <div>
                  <h2 className="text-[26px] sm:text-[34px] mt-0 mb-2">{c.tierTitle}</h2>
                  <p className="text-[var(--color-wh-fg-muted)] m-0 mb-6">{c.tierLead}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={c.tierTitle}>
                    {tiers.map((t) => {
                      const active = t.code === tierCode;
                      const monthly = Math.round(t.annualFeeCents / 12 / 100);
                      return (
                        <button
                          key={t.code}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setTierCode(t.code)}
                          className={cn(
                            "text-left rounded-[var(--radius-card)] border p-4 cursor-pointer transition-all bg-white",
                            active
                              ? "border-[var(--color-wh-deep-green)] ring-2 ring-[var(--color-wh-deep-green)]/25 shadow-[0_10px_28px_rgba(47,74,53,0.12)]"
                              : "border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-deep-green)]/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-[15px] text-[var(--color-wh-deep-green)] leading-snug">
                              {tierName(t)}
                            </div>
                            <span
                              className={cn(
                                "shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full border transition-colors",
                                active
                                  ? "bg-[var(--color-wh-deep-green)] border-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
                                  : "border-[var(--color-wh-winter-grey)] text-transparent"
                              )}
                              aria-hidden
                            >
                              <Check size={12} />
                            </span>
                          </div>
                          <div className="text-xs text-[var(--color-wh-fg-muted)] mt-1">
                            {TIER_META[t.code]?.[locale] ?? ""}
                          </div>
                          <div className="font-display font-bold text-[26px] text-[var(--color-wh-deep-green)] mt-3 leading-none">
                            {euro(t.annualFeeCents)} €
                            <span className="text-xs font-normal text-[var(--color-wh-fg-muted)] font-sans">
                              {" "}
                              {c.perYear}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--color-wh-fg-muted)] mt-1">
                            {c.perMonthAbout.replace("{m}", String(monthly))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {tier && (
                    <div className="flex items-center gap-2 mt-5 text-sm text-[var(--color-wh-deep-green)] font-medium">
                      <Sparkles size={16} className="text-[var(--color-wh-sunset)]" aria-hidden />
                      {c.tierChosen}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!tier}
                    onClick={() => setStep(1)}
                    className="mt-6 inline-flex h-12 px-7 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {c.tierCta}
                  </button>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-[26px] sm:text-[34px] mt-0 mb-2">{c.dataTitle}</h2>
                  <p className="text-[var(--color-wh-fg-muted)] m-0 mb-6">{c.dataLead}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={c.firstName}>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoComplete="given-name"
                        className={INPUT}
                      />
                    </Field>
                    <Field label={c.lastName}>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        autoComplete="family-name"
                        className={INPUT}
                      />
                    </Field>
                    <Field label={c.email} hint={prefill.loggedIn ? c.emailLockedHint : undefined}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={prefill.loggedIn}
                        autoComplete="email"
                        className={INPUT + " disabled:opacity-60"}
                      />
                    </Field>
                    <Field label={`${c.phone} (${c.phoneOptional})`}>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="inline-flex h-12 px-5 items-center gap-1.5 rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] font-semibold hover:bg-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} /> {c.back}
                    </button>
                    <button
                      type="button"
                      disabled={!dataValid}
                      onClick={() => setStep(2)}
                      className="inline-flex h-12 px-7 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {c.tierCta}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && tier && (
                <form action={startMembershipJoin} onSubmit={() => setSubmitting(true)}>
                  {/* Honeypot */}
                  <div aria-hidden className="hidden">
                    <label>
                      Website
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <input type="hidden" name="tierCode" value={tier.code} />
                  <input type="hidden" name="firstName" value={firstName} />
                  <input type="hidden" name="lastName" value={lastName} />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="phone" value={phone} />
                  {next && <input type="hidden" name="next" value={next} />}

                  <h2 className="text-[26px] sm:text-[34px] mt-0 mb-2">{c.reviewTitle}</h2>
                  <p className="text-[var(--color-wh-fg-muted)] m-0 mb-6">{c.reviewLead}</p>

                  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 space-y-3">
                    <SummaryRow label={c.reviewTier} value={tierName(tier)} />
                    <SummaryRow label={c.reviewName} value={`${firstName} ${lastName}`} />
                    <SummaryRow label={c.reviewEmail} value={email} />
                    <div className="border-t border-[var(--color-wh-winter-grey)]/60 pt-3 flex items-baseline justify-between gap-4">
                      <div className="text-sm font-semibold text-[var(--color-wh-deep-green)]">
                        {c.reviewYearly}
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-[28px] text-[var(--color-wh-deep-green)] leading-none">
                          {euro(tier.annualFeeCents)} €
                        </div>
                        <div className="text-[11px] text-[var(--color-wh-fg-muted)] mt-1">
                          {c.reviewCancel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-5 bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 rounded-[var(--radius-card)] p-4">
                    <Sparkles size={18} className="text-[var(--color-wh-sunset)] shrink-0 mt-0.5" aria-hidden />
                    <div className="text-sm text-[var(--color-wh-deep-green)]">
                      <strong>{c.instantTitle}:</strong> {c.instantBody}
                      {next && <> {c.nextBookingNote}</>}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 mt-5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                      className="mt-1 accent-[var(--color-wh-deep-green)]"
                    />
                    <span className="text-[var(--color-wh-fg-muted)]">
                      {c.terms1}
                      <a href="/agb" target="_blank" className="underline">
                        {c.termsAgb}
                      </a>
                      {c.terms2}
                      <a href="/datenschutz" target="_blank" className="underline">
                        {c.termsPrivacy}
                      </a>
                      {c.terms3}
                    </span>
                  </label>

                  <div className="flex items-center gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex h-12 px-5 items-center gap-1.5 rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] font-semibold hover:bg-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} /> {c.back}
                    </button>
                    <button
                      type="submit"
                      disabled={!acceptTerms || submitting}
                      className="inline-flex h-12 px-7 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-sunset)] text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Heart size={16} aria-hidden />
                      {submitting ? "…" : c.payCta}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-[var(--color-wh-fg-muted)]">
                    <ShieldCheck size={14} aria-hidden /> {c.paySecure}
                  </div>
                </form>
              )}
            </div>

            {/* ---------- Seitenpanel: Was Du bewirkst ---------- */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-6">
                <div className="text-xs uppercase tracking-[0.14em] font-bold text-[var(--color-wh-deep-green)] mb-4">
                  {c.impactTitle}
                </div>
                <div className="space-y-4">
                  {c.impacts.map((imp) => {
                    const Icon = IMPACT_ICONS[imp.icon];
                    return (
                      <div key={imp.title} className="flex items-start gap-3">
                        <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]">
                          <Icon size={17} strokeWidth={1.8} aria-hidden />
                        </span>
                        <div>
                          <div className="font-semibold text-sm text-[var(--color-wh-deep-green)]">
                            {imp.title}
                          </div>
                          <div className="text-[13px] leading-relaxed text-[var(--color-wh-fg-muted)] mt-0.5">
                            {imp.body}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mt-4">
                <div className="text-xs uppercase tracking-[0.14em] font-bold text-[var(--color-wh-deep-green)] mb-3">
                  {c.benefitsTitle}
                </div>
                <ul className="list-none p-0 m-0 space-y-2">
                  {c.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-wh-black)]">
                      <Check size={16} className="text-[var(--color-wh-green)] shrink-0 mt-0.5" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nachweis-Pfad — bewusst getrennt vom Kauf */}
              <div className="border border-dashed border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 mt-4">
                <div className="font-semibold text-sm text-[var(--color-wh-deep-green)]">{c.proveTitle}</div>
                <p className="text-[13px] text-[var(--color-wh-fg-muted)] leading-relaxed mt-1 mb-3">
                  {c.proveBody}
                </p>
                <Link
                  href="/registrieren"
                  className="text-sm font-semibold underline text-[var(--color-wh-deep-green)]"
                >
                  {c.proveCta} →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1.5">
      {label}
    </span>
    {children}
    {hint && <span className="block text-[11px] text-[var(--color-wh-fg-muted)] mt-1">{hint}</span>}
  </label>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4 text-sm">
    <span className="text-[var(--color-wh-fg-muted)]">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

const Notice = ({ tone, text }: { tone: "info" | "error"; text: string }) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    className={cn(
      "rounded-[var(--radius-card)] border px-4 py-3 text-sm mb-6",
      tone === "error"
        ? "bg-[#fdf1ec] border-[var(--color-wh-sunset)]/50 text-[#7a3a20]"
        : "bg-[var(--color-wh-green-soft)] border-[var(--color-wh-green)]/40 text-[var(--color-wh-deep-green)]"
    )}
  >
    {text}
  </div>
);
