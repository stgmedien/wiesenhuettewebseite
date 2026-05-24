"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { calculatePrice, formatEuro, RULES, type Persons } from "@/lib/pricing";
import { daysUntil, getCancellationTier, getCancellationTiers } from "@/lib/cancellation";
import { createBookingAndCheckout, previewDiscountAction } from "./actions";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

// Anlass-Kategorien + Sub-Auswahl bei "Private Feier".
// Sind Pflicht beim Buchen. Bei "privat" muss zusätzlich ein freier Grund
// angegeben werden (Vorstands-Prüfung — siehe interne Notification).
const PURPOSE_KEYS = ["familie", "klasse", "schul", "verein", "firma", "privat", "sonstiges"] as const;
type PurposeKey = (typeof PURPOSE_KEYS)[number];
const PRIVATE_SUB_KEYS = ["jga", "geburtstag", "hochzeit", "sonstiges"] as const;
type PrivateSubKey = (typeof PRIVATE_SUB_KEYS)[number];

// Erzeugt aus den strukturierten Anlass-Feldern den String fuers DB-Feld
// `purpose`. Locale-Labels kommen aus dem Booking-Flow-Copy ("tt"), damit
// der Manager den lesbaren Anlass sieht. Bei "privat" wird der Grund
// angehaengt — der Vorstand soll das beim Check sehen koennen.
function composePurpose(
  category: PurposeKey | "",
  subtype: PrivateSubKey | "",
  reason: string,
  tt: { purposeOpts: Record<PurposeKey, string>; privateSubOpts: Record<PrivateSubKey, string> }
): string | null {
  if (!category) return null;
  const catLabel = tt.purposeOpts[category];
  if (category !== "privat") return catLabel;
  const subLabel = subtype ? tt.privateSubOpts[subtype] : "(unbekannt)";
  const r = reason.trim();
  return `${catLabel} — ${subLabel}${r ? ` — Grund: ${r}` : ""}`;
}

type Step = 0 | 1 | 2 | 3;

const emptyPersons: Persons = {
  adults: 0,
  members: 0,
  children: 0,
  pupils: 0,
  teachers: 0,
};

const todayIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const addDaysIso = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

type Prefill = {
  loggedIn: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  customerType?: "privat" | "mitglied" | "verein" | "firma";
  membershipVerified?: boolean;
};

type RepeatHint = {
  adults: number;
  members: number;
  children: number;
  pupils: number;
  teachers: number;
  soloUse: boolean;
  arrival: string;
  departure: string;
};

type BookingFlowProps = {
  bookedDates: string[];
  cleaningDates: string[];
  wartungDates: string[];
  prefill?: Prefill;
  repeatHint?: RepeatHint;
  locale?: "de" | "en" | "nl";
};

const BF_COPY = {
  de: {
    steps: ["Zeitraum", "Personen & Pauschalen", "Kontakt", "Übersicht"],
    s0H: "Wann?",
    s1H: "Wer kommt?",
    s1Pauschalen: "Pauschalen",
    s2H: "Eure Daten",
    s3H: "Übersicht",
    rangeBlocked: "Mindestens ein Tag in diesem Zeitraum ist bereits belegt — bitte einen anderen Zeitraum wählen.",
    arrival: "Anreise",
    departure: "Abreise",
    purpose: "Anlass *",
    purposePlaceholder: "Bitte wählen …",
    purposeOpts: {
      familie: "Familienurlaub",
      klasse: "Klassenfahrt",
      schul: "Schul-/Studienfahrt",
      verein: "Vereins-/Gruppenfahrt",
      firma: "Firmen-/Team-Event",
      privat: "Private Feier",
      sonstiges: "Sonstiges",
    },
    privateSubLabel: "Art der privaten Feier *",
    privateSubPlaceholder: "Bitte wählen …",
    privateSubOpts: {
      jga: "Junggesell:innen-Abschied (JGA)",
      geburtstag: "Runder Geburtstag",
      hochzeit: "Hochzeit / Vorfeier",
      sonstiges: "Andere private Feier",
    },
    privateReasonLabel: "Kurze Beschreibung *",
    privateReasonPlaceholder: "Worum geht es genau? Wer kommt? Ungefähre Gruppengröße / Programm?",
    privateReasonHint: "Private Feiern werden vom Vorstand kurz geprüft. Bitte 1–2 Sätze.",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    phone: "Telefon *",
    company: "Firma / Verein",
    street: "Straße",
    zip: "PLZ",
    city: "Ort",
    msg: "Nachricht (optional)",
    msgHint: "Sonderwünsche, Fragen, geplante Anreisezeit ...",
    accept: "Ich habe die",
    acceptAgb: "AGB",
    acceptPrivacy: "Datenschutzerklärung",
    acceptHausordnung: "Hausordnung",
    acceptEnd: "gelesen und akzeptiere sie.",
    andWord: "und",
    hausordnungWarnTitle: "Wichtige Nutzungsregeln",
    hausordnungWarnBody: "Ab 22 Uhr Nachtruhe (auch außen) · keine Tiere · keine Lebensmittel in Schlafräumen · Hausschuhe drinnen · Müll trennen + Restmüll mitnehmen · Hütte besenrein hinterlassen. Verstöße können von der Kaution einbehalten werden.",
    discountH: "Gutscheincode (optional)",
    discountApply: "Anwenden",
    discountChecking: "Prüfe …",
    discountRemove: "Entfernen",
    discountPlaceholder: "z. B. WH-A1B2-C3D4",
    discountAppliedPre: "Code",
    discountAppliedPost: "angewendet",
    dueToday: "Heute fällig:",
    deposit: "Anzahlung",
    bookingTotalAfter: "50 % der Buchungssumme",
    afterDiscount: "nach Rabatt",
    kaution: "Kaution",
    restzahlung: "Restzahlung von",
    restzahlungBody: "wird vor Anreise per separater Zahlungsaufforderung eingezogen. Die Kaution wird innerhalb von 14 Tagen nach mangelfreier Abreise zurückerstattet.",
    kurtaxeNote: "Hinweis: Die Kurtaxe Hochsauerland wird seit Mai 2026 separat über das offizielle Kurtaxen-Portal abgerechnet — Du erhältst nach der Buchung eine eigene E-Mail mit dem Link.",
    stornoH: "Stornierungs-Regelwerk",
    stornoToday: (d: number, p: number) => `Bei Storno heute (${d} Tage vor Anreise): ${p}% Rückerstattung`,
    stornoTodayNoDays: (p: number) => `Bei Storno heute: ${p}% Rückerstattung`,
    stornoVerfaellt: "— Buchung verfällt.",
    stornoBody: "Vollständige Stornogebühren-Staffel (gerechnet von der Anreise rückwärts):",
    stornoRefund: "Rückerstattung",
    stornoNote: "Die Kaution wird unabhängig davon immer voll erstattet (sofern keine Schäden). Stornierungen müssen schriftlich erfolgen.",
    next: "Weiter",
    back: "Zurück",
    overview: "Übersicht",
    payNow: "Jetzt zahlen",
    redirecting: "Leite weiter ...",
    // Persons / pricing
    personsRange: (n: number, min: number, max: number) => `${n} von ${min}–${max} Personen.`,
    endreinigungTitle: "Endreinigung — 190,00 € (Pflicht)",
    endreinigungBody: "Die finale Reinigung wird von uns durchgeführt und ist in jeder Buchung enthalten.",
    soloTitle: "Allein-/Exklusivnutzung — 50,00 €",
    soloBody: "Aufschlag für die alleinige Nutzung der Hütte.",
    whoBooks: "Wer bucht?",
    ctPrivat: "Privat",
    ctMitglied: "Vereinsmitglied",
    ctVerein: "Verein / Schule",
    ctFirma: "Firma",
    loginHint1: "💡 Hast Du schon ein Konto?",
    loginHintLink: "Hier einloggen",
    loginHint2: "— oder weiter buchen, wir legen automatisch ein Konto für Dich an.",
    // PersonsEditor
    adultsLabel: "Erwachsene (Nichtmitglieder)",
    adultsHint: "ab 16 Jahren · 18,00 € / Nacht",
    membersLabel: "Erwachsene Vereinsmitglieder",
    membersHint: "7,50 € / Nacht",
    childrenLabel: "Kinder (4–15 Jahre)",
    childrenHint: "10,00 € / Nacht",
    pupilsLabel: "Schüler (Schulgruppen)",
    pupilsHint: "7,50 € / Nacht",
    teachersLabel: "Lehrkräfte",
    teachersHint: "bei Schulgruppen · zählen wie Erwachsene",
    memberLockedLabel: "Erwachsene Vereinsmitglieder",
    memberLockedHintPre: "Nur für verifizierte Skifreunde-Mitglieder.",
    memberLockedLogin: "Login",
    memberLockedOr: "oder im",
    memberLockedProfile: "Konto-Profil",
    memberLockedEnd: "Mitgliedschaft beantragen.",
    memberLockedState: "gesperrt",
    ariaLess: "Weniger",
    ariaMore: "Mehr",
    // PriceSummary
    priceSummaryH: "Preisübersicht",
    priceSummaryEmpty: "Datum & Personen wählen, um die Preise zu sehen.",
    nightsLabel: "Nächte",
    personsLabel: "Personen",
    bookingSum: "Buchungssumme",
    dueTodayShort: "Heute fällig",
    prepayment50: "Anzahlung 50 %",
    plusKaution: "+ Kaution",
    todayToPay: "Heute zu zahlen",
    remainderBefore: "Restzahlung (vor Anreise)",
    kurtaxeShort: "Kurtaxe wird separat über das Hochsauerland-Portal abgerechnet.",
    // ReviewBlock
    zeitraum: "Zeitraum",
    bucher: "Bucher",
    totalSuffix: "gesamt",
    adultsShort: "Erw.",
    membersShort: "Mitgl.",
    childrenShort: "Kinder",
    pupilsShort: "Schüler",
    teachersShort: "Lehrer",
  },
  en: {
    steps: ["Dates", "Guests & options", "Contact", "Summary"],
    s0H: "When?",
    s1H: "Who's coming?",
    s1Pauschalen: "Flat-rates",
    s2H: "Your details",
    s3H: "Summary",
    rangeBlocked: "At least one day in this range is already booked — please pick another range.",
    arrival: "Arrival",
    departure: "Departure",
    purpose: "Purpose *",
    purposePlaceholder: "Please choose …",
    purposeOpts: {
      familie: "Family holiday",
      klasse: "School class trip",
      schul: "School / university trip",
      verein: "Club / group trip",
      firma: "Company / team event",
      privat: "Private party",
      sonstiges: "Other",
    },
    privateSubLabel: "Type of private party *",
    privateSubPlaceholder: "Please choose …",
    privateSubOpts: {
      jga: "Bachelor/ette party (JGA)",
      geburtstag: "Big-number birthday",
      hochzeit: "Wedding / pre-wedding",
      sonstiges: "Other private party",
    },
    privateReasonLabel: "Short description *",
    privateReasonPlaceholder: "What is it exactly? Who's coming? Approx. group size / programme?",
    privateReasonHint: "Private parties are briefly reviewed by the board. Just 1–2 sentences.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone *",
    company: "Company / club",
    street: "Street",
    zip: "ZIP",
    city: "City",
    msg: "Message (optional)",
    msgHint: "Special requests, questions, planned arrival time ...",
    accept: "I have read and accept the",
    acceptAgb: "terms",
    acceptPrivacy: "privacy policy",
    acceptHausordnung: "house rules",
    acceptEnd: ".",
    andWord: "and",
    hausordnungWarnTitle: "Important house rules",
    hausordnungWarnBody: "Quiet hours from 10 PM (also outside) · no pets · no food in bedrooms · indoor shoes only · separate waste + take residual waste with you · leave the cabin broom-clean. Violations may be deducted from the deposit.",
    discountH: "Voucher code (optional)",
    discountApply: "Apply",
    discountChecking: "Checking …",
    discountRemove: "Remove",
    discountPlaceholder: "e.g. WH-A1B2-C3D4",
    discountAppliedPre: "Code",
    discountAppliedPost: "applied",
    dueToday: "Due today:",
    deposit: "Deposit",
    bookingTotalAfter: "50 % of booking total",
    afterDiscount: "after discount",
    kaution: "Damage deposit",
    restzahlung: "Remaining amount of",
    restzahlungBody: "will be charged before arrival via a separate payment request. The damage deposit is refunded within 14 days of a clean departure.",
    kurtaxeNote: "Note: Since May 2026 the Hochsauerland tourist tax is settled separately via the official portal — you'll receive a dedicated email with the link after booking.",
    stornoH: "Cancellation policy",
    stornoToday: (d: number, p: number) => `If cancelled today (${d} days before arrival): ${p}% refund`,
    stornoTodayNoDays: (p: number) => `If cancelled today: ${p}% refund`,
    stornoVerfaellt: "— booking forfeits.",
    stornoBody: "Full cancellation tiers (counted backwards from arrival):",
    stornoRefund: "refund",
    stornoNote: "The damage deposit is always refunded in full (provided no damage). Cancellations must be made in writing.",
    next: "Next",
    back: "Back",
    overview: "Summary",
    payNow: "Pay now",
    redirecting: "Redirecting ...",
    personsRange: (n: number, min: number, max: number) => `${n} of ${min}–${max} guests.`,
    endreinigungTitle: "Final cleaning — 190.00 € (mandatory)",
    endreinigungBody: "We carry out the final cleaning ourselves — it is included in every booking.",
    soloTitle: "Exclusive use — 50.00 €",
    soloBody: "Surcharge for sole use of the hut.",
    whoBooks: "Who's booking?",
    ctPrivat: "Private",
    ctMitglied: "Club member",
    ctVerein: "Club / school",
    ctFirma: "Company",
    loginHint1: "💡 Already have an account?",
    loginHintLink: "Log in here",
    loginHint2: "— or continue booking; we'll create an account for you automatically.",
    adultsLabel: "Adults (non-members)",
    adultsHint: "16+ · 18.00 € / night",
    membersLabel: "Adult club members",
    membersHint: "7.50 € / night",
    childrenLabel: "Children (4–15 years)",
    childrenHint: "10.00 € / night",
    pupilsLabel: "Pupils (school groups)",
    pupilsHint: "7.50 € / night",
    teachersLabel: "Teachers",
    teachersHint: "for school groups · counted as adults",
    memberLockedLabel: "Adult club members",
    memberLockedHintPre: "Only for verified Skifreunde members.",
    memberLockedLogin: "Log in",
    memberLockedOr: "or apply for membership in your",
    memberLockedProfile: "account profile",
    memberLockedEnd: ".",
    memberLockedState: "locked",
    ariaLess: "Less",
    ariaMore: "More",
    priceSummaryH: "Price summary",
    priceSummaryEmpty: "Pick dates and guests to see prices.",
    nightsLabel: "nights",
    personsLabel: "guests",
    bookingSum: "Booking total",
    dueTodayShort: "Due today",
    prepayment50: "Deposit 50 %",
    plusKaution: "+ Damage deposit",
    todayToPay: "Due today",
    remainderBefore: "Remaining amount (before arrival)",
    kurtaxeShort: "Tourist tax is settled separately via the Hochsauerland portal.",
    zeitraum: "Period",
    bucher: "Booker",
    totalSuffix: "total",
    adultsShort: "adults",
    membersShort: "members",
    childrenShort: "children",
    pupilsShort: "pupils",
    teachersShort: "teachers",
  },
  nl: {
    steps: ["Periode", "Personen & opties", "Contact", "Overzicht"],
    s0H: "Wanneer?",
    s1H: "Wie komt er?",
    s1Pauschalen: "Pakketten",
    s2H: "Jullie gegevens",
    s3H: "Overzicht",
    rangeBlocked: "Minstens één dag in deze periode is al geboekt — kies een andere periode.",
    arrival: "Aankomst",
    departure: "Vertrek",
    purpose: "Aanleiding *",
    purposePlaceholder: "Maak een keuze …",
    purposeOpts: {
      familie: "Familievakantie",
      klasse: "Schoolreis",
      schul: "School- / studiereis",
      verein: "Verenigings- / groepsreis",
      firma: "Bedrijf / team-event",
      privat: "Privéfeest",
      sonstiges: "Anders",
    },
    privateSubLabel: "Soort privéfeest *",
    privateSubPlaceholder: "Maak een keuze …",
    privateSubOpts: {
      jga: "Vrijgezellenfeest (JGA)",
      geburtstag: "Mijlpaal-verjaardag",
      hochzeit: "Bruiloft / vooravond",
      sonstiges: "Ander privéfeest",
    },
    privateReasonLabel: "Korte beschrijving *",
    privateReasonPlaceholder: "Waar gaat het precies om? Wie komen er? Groepsgrootte / programma?",
    privateReasonHint: "Privéfeesten worden kort door het bestuur beoordeeld. 1–2 zinnen volstaan.",
    firstName: "Voornaam",
    lastName: "Achternaam",
    email: "E-mail",
    phone: "Telefoon *",
    company: "Bedrijf / vereniging",
    street: "Straat",
    zip: "Postcode",
    city: "Plaats",
    msg: "Bericht (optioneel)",
    msgHint: "Bijzondere wensen, vragen, geplande aankomsttijd ...",
    accept: "Ik heb",
    acceptAgb: "de voorwaarden",
    acceptPrivacy: "het privacybeleid",
    acceptHausordnung: "de huisregels",
    acceptEnd: "gelezen en aanvaard.",
    andWord: "en",
    hausordnungWarnTitle: "Belangrijke gebruiksregels",
    hausordnungWarnBody: "Vanaf 22:00 nachtrust (ook buiten) · geen huisdieren · geen voedsel in slaapkamers · binnen pantoffels · afval scheiden + restafval meenemen · hut bezemschoon achterlaten. Overtredingen kunnen op de borg worden ingehouden.",
    discountH: "Vouchercode (optioneel)",
    discountApply: "Toepassen",
    discountChecking: "Controleren …",
    discountRemove: "Verwijderen",
    discountPlaceholder: "bv. WH-A1B2-C3D4",
    discountAppliedPre: "Code",
    discountAppliedPost: "toegepast",
    dueToday: "Vandaag te betalen:",
    deposit: "Aanbetaling",
    bookingTotalAfter: "50 % van de boekingssom",
    afterDiscount: "na korting",
    kaution: "Borg",
    restzahlung: "Restbedrag van",
    restzahlungBody: "wordt vóór aankomst geïncasseerd via een apart betaalverzoek. De borg wordt binnen 14 dagen na schadevrije afreis terugbetaald.",
    kurtaxeNote: "Let op: Sinds mei 2026 wordt de toeristenbelasting Hochsauerland apart afgerekend via het officiële portaal — je ontvangt na de boeking een aparte e-mail met de link.",
    stornoH: "Annuleringsregeling",
    stornoToday: (d: number, p: number) => `Bij annulering vandaag (${d} dagen vóór aankomst): ${p}% terugbetaling`,
    stornoTodayNoDays: (p: number) => `Bij annulering vandaag: ${p}% terugbetaling`,
    stornoVerfaellt: "— boeking vervalt.",
    stornoBody: "Volledige annuleringsstaffel (gerekend terug vanaf aankomst):",
    stornoRefund: "terugbetaling",
    stornoNote: "De borg wordt altijd volledig terugbetaald (mits geen schade). Annuleringen moeten schriftelijk gebeuren.",
    next: "Volgende",
    back: "Terug",
    overview: "Overzicht",
    payNow: "Nu betalen",
    redirecting: "Doorsturen ...",
    personsRange: (n: number, min: number, max: number) => `${n} van ${min}–${max} personen.`,
    endreinigungTitle: "Eindschoonmaak — € 190,00 (verplicht)",
    endreinigungBody: "De eindschoonmaak doen wij zelf — die zit in elke boeking inbegrepen.",
    soloTitle: "Exclusief gebruik — € 50,00",
    soloBody: "Toeslag voor exclusief gebruik van de hut.",
    whoBooks: "Wie boekt?",
    ctPrivat: "Privé",
    ctMitglied: "Verenigingslid",
    ctVerein: "Vereniging / school",
    ctFirma: "Bedrijf",
    loginHint1: "💡 Heb je al een account?",
    loginHintLink: "Hier inloggen",
    loginHint2: "— of ga door met boeken, we maken automatisch een account voor je aan.",
    adultsLabel: "Volwassenen (geen lid)",
    adultsHint: "vanaf 16 jaar · € 18,00 / nacht",
    membersLabel: "Volwassen verenigingsleden",
    membersHint: "€ 7,50 / nacht",
    childrenLabel: "Kinderen (4–15 jaar)",
    childrenHint: "€ 10,00 / nacht",
    pupilsLabel: "Leerlingen (schoolgroepen)",
    pupilsHint: "€ 7,50 / nacht",
    teachersLabel: "Docenten",
    teachersHint: "bij schoolgroepen · tellen als volwassenen",
    memberLockedLabel: "Volwassen verenigingsleden",
    memberLockedHintPre: "Alleen voor geverifieerde Skifreunde-leden.",
    memberLockedLogin: "Inloggen",
    memberLockedOr: "of vraag lidmaatschap aan in je",
    memberLockedProfile: "accountprofiel",
    memberLockedEnd: ".",
    memberLockedState: "geblokkeerd",
    ariaLess: "Minder",
    ariaMore: "Meer",
    priceSummaryH: "Prijsoverzicht",
    priceSummaryEmpty: "Kies datum en personen om de prijzen te zien.",
    nightsLabel: "nachten",
    personsLabel: "personen",
    bookingSum: "Boekingssom",
    dueTodayShort: "Vandaag te betalen",
    prepayment50: "Aanbetaling 50 %",
    plusKaution: "+ Borg",
    todayToPay: "Vandaag te betalen",
    remainderBefore: "Restbedrag (vóór aankomst)",
    kurtaxeShort: "Toeristenbelasting wordt apart afgerekend via het Hochsauerland-portaal.",
    zeitraum: "Periode",
    bucher: "Boeker",
    totalSuffix: "totaal",
    adultsShort: "volw.",
    membersShort: "leden",
    childrenShort: "kinderen",
    pupilsShort: "leerl.",
    teachersShort: "docenten",
  },
} as const;

type BfCopy = (typeof BF_COPY)[keyof typeof BF_COPY];

export const BookingFlow = ({
  bookedDates,
  cleaningDates,
  wartungDates,
  prefill,
  repeatHint,
  locale = "de",
}: BookingFlowProps) => {
  const tt = BF_COPY[locale];
  // Internal: union of all unavailable days for the rangeBlocked guard.
  const blockedDates = [...bookedDates, ...cleaningDates, ...wartungDates];
  const [step, setStep] = useState<Step>(0);
  const [arrival, setArrival] = useState(repeatHint?.arrival ?? "");
  const [departure, setDeparture] = useState(repeatHint?.departure ?? "");
  const [persons, setPersons] = useState<Persons>(
    repeatHint
      ? {
          adults: repeatHint.adults,
          members: repeatHint.members,
          children: repeatHint.children,
          pupils: repeatHint.pupils,
          teachers: repeatHint.teachers,
        }
      : emptyPersons
  );
  const [soloUse, setSoloUse] = useState(repeatHint?.soloUse ?? false);
  // Anlass — Pflicht-Dropdown. Bei "privat" werden Subtyp + freier Grund erforderlich.
  const [purposeCategory, setPurposeCategory] = useState<PurposeKey | "">("");
  const [purposeSubtype, setPurposeSubtype] = useState<PrivateSubKey | "">("");
  const [purposeReason, setPurposeReason] = useState("");

  const [customerType, setCustomerType] = useState<"privat" | "mitglied" | "verein" | "firma">(
    prefill?.customerType ?? "privat"
  );
  const [firstName, setFirstName] = useState(prefill?.firstName ?? "");
  const [lastName, setLastName] = useState(prefill?.lastName ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [company, setCompany] = useState("");
  const [street, setStreet] = useState(prefill?.street ?? "");
  const [zip, setZip] = useState(prefill?.zip ?? "");
  const [city, setCity] = useState(prefill?.city ?? "");
  const [customerMessage, setCustomerMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Discount-Code (Loyalty / Manager / Promo)
  const [discountCode, setDiscountCode] = useState("");
  const [discountState, setDiscountState] = useState<
    | { status: "idle" }
    | { status: "checking" }
    | { status: "valid"; code: string; discountCents: number }
    | { status: "invalid"; error: string }
  >({ status: "idle" });

  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const totalPersons =
    persons.adults +
    persons.members +
    persons.children +
    persons.pupils +
    persons.teachers;

  const datesValid =
    !!arrival &&
    !!departure &&
    new Date(departure) > new Date(arrival) &&
    Math.round(
      (new Date(departure).getTime() - new Date(arrival).getTime()) /
        (1000 * 60 * 60 * 24)
    ) >= RULES.minNights;

  const personsValid =
    totalPersons >= RULES.minPersons && totalPersons <= RULES.maxPersons;

  const breakdown = useMemo(() => {
    if (!datesValid || !personsValid) return null;
    return calculatePrice({
      arrival,
      departure,
      persons,
      soloUse,
      locale,
    });
  }, [arrival, departure, persons, soloUse, datesValid, personsValid, locale]);

  const rangeBlocked = useMemo(() => {
    if (!datesValid) return false;
    const cur = new Date(arrival);
    const end = new Date(departure);
    while (cur < end) {
      if (blockedSet.has(cur.toISOString().slice(0, 10))) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }, [arrival, departure, datesValid, blockedSet]);

  const canGoStep1 = datesValid && personsValid && !rangeBlocked;
  // Step 2: Anlass ist Pflicht; bei "privat" zusaetzlich Subtyp + min. 20-Zeichen-Grund.
  const purposeValid =
    !!purposeCategory &&
    (purposeCategory !== "privat" ||
      (!!purposeSubtype && purposeReason.trim().length >= 20));
  const canGoStep2 = breakdown !== null && purposeValid;
  const canGoStep3 =
    firstName.trim() &&
    lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone.trim().length >= 5 &&
    acceptedTerms;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createBookingAndCheckout({
        arrival,
        departure,
        persons,
        soloUse,
        customerType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim() || null,
        street: street.trim() || null,
        zip: zip.trim() || null,
        city: city.trim() || null,
        purpose: composePurpose(purposeCategory, purposeSubtype, purposeReason, tt) ?? "",
        purposeCategory: (purposeCategory || undefined) as PurposeKey | undefined,
        purposeSubtypeLabel:
          purposeCategory === "privat" && purposeSubtype ? tt.privateSubOpts[purposeSubtype] : null,
        purposeReason: purposeCategory === "privat" ? purposeReason.trim() || null : null,
        customerMessage: customerMessage.trim() || null,
        discountCode:
          discountState.status === "valid" ? discountState.code : discountCode.trim() || null,
        acceptedTerms: true,
        locale,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Phase B: Bei Private Feier landet die Buchung erst in der Vorstands-
      // Prüfung — kein Stripe-Redirect.
      if ("requiresReview" in res && res.requiresReview) {
        window.location.href = `/buchen/pruefung?b=${encodeURIComponent(res.bookingNumber)}`;
        return;
      }
      if ("checkoutUrl" in res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 max-w-full min-w-0">
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-3 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
        <Stepper step={step} labels={tt.steps} />

        {step === 0 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.s0H}</h3>

            <AvailabilityCalendar
              bookedDates={bookedDates}
              cleaningDates={cleaningDates}
              wartungDates={wartungDates}
              arrival={arrival}
              departure={departure}
              onSelect={(a, d) => {
                setArrival(a);
                setDeparture(d);
              }}
              locale={locale}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="arrival"
                label={tt.arrival}
                type="date"
                min={todayIso()}
                value={arrival}
                onChange={(e) => {
                  setArrival(e.target.value);
                  if (departure && new Date(departure) <= new Date(e.target.value)) {
                    setDeparture(addDaysIso(e.target.value, 2));
                  }
                }}
              />
              <Input
                id="departure"
                label={tt.departure}
                type="date"
                min={arrival ? addDaysIso(arrival, RULES.minNights) : todayIso()}
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
              />
            </div>
            {rangeBlocked && (
              <div className="text-[var(--color-wh-sunset)] text-sm font-semibold">
                {tt.rangeBlocked}
              </div>
            )}

            <h3 className="text-[22px] sm:text-[24px] mt-12 mb-0">{tt.s1H}</h3>
            <PersonsEditor
              persons={persons}
              onChange={setPersons}
              memberAllowed={!!prefill?.membershipVerified}
              tt={tt}
            />
            <div
              className={`text-sm ${
                personsValid ? "text-[var(--color-wh-fg-muted)]" : "text-[var(--color-wh-sunset)]"
              }`}
            >
              {tt.personsRange(totalPersons, RULES.minPersons, RULES.maxPersons)}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                disabled={!canGoStep1}
                onClick={() => setStep(1)}
                iconRight={<ArrowRight size={18} />}
              >
                {tt.next}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.s1Pauschalen}</h3>
            <div className="bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-card)] p-5">
              <div className="font-semibold text-[var(--color-wh-deep-green)]">
                {tt.endreinigungTitle}
              </div>
              <div className="text-sm text-[var(--color-wh-fg-muted)] mt-1">
                {tt.endreinigungBody}
              </div>
            </div>

            <ExtraToggle
              checked={soloUse}
              onChange={setSoloUse}
              title={tt.soloTitle}
              body={tt.soloBody}
            />

            <Select
              id="purpose"
              label={tt.purpose}
              placeholder={tt.purposePlaceholder}
              value={purposeCategory}
              onChange={(e) => {
                const v = e.target.value as PurposeKey;
                setPurposeCategory(v);
                // Felder leeren wenn nicht mehr "privat"
                if (v !== "privat") {
                  setPurposeSubtype("");
                  setPurposeReason("");
                }
              }}
              required
              options={PURPOSE_KEYS.map((k) => ({ value: k, label: tt.purposeOpts[k] }))}
            />

            {purposeCategory === "privat" && (
              <>
                <Select
                  id="privateSub"
                  label={tt.privateSubLabel}
                  placeholder={tt.privateSubPlaceholder}
                  value={purposeSubtype}
                  onChange={(e) => setPurposeSubtype(e.target.value as PrivateSubKey)}
                  required
                  options={PRIVATE_SUB_KEYS.map((k) => ({ value: k, label: tt.privateSubOpts[k] }))}
                />
                <Textarea
                  id="privateReason"
                  label={tt.privateReasonLabel}
                  placeholder={tt.privateReasonPlaceholder}
                  hint={tt.privateReasonHint}
                  value={purposeReason}
                  onChange={(e) => setPurposeReason(e.target.value)}
                  required
                  minLength={20}
                />
              </>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(0)}
                iconLeft={<ArrowLeft size={18} />}
              >
                {tt.back}
              </Button>
              <Button
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
                iconRight={<ArrowRight size={18} />}
              >
                {tt.next}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.s2H}</h3>

            <div>
              <SegmentedControl
                label={tt.whoBooks}
                value={customerType}
                options={[
                  { value: "privat", label: tt.ctPrivat },
                  ...(prefill?.membershipVerified
                    ? [{ value: "mitglied", label: tt.ctMitglied }]
                    : []),
                  { value: "verein", label: tt.ctVerein },
                  { value: "firma", label: tt.ctFirma },
                ]}
                onChange={(v) => setCustomerType(v as typeof customerType)}
              />
              {!prefill?.loggedIn && (
                <p className="text-xs text-[var(--color-wh-fg-muted)] mt-2">
                  {tt.loginHint1}{" "}
                  <a href="/login?callbackUrl=/buchen" className="underline">
                    {tt.loginHintLink}
                  </a>
                  {" "}{tt.loginHint2}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="firstName" label={tt.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <Input id="lastName" label={tt.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              <Input id="email" type="email" label={tt.email} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input id="phone" type="tel" label={tt.phone} value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={5} />
              {customerType === "firma" || customerType === "verein" ? (
                <Input id="company" label={tt.company} value={company} onChange={(e) => setCompany(e.target.value)} />
              ) : null}
              <Input id="street" label={tt.street} value={street} onChange={(e) => setStreet(e.target.value)} />
              <Input id="zip" label={tt.zip} value={zip} onChange={(e) => setZip(e.target.value)} />
              <Input id="city" label={tt.city} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <Textarea
              id="msg"
              label={tt.msg}
              hint={tt.msgHint}
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
            />

            {/* Prominenter Hinweis auf die Nutzungsregeln — bewusst auffaellig,
                weil Verstoesse (Nachtruhe etc.) wiederholt zu Konflikten fuehrten. */}
            <div
              role="note"
              className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-beige)] px-4 py-3"
            >
              <p className="m-0 text-sm font-semibold text-[var(--color-wh-sunset)] uppercase tracking-wider">
                ⚠ {tt.hausordnungWarnTitle}
              </p>
              <p className="m-0 mt-1 text-[14px] leading-relaxed text-[var(--color-wh-black)]">
                {tt.hausordnungWarnBody}
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-[var(--color-wh-fg-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <span>
                {tt.accept}{" "}
                <a href="/agb" target="_blank" rel="noreferrer">
                  {tt.acceptAgb}
                </a>
                ,{" "}
                <a href="/datenschutz" target="_blank" rel="noreferrer">
                  {tt.acceptPrivacy}
                </a>{" "}
                {tt.andWord}{" "}
                <a href="/hausordnung" target="_blank" rel="noreferrer">
                  {tt.acceptHausordnung}
                </a>{" "}
                {tt.acceptEnd}
              </span>
            </label>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                iconLeft={<ArrowLeft size={18} />}
              >
                {tt.back}
              </Button>
              <Button
                disabled={!canGoStep3}
                onClick={() => setStep(3)}
                iconRight={<ArrowRight size={18} />}
              >
                {tt.overview}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && breakdown && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.s3H}</h3>
            <ReviewBlock
              arrival={arrival}
              departure={departure}
              nights={breakdown.nights}
              persons={persons}
              firstName={firstName}
              lastName={lastName}
              email={email}
              tt={tt}
            />

            {/* Discount-Code */}
            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-wh-deep-green)] m-0 mb-2">
                {tt.discountH}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    setDiscountState({ status: "idle" });
                  }}
                  placeholder={tt.discountPlaceholder}
                  disabled={discountState.status === "valid"}
                  className="flex-1 rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm font-mono uppercase tracking-wider disabled:bg-[var(--color-wh-beige)] disabled:opacity-70"
                />
                {discountState.status !== "valid" ? (
                  <button
                    type="button"
                    disabled={!discountCode.trim() || discountState.status === "checking"}
                    onClick={async () => {
                      setDiscountState({ status: "checking" });
                      const res = await previewDiscountAction(
                        discountCode.trim(),
                        breakdown.subtotalCents
                      );
                      if (res.ok) {
                        setDiscountState({
                          status: "valid",
                          code: res.code,
                          discountCents: res.discountCents,
                        });
                      } else {
                        setDiscountState({ status: "invalid", error: res.error });
                      }
                    }}
                    className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {discountState.status === "checking" ? tt.discountChecking : tt.discountApply}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountCode("");
                      setDiscountState({ status: "idle" });
                    }}
                    className="rounded-full border border-[var(--color-wh-winter-grey)] px-4 py-2 text-sm"
                  >
                    {tt.discountRemove}
                  </button>
                )}
              </div>
              {discountState.status === "valid" && (
                <p className="text-sm text-emerald-700 mt-2 m-0">
                  ✓ {tt.discountAppliedPre} <span className="font-mono">{discountState.code}</span> {tt.discountAppliedPost} —{" "}
                  <strong>−{formatEuro(discountState.discountCents, locale)}</strong>
                </p>
              )}
              {discountState.status === "invalid" && (
                <p className="text-sm text-red-700 mt-2 m-0">{discountState.error}</p>
              )}
            </div>

            {(() => {
              const off =
                discountState.status === "valid" ? discountState.discountCents : 0;
              const subAfter = breakdown.subtotalCents - off;
              const prepayAfter = Math.round((subAfter * 50) / 100);
              const remainAfter = subAfter - prepayAfter;
              const totalDueAfter = prepayAfter + breakdown.depositCents;
              return (
                <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 text-sm text-[var(--color-wh-black)]">
                  <p className="m-0 font-semibold mb-2">{tt.dueToday}</p>
                  <p className="m-0">
                    <strong>{formatEuro(prepayAfter, locale)}</strong> {tt.deposit} ({tt.bookingTotalAfter}
                    {off > 0 ? ` ${tt.afterDiscount}` : ""}) +{" "}
                    <strong>{formatEuro(breakdown.depositCents, locale)}</strong> {tt.kaution} ={" "}
                    <strong>{formatEuro(totalDueAfter, locale)}</strong>
                  </p>
                  <p className="m-0 mt-3">
                    {tt.restzahlung} <strong>{formatEuro(remainAfter, locale)}</strong> {tt.restzahlungBody}
                  </p>
                  <p className="m-0 mt-3 text-[var(--color-wh-fg-muted)]">
                    {tt.kurtaxeNote}
                  </p>
                </div>
              );
            })()}

            {/* Storno-Regelwerk klar im UI */}
            <CancellationPolicyBox arrival={arrival} tt={tt} locale={locale} />
            {error && (
              <div className="bg-[var(--color-wh-sunset)]/10 text-[var(--color-wh-sunset)] rounded-[var(--radius-md)] p-4 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                iconLeft={<ArrowLeft size={18} />}
              >
                {tt.back}
              </Button>
              <Button
                size="lg"
                onClick={submit}
                disabled={submitting}
                iconRight={
                  submitting ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />
                }
              >
                {(() => {
                  const off =
                    discountState.status === "valid" ? discountState.discountCents : 0;
                  const subAfter = breakdown.subtotalCents - off;
                  const totalDueAfter =
                    Math.round((subAfter * 50) / 100) + breakdown.depositCents;
                  return submitting
                    ? tt.redirecting
                    : `${tt.payNow} — ${formatEuro(totalDueAfter, locale)}`;
                })()}
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 self-start order-first lg:order-last">
        <PriceSummary
          breakdown={breakdown}
          arrival={arrival}
          departure={departure}
          totalPersons={totalPersons}
          tt={tt}
          locale={locale}
        />
      </aside>
    </div>
  );
};

const Stepper = ({ step, labels }: { step: Step; labels: readonly string[] }) => {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto pb-2">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold ${
              i <= step
                ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
                : "bg-[var(--color-wh-winter-grey)] text-[var(--color-wh-fg-muted)]"
            }`}
          >
            {i < step ? <Check size={14} /> : i + 1}
          </span>
          <span
            className={`whitespace-nowrap ${
              i <= step ? "font-semibold text-[var(--color-wh-deep-green)]" : "text-[var(--color-wh-fg-muted)]"
            }`}
          >
            {l}
          </span>
          {i < labels.length - 1 && (
            <span className="hidden sm:inline-block w-6 h-px bg-[var(--color-wh-winter-grey)]" />
          )}
        </div>
      ))}
    </div>
  );
};

const PersonRow = ({
  label,
  hint,
  value,
  onChange,
  ariaLess,
  ariaMore,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  ariaLess: string;
  ariaMore: string;
}) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--color-wh-winter-grey)] last:border-b-0">
    <div className="min-w-0">
      <div className="font-medium text-sm sm:text-base">{label}</div>
      {hint && <div className="text-xs text-[var(--color-wh-fg-muted)]">{hint}</div>}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer text-lg font-semibold"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label={ariaLess}
      >
        −
      </button>
      <span className="w-8 text-center font-semibold">{value}</span>
      <button
        type="button"
        className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer text-lg font-semibold"
        onClick={() => onChange(value + 1)}
        aria-label={ariaMore}
      >
        +
      </button>
    </div>
  </div>
);

const PersonsEditor = ({
  persons,
  onChange,
  memberAllowed,
  tt,
}: {
  persons: Persons;
  onChange: (p: Persons) => void;
  memberAllowed: boolean;
  tt: BfCopy;
}) => (
  <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4">
    <PersonRow
      label={tt.adultsLabel}
      hint={tt.adultsHint}
      value={persons.adults}
      onChange={(v) => onChange({ ...persons, adults: v })}
      ariaLess={tt.ariaLess}
      ariaMore={tt.ariaMore}
    />
    {memberAllowed ? (
      <PersonRow
        label={tt.membersLabel}
        hint={tt.membersHint}
        value={persons.members}
        onChange={(v) => onChange({ ...persons, members: v })}
        ariaLess={tt.ariaLess}
        ariaMore={tt.ariaMore}
      />
    ) : (
      <div className="border-b border-[var(--color-wh-winter-grey)]/50 py-3 flex items-center justify-between gap-4 text-sm">
        <div>
          <div className="font-medium text-[var(--color-wh-fg-muted)]">
            {tt.memberLockedLabel}
          </div>
          <div className="text-xs text-[var(--color-wh-fg-muted)]/80">
            {tt.memberLockedHintPre}{" "}
            <a href="/login?callbackUrl=/buchen" className="underline">
              {tt.memberLockedLogin}
            </a>{" "}
            {tt.memberLockedOr}{" "}
            <a href="/registrieren" className="underline">
              {tt.memberLockedProfile}
            </a>
            {tt.memberLockedEnd}
          </div>
        </div>
        <div className="text-[var(--color-wh-fg-muted)]/60 text-sm shrink-0">{tt.memberLockedState}</div>
      </div>
    )}
    <PersonRow
      label={tt.childrenLabel}
      hint={tt.childrenHint}
      value={persons.children}
      onChange={(v) => onChange({ ...persons, children: v })}
      ariaLess={tt.ariaLess}
      ariaMore={tt.ariaMore}
    />
    <PersonRow
      label={tt.pupilsLabel}
      hint={tt.pupilsHint}
      value={persons.pupils}
      onChange={(v) => onChange({ ...persons, pupils: v })}
      ariaLess={tt.ariaLess}
      ariaMore={tt.ariaMore}
    />
    <PersonRow
      label={tt.teachersLabel}
      hint={tt.teachersHint}
      value={persons.teachers}
      onChange={(v) => onChange({ ...persons, teachers: v })}
      ariaLess={tt.ariaLess}
      ariaMore={tt.ariaMore}
    />
  </div>
);

const ExtraToggle = ({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
}) => (
  <label className="flex items-start gap-3 p-4 border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] cursor-pointer hover:border-[var(--color-wh-deep-green)] transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-5 h-5 accent-[var(--color-wh-deep-green)]"
    />
    <div>
      <div className="font-semibold text-[var(--color-wh-deep-green)]">{title}</div>
      <div className="text-sm text-[var(--color-wh-fg-muted)] mt-1">{body}</div>
    </div>
  </label>
);

const SegmentedControl = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm font-medium text-[var(--color-wh-deep-green)]">{label}</span>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-11 px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer transition-colors ${
            value === o.value
              ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
              : "bg-white border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

type Breakdown = ReturnType<typeof calculatePrice>;

const PriceSummary = ({
  breakdown,
  arrival,
  departure,
  totalPersons,
  tt,
  locale,
}: {
  breakdown: Breakdown | null;
  arrival: string;
  departure: string;
  totalPersons: number;
  tt: BfCopy;
  locale: "de" | "en" | "nl";
}) => {
  if (!breakdown) {
    return (
      <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 sm:p-6">
        <div className="eyebrow">{tt.priceSummaryH}</div>
        <p className="mt-3 text-[var(--color-wh-fg-muted)] text-sm m-0">
          {tt.priceSummaryEmpty}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 sm:p-6">
      <div className="eyebrow">{tt.priceSummaryH}</div>
      <div className="mt-3 text-sm font-semibold">
        {arrival} → {departure} · {breakdown.nights} {tt.nightsLabel} · {totalPersons} {tt.personsLabel}
      </div>
      <ul className="mt-5 divide-y divide-[var(--color-wh-winter-grey)]">
        {breakdown.lines.map((l) => (
          <li key={l.label + (l.detail ?? "")} className="py-2 flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium">{l.label}</div>
              {l.detail && <div className="text-xs text-[var(--color-wh-fg-muted)]">{l.detail}</div>}
            </div>
            <div className="font-semibold whitespace-nowrap">{formatEuro(l.totalCents, locale)}</div>
          </li>
        ))}
      </ul>

      <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>{tt.bookingSum}</span>
          <span className="font-semibold">{formatEuro(breakdown.subtotalCents, locale)}</span>
        </div>
      </div>

      <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-2 text-sm">
        <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
          {tt.dueTodayShort}
        </div>
        <div className="flex justify-between">
          <span>{tt.prepayment50}</span>
          <span className="font-semibold">{formatEuro(breakdown.prepaymentCents, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span>{tt.plusKaution}</span>
          <span className="font-semibold">{formatEuro(breakdown.depositCents, locale)}</span>
        </div>
        <div className="flex justify-between text-base pt-2 border-t border-[var(--color-wh-winter-grey)]">
          <span className="font-bold">{tt.todayToPay}</span>
          <span className="font-bold text-[var(--color-wh-deep-green)]">
            {formatEuro(breakdown.totalDueCents, locale)}
          </span>
        </div>
      </div>

      <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-1 text-xs text-[var(--color-wh-fg-muted)]">
        <div className="flex justify-between">
          <span>{tt.remainderBefore}</span>
          <span>{formatEuro(breakdown.remainderCents, locale)}</span>
        </div>
        <div>{tt.kurtaxeShort}</div>
      </div>
    </div>
  );
};

const ReviewBlock = ({
  arrival,
  departure,
  nights,
  persons,
  firstName,
  lastName,
  email,
  tt,
}: {
  arrival: string;
  departure: string;
  nights: number;
  persons: Persons;
  firstName: string;
  lastName: string;
  email: string;
  tt: BfCopy;
}) => (
  <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">{tt.zeitraum}</div>
      <div className="font-semibold">
        {arrival} → {departure}
      </div>
      <div className="text-[var(--color-wh-fg-muted)]">{nights} {tt.nightsLabel}</div>
    </div>
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">{tt.personsLabel}</div>
      <div className="font-semibold">
        {persons.adults + persons.members + persons.children + persons.pupils + persons.teachers}{" "}
        {tt.totalSuffix}
      </div>
      <div className="text-[var(--color-wh-fg-muted)]">
        {[
          persons.adults && `${persons.adults} ${tt.adultsShort}`,
          persons.members && `${persons.members} ${tt.membersShort}`,
          persons.children && `${persons.children} ${tt.childrenShort}`,
          persons.pupils && `${persons.pupils} ${tt.pupilsShort}`,
          persons.teachers && `${persons.teachers} ${tt.teachersShort}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </div>
    <div className="sm:col-span-2 pt-3 border-t border-[var(--color-wh-winter-grey)]">
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">{tt.bucher}</div>
      <div className="font-semibold">
        {firstName} {lastName}
      </div>
      <div className="text-[var(--color-wh-fg-muted)]">{email}</div>
    </div>
  </div>
);

const CancellationPolicyBox = ({
  arrival,
  tt,
  locale,
}: {
  arrival: string;
  tt: BfCopy;
  locale: "de" | "en" | "nl";
}) => {
  if (!arrival) return null;
  const days = daysUntil(arrival);
  const currentTier = getCancellationTier(days);
  const localizedTiers = getCancellationTiers(locale);
  return (
    <details className="group bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 text-sm">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-1">
            {tt.stornoH}
          </div>
          <p className="m-0 text-[var(--color-wh-black)]">
            {days >= 0
              ? tt.stornoToday(days, currentTier.refundPercent)
              : tt.stornoTodayNoDays(currentTier.refundPercent)}{" "}
            {currentTier.refundPercent === 0 && tt.stornoVerfaellt}
          </p>
        </div>
        <span className="text-[var(--color-wh-deep-green)] text-xl group-open:rotate-45 transition-transform shrink-0">+</span>
      </summary>
      <div className="mt-4 pt-4 border-t border-[var(--color-wh-winter-grey)]/40">
        <p className="text-[var(--color-wh-fg-muted)] m-0 mb-3 text-xs">
          {tt.stornoBody}
        </p>
        <ul className="list-none p-0 m-0 space-y-2">
          {localizedTiers.map((tier, i) => {
            const isCurrent = tier.daysBeforeArrival === currentTier.daysBeforeArrival;
            return (
              <li
                key={i}
                className={`flex justify-between gap-3 p-2.5 rounded-md ${
                  isCurrent
                    ? "bg-[var(--color-wh-beige)] font-semibold"
                    : "text-[var(--color-wh-fg-muted)]"
                }`}
              >
                <span>{tier.label}</span>
                <span className="font-mono">{tier.refundPercent} % {tt.stornoRefund}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-[var(--color-wh-fg-muted)] m-0 mt-3 text-xs italic">
          {tt.stornoNote}
        </p>
      </div>
    </details>
  );
};
