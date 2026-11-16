"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { calculatePrice, coversNewYearsEve, formatEuro, minNightsFor, RULES, type Persons } from "@/lib/pricing";
import { toLocalIso, daysUntilLocalDate } from "@/lib/utils";
import { daysUntil, getCancellationTier, getCancellationTiers } from "@/lib/cancellation";
import { createBookingAndCheckout, previewDiscountAction } from "./actions";
import { createManualTransferBooking, type ManualTransferResult } from "./manual-transfer-actions";
import { track } from "@/lib/analytics";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { countMemberKinds, isFullName, type MemberName } from "@/lib/member-names";

// Anlass-Kategorien. Sind Pflicht beim Buchen.
const PURPOSE_KEYS = ["familie", "klasse", "schul", "verein", "firma", "sonstiges"] as const;
type PurposeKey = (typeof PURPOSE_KEYS)[number];
// Im Anlass-Dropdown auswählbar sind ausschließlich diese vier (Reihenfolge wie
// gewünscht): Vereins-, Schul-, Klassen- und Gruppenfahrt. 'familie' fungiert als
// generische „Gruppenfahrt" (Standard-Checkout, keine Institutionspflicht). Die
// übrigen Keys bleiben nur für Bestandsbuchungen/Backend-Kompatibilität im Typ.
const SELECTABLE_PURPOSE_KEYS = ["verein", "schul", "klasse", "familie"] as const;

// Erzeugt aus der Anlass-Kategorie den String fuers DB-Feld `purpose`.
// Locale-Labels kommen aus dem Booking-Flow-Copy ("tt"), damit der Manager
// den lesbaren Anlass sieht.
function composePurpose(
  category: PurposeKey | "",
  tt: { purposeOpts: Record<PurposeKey, string> }
): string | null {
  if (!category) return null;
  return tt.purposeOpts[category];
}

type Step = 0 | 1 | 2 | 3;

const emptyPersons: Persons = {
  adults: 0,
  members: 0,
  children: 0,
  pupils: 0,
  teachers: 0,
};

const todayIso = () => toLocalIso(new Date());

const addDaysIso = (iso: string, days: number) => {
  // iso ist "YYYY-MM-DD" → wird als UTC-Mitternacht geparst. Wir addieren Tage in UTC und formatieren wieder als YYYY-MM-DD aus UTC (kein Lokalzeit-Drift).
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
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
  changeoverDates?: string[];
  prefill?: Prefill;
  repeatHint?: RepeatHint;
  locale?: "de" | "en" | "nl";
};

const BF_COPY = {
  de: {
    steps: ["Zeitraum & Personen", "Anlass", "Kontakt", "Übersicht"],
    s0H: "Wann?",
    paymentMethodNote:
      "Zahlung per Kredit-/Debitkarte (Stripe): Ihr zahlt die Anzahlung jetzt online, die Restzahlung inkl. Kaution und Kurtaxe wird 14 Tage vor Anreise automatisch von derselben Karte abgebucht — ohne dass Ihr Euch noch einmal einloggen müsst. Vereine, Klassenfahrten und Schulfahrten (z. B. AG, SV) können bei Stripe auch per SEPA-Überweisung zahlen; wer stattdessen klassisch auf unser Vereinskonto überweisen möchte, findet diese Option am Ende der Buchung in der Übersicht.",
    s1H: "Wer kommt?",
    s1AnlassH: "Anlass",
    s2H: "Eure Daten",
    s3H: "Übersicht",
    rangeBlocked: "Mindestens ein Tag in diesem Zeitraum ist bereits belegt — bitte einen anderen Zeitraum wählen.",
    arrival: "Anreise",
    departure: "Abreise",
    purpose: "Anlass *",
    purposePlaceholder: "Bitte wählen …",
    purposeOpts: {
      familie: "Gruppenfahrt",
      klasse: "Klassenfahrt",
      schul: "Schulfahrt",
      verein: "Vereinsfahrt",
      firma: "Firmen-/Team-Event",
      sonstiges: "Sonstiges",
    },
    privateReasonLabel: "Kurze Beschreibung *",
    privateReasonPlaceholder: "Worum geht es genau? Wer kommt? Was ist geplant?",
    purposeReasonHintNonPrivate: "Bitte 1–2 Sätze zur Gruppe / dem Anlass — hilft uns, die Buchung richtig einzuordnen.",
    eventLocationWarn: "Partygruppen bitten wir, eine andere Unterkunft zu suchen.",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    phone: "Handynummer *",
    phoneHint: "Für den Hüttenwart: Er stimmt mit Euch die Ankunftszeit ab, auch per SMS.",
    company: "Firma / Verein",
    institution: "Institution / Einrichtung",
    institutionHint: "Name der Schule, des Vereins oder der Firma",
    schoolPayTitle: "Anzahlung erst später — Schulgruppen-Aufschub",
    schoolPayBody:
      "Ihr müsst jetzt nichts zahlen. Wir reservieren den Zeitraum verbindlich. Die Anzahlung (10 %) wird automatisch rund 30 Tage vor Anreise per E-Mail mit Zahlungslink fällig, die Restzahlung inkl. Kaution + Kurtaxe 14 Tage vor Anreise. Wird die Anzahlung nicht fristgerecht (innerhalb von 14 Tagen) beglichen, fällt eine Stornogebühr an und die Buchung wird storniert.",
    schoolSubmit: "Reservierung verbindlich anfragen",
    schoolImmediateNote:
      "Da Eure Anreise weniger als 30 Tage entfernt ist, ist die Anzahlung sofort online zu leisten — ein Zahlungsaufschub ist so kurzfristig nicht möglich.",
    fullPaymentNote:
      "Da die Anreise in weniger als 14 Tagen ist, wird der gesamte Betrag (Miete + Kaution + Kurtaxe) jetzt sofort fällig.",
    fullAmountLabel: "Mietpreis (komplett)",
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
    kurtaxeLabel: "Kurtaxe",
    restzahlung: "Restzahlung von",
    restzahlungBody: "(inkl. Kaution + Kurtaxe) wird 14 Tage vor Anreise automatisch eingezogen — separate Zahlungsaufforderung kommt vorher per Mail. Die Kaution wird innerhalb von 14 Tagen nach mangelfreier Abreise zurückerstattet.",
    kurtaxeNote: "Hinweis: Die Kurtaxe Hochsauerland (2,70 € pro Person ab 16 Jahren und Nacht) ist in der Restzahlung enthalten — wir führen sie an die Kurverwaltung Winterberg ab.",
    holdNotice: "Hinweis: Der Zeitraum ist ab jetzt 30 Minuten lang für Dich reserviert. Schließt Du die Buchung in dieser Zeit nicht ab, wird er danach automatisch wieder freigegeben.",
    stornoH: "Stornierungs-Regelwerk",
    stornoToday: (d: number, p: number) => `Bei Storno heute (${d} Tage vor Anreise): ${p}% Rückerstattung`,
    stornoTodayNoDays: (p: number) => `Bei Storno heute: ${p}% Rückerstattung`,
    stornoVerfaellt: "— Buchung verfällt.",
    stornoBody: "Vollständige Stornogebühren-Staffel (gerechnet von der Anreise rückwärts):",
    stornoRefund: "Rückerstattung",
    stornoNote: "Gerechnet auf den reinen Übernachtungspreis — Endreinigung und Kaution werden im Stornofall nicht fällig. Stornierungen müssen schriftlich erfolgen.",
    next: "Weiter",
    back: "Zurück",
    overview: "Übersicht",
    payNow: "Jetzt zahlen",
    redirecting: "Leite weiter ...",
    manualTransferButton: "Per klassischer Überweisung buchen",
    manualTransferSubmitting: "Buchung wird angelegt ...",
    manualTransferOverviewNote:
      "Vereine, Klassenfahrten und Schulfahrten (z. B. AG, SV) können bei Stripe automatisch auch per SEPA-Überweisung zahlen. Wer stattdessen klassisch auf unser Vereinskonto überweisen möchte, kann das hier direkt tun — ohne Rückfrage per Mail. Die Anzahlung muss dann innerhalb von 7 Tagen bei uns eingehen, sonst wird der Termin automatisch wieder freigegeben.",
    manualTransferLeadTooShort:
      "Klassische Überweisung ist ab 21 Tagen Vorlauf bis zur Anreise möglich — dafür ist es hier schon zu kurzfristig. Bitte nutzt stattdessen Stripe (auch per SEPA-Überweisung möglich).",
    manualTransferConfirmTitle: "Buchung eingegangen!",
    manualTransferConfirmIntro: "Eure Buchungsnummer:",
    manualTransferConfirmBankTitle: "Bitte überweist die Anzahlung auf folgendes Konto:",
    manualTransferConfirmDeadline: (date: string) =>
      `Der Termin ist bis zum ${date} für Euch reserviert. Geht die Anzahlung bis dahin nicht bei uns ein, wird die Buchung automatisch storniert und der Termin wieder freigegeben. Alle Angaben bekommt Ihr auch per E-Mail.`,
    manualTransferConfirmBank: "Bank",
    manualTransferConfirmIban: "IBAN",
    manualTransferConfirmKontoinhaber: "Kontoinhaber",
    manualTransferConfirmVerwendungszweck: "Verwendungszweck",
    manualTransferConfirmAnzahlung: "Anzahlung (jetzt zu überweisen)",
    manualTransferConfirmRestzahlung: "Restzahlung (inkl. Kaution + Kurtaxe), fällig bis",
    manualTransferConfirmReminderNote:
      "Ihr müsst Euch um nichts weiter kümmern — wir schicken rechtzeitig vor der Frist automatisch eine Erinnerungsmail mit allen Daten erneut zu.",
    // Persons / pricing
    personsRange: (n: number, max: number) => `${n} Personen · Maximalbelegung ${max}.`,
    valDepartureMissing: "Bitte auch den Abreisetag im Kalender wählen.",
    valMinNights: "Mindestaufenthalt: 2 Nächte — bitte einen späteren Abreisetag wählen.",
    valMinNightsNewYear: "Über Silvester gilt ein Mindestaufenthalt von 4 Nächten — der Zeitraum ist sehr gefragt. Bitte früher anreisen oder später abreisen.",
    valPersonsMin: "Bitte mindestens eine Person angeben.",
    valStep2Hint: "Bitte fülle die rot markierten Felder aus, um fortzufahren.",
    valRequired: "Pflichtfeld.",
    valEmail: "Bitte eine gültige E-Mail-Adresse eingeben.",
    valPhone: "Bitte eine gültige Telefonnummer eingeben.",
    valInstitution: "Bitte die Institution / Einrichtung angeben.",
    valTerms: "Bitte stimme den Bedingungen zu, um fortzufahren.",
    minOccupancyNoteTitle: "Aufschlag Mindestbelegung",
    minOccupancyNoteBody:
      "Buchungen mit weniger als 15 Personen werden zum Preisniveau von 15 Personen abgerechnet — die fehlenden Plätze kosten den Normaltarif (Erwachsene, Nichtmitglied). Bist Du selbst Vereinsmitglied, entfällt der Aufschlag — das gibst Du am Ende der Buchung an.",
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
    adultsLabel: "Erwachsene",
    adultsHint: "ab 16 Jahren, inkl. Lehrkräfte · 22,00 € / Nacht",
    childrenLabel: "Kinder/Schüler bis 16 Jahre",
    childrenHint: "12,00 € / Nacht",
    teachersLabel: "Lehrkräfte",
    teachersHint: "bei Schulgruppen · zählen wie Erwachsene (22,00 €)",
    memberHonestyNote:
      "Mitglieder-Tarife gelten ausschließlich für aktive Mitglieder des Skifreunde Gütersloh e.V. Buchungen, bei denen unwahre Angaben zur Vereinsmitgliedschaft gemacht wurden, können storniert werden.",
    memberConfirmLabel:
      "Ich bestätige, dass alle hier als Vereinsmitglieder angegebenen Personen aktive Mitglieder des Skifreunde Gütersloh e.V. sind.",
    valMemberConfirm: "Bitte bestätige die Mitgliedschaft der angegebenen Personen.",
    memberNamesH: "Mitglieder der Skifreunde Gütersloh e.V.",
    memberCheckLabel: "In unserer Gruppe sind Mitglieder des Vereins — bitte hier ankreuzen.",
    memberNamesIntro:
      "Bitte tragt die Mitglieder mit Vor- und Nachnamen ein. Wir prüfen die Angaben.",
    memberNamePlaceholder: "Vor- und Nachname",
    memberKindAdult: "Erwachsene/r",
    memberKindChild: "Kind unter 16",
    memberAdd: "+ Mitglied hinzufügen",
    memberAddSelf: (name: string) => `+ ${name} (ich bin Mitglied)`,
    memberRemove: "Entfernen",
    valMemberName: "Bitte Vor- und Nachnamen eintragen.",
    valMemberDuplicate: "Dieser Name steht schon in der Liste.",
    valMemberTooMany: (adults: number, children: number) =>
      `Ihr habt ${adults} Erwachsene und ${children} Kinder gebucht. Es können nicht mehr Mitglieder eingetragen werden, als Personen in der jeweiligen Gruppe sind.`,
    bookerMemberLabel: (name: string) =>
      `Ich${name ? ` (${name})` : ""} bin selbst Vereinsmitglied — dann entfällt der Aufschlag Mindestbelegung.`,
    personsNoReduceNote:
      "Wichtig: Die Personenzahl kann nach der Buchung nur noch erhöht, nicht verringert werden. Auch bei kurzfristigem Ausfall einzelner Teilnehmer bleibt der volle Übernachtungspreis fällig. Tipp: Lieber knapp kalkulieren — Personen könnt ihr später jederzeit bequem über euer Konto nachbuchen.",
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
    remainderBefore: "Restzahlung (14 Tage vor Anreise, inkl. Kaution + Kurtaxe)",
    depositDueLater: "Anzahlung (~30 Tage vor Anreise)",
    schoolSummaryNote:
      "Du zahlst heute nichts. Die Anzahlung (10 %) wird rund 30 Tage vor Anreise per Zahlungslink fällig, die Restzahlung inkl. Kaution + Kurtaxe 14 Tage vor Anreise.",
    // ReviewBlock
    zeitraum: "Zeitraum",
    bucher: "Bucher",
    totalSuffix: "gesamt",
    adultsShort: "Erw.",
    membersShort: "Erw./Mitgl.",
    childrenShort: "Kinder/Schüler",
    pupilsShort: "Kinder/Schüler (Mitgl.)",
    teachersShort: "Lehrer",
  },
  en: {
    steps: ["Dates & guests", "Purpose", "Contact", "Summary"],
    s0H: "When?",
    paymentMethodNote:
      "Payment by credit/debit card (Stripe): you pay the deposit online now, and the remaining balance (incl. damage deposit and tourist tax) is charged automatically to the same card 14 days before arrival — no need to log in again. Clubs, class trips and school trips (e.g. clubs/societies) can also pay via SEPA bank transfer through Stripe; if you'd rather transfer directly to our club account, you'll find that option at the end of the booking, in the summary.",
    s1H: "Who's coming?",
    s1AnlassH: "Purpose",
    s2H: "Your details",
    s3H: "Summary",
    rangeBlocked: "At least one day in this range is already booked — please pick another range.",
    arrival: "Arrival",
    departure: "Departure",
    purpose: "Purpose *",
    purposePlaceholder: "Please choose …",
    purposeOpts: {
      familie: "Group trip",
      klasse: "Class trip",
      schul: "School trip",
      verein: "Club trip",
      firma: "Company / team event",
      sonstiges: "Other",
    },
    privateReasonLabel: "Short description *",
    privateReasonPlaceholder: "What is it exactly? Who's coming? What's planned?",
    purposeReasonHintNonPrivate: "Just 1–2 sentences about the group / occasion — helps us put the booking in context.",
    eventLocationWarn: "Party groups: please look for another accommodation.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Mobile number *",
    phoneHint: "For our cabin warden, who arranges your arrival time with you, also by text message.",
    company: "Company / club",
    institution: "Institution / organisation",
    institutionHint: "Name of the school, club or company",
    schoolPayTitle: "Deposit due later — school-group deferral",
    schoolPayBody:
      "You don't need to pay anything now. We hold the dates for you. The deposit (10 %) automatically becomes due about 30 days before arrival via an email payment link; the remainder incl. damage deposit + tourist tax 14 days before arrival. If the deposit isn't paid on time (within 14 days), a cancellation fee applies and the booking is cancelled.",
    schoolSubmit: "Request reservation (binding)",
    schoolImmediateNote:
      "As your arrival is less than 30 days away, the deposit must be paid online now — deferred payment isn't possible at such short notice.",
    fullPaymentNote:
      "As arrival is less than 14 days away, the full amount (rent + damage deposit + tourist tax) is due now.",
    fullAmountLabel: "Full rental price",
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
    kurtaxeLabel: "Tourist tax",
    restzahlung: "Remaining amount of",
    restzahlungBody: "(incl. damage deposit + tourist tax) is charged automatically 14 days before arrival — a separate payment notice is emailed beforehand. The damage deposit is refunded within 14 days of a clean departure.",
    kurtaxeNote: "Note: The Hochsauerland tourist tax (€2.70 per guest aged 16+ per night) is included in the remaining payment — we remit it to the Winterberg tourist office.",
    holdNotice: "Note: This date range is reserved for you for 30 minutes from now. If you don't complete the booking within this time, it will automatically become available again.",
    stornoH: "Cancellation policy",
    stornoToday: (d: number, p: number) => `If cancelled today (${d} days before arrival): ${p}% refund`,
    stornoTodayNoDays: (p: number) => `If cancelled today: ${p}% refund`,
    stornoVerfaellt: "— booking forfeits.",
    stornoBody: "Full cancellation tiers (counted backwards from arrival):",
    stornoRefund: "refund",
    stornoNote: "Based on the accommodation price only — final cleaning and deposit are not charged if you cancel. Cancellations must be made in writing.",
    next: "Next",
    back: "Back",
    overview: "Summary",
    payNow: "Pay now",
    redirecting: "Redirecting ...",
    manualTransferButton: "Book via classic bank transfer",
    manualTransferSubmitting: "Creating booking ...",
    manualTransferOverviewNote:
      "Clubs, class trips and school trips (e.g. clubs/societies) can also pay Stripe via SEPA bank transfer automatically. If you'd rather transfer directly to our club account, you can do that right here — no need to email us first. The deposit must then reach us within 7 days, otherwise the dates are released again automatically.",
    manualTransferLeadTooShort:
      "Classic bank transfer is available from 21 days before arrival — this booking is too short-notice for that. Please use Stripe instead (SEPA transfer is also available there).",
    manualTransferConfirmTitle: "Booking received!",
    manualTransferConfirmIntro: "Your booking number:",
    manualTransferConfirmBankTitle: "Please transfer the deposit to this account:",
    manualTransferConfirmDeadline: (date: string) =>
      `The dates are reserved for you until ${date}. If the deposit has not reached us by then, the booking is cancelled automatically and the dates are released again. You will also receive all details by email.`,
    manualTransferConfirmBank: "Bank",
    manualTransferConfirmIban: "IBAN",
    manualTransferConfirmKontoinhaber: "Account holder",
    manualTransferConfirmVerwendungszweck: "Reference",
    manualTransferConfirmAnzahlung: "Deposit (transfer now)",
    manualTransferConfirmRestzahlung: "Remaining balance (incl. deposit & tourist tax), due by",
    manualTransferConfirmReminderNote:
      "You don't need to do anything else — we'll automatically send a reminder email with all the details again before the deadline.",
    personsRange: (n: number, max: number) => `${n} guests · maximum ${max}.`,
    valDepartureMissing: "Please also pick the departure day in the calendar.",
    valMinNights: "Minimum stay: 2 nights — please pick a later departure day.",
    valMinNightsNewYear: "Over New Year's Eve the minimum stay is 4 nights — this period is in high demand. Please arrive earlier or leave later.",
    valPersonsMin: "Please add at least one guest.",
    valStep2Hint: "Please complete the fields marked in red to continue.",
    valRequired: "Required.",
    valEmail: "Please enter a valid email address.",
    valPhone: "Please enter a valid phone number.",
    valInstitution: "Please enter the institution / organisation.",
    valTerms: "Please accept the terms to continue.",
    minOccupancyNoteTitle: "Minimum-occupancy surcharge",
    minOccupancyNoteBody:
      "Bookings below 15 guests are charged at the 15-guest price level — the missing places are charged at the standard rate (adult, non-member). If you are a club member yourself, the surcharge does not apply — you state this at the end of the booking.",
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
    adultsLabel: "Adults",
    adultsHint: "16+, incl. teachers · 22.00 € / night",
    childrenLabel: "Children/pupils up to 16",
    childrenHint: "12.00 € / night",
    teachersLabel: "Teachers",
    teachersHint: "for school groups · counted as adults (22.00 €)",
    memberHonestyNote:
      "Member rates apply exclusively to active members of Skifreunde Gütersloh e.V. Bookings based on false membership statements may be cancelled.",
    memberConfirmLabel:
      "I confirm that all persons stated here as club members are active members of Skifreunde Gütersloh e.V.",
    valMemberConfirm: "Please confirm the membership of the persons stated.",
    memberNamesH: "Members of Skifreunde Gütersloh e.V.",
    memberCheckLabel: "Our group includes members of the club — please tick here.",
    memberNamesIntro:
      "Please enter the members with first and last name. We check the details.",
    memberNamePlaceholder: "First and last name",
    memberKindAdult: "Adult",
    memberKindChild: "Child under 16",
    memberAdd: "+ Add member",
    memberAddSelf: (name: string) => `+ ${name} (I am a member)`,
    memberRemove: "Remove",
    valMemberName: "Please enter first and last name.",
    valMemberDuplicate: "This name is already on the list.",
    valMemberTooMany: (adults: number, children: number) =>
      `You booked ${adults} adults and ${children} children. You cannot enter more members than there are persons in each group.`,
    bookerMemberLabel: (name: string) =>
      `I${name ? ` (${name})` : ""} am a club member myself — the minimum-occupancy surcharge then does not apply.`,
    personsNoReduceNote:
      "Important: after booking, the number of guests can only be increased, never reduced. The full accommodation price remains due even if individual participants drop out at short notice. Tip: book conservatively — you can add guests any time via your account.",
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
    remainderBefore: "Remaining amount (14 days before arrival, incl. damage deposit + tourist tax)",
    depositDueLater: "Deposit (~30 days before arrival)",
    schoolSummaryNote:
      "You pay nothing today. The deposit (10 %) falls due about 30 days before arrival via a payment link; the remainder incl. damage deposit + tourist tax 14 days before arrival.",
    zeitraum: "Period",
    bucher: "Booker",
    totalSuffix: "total",
    adultsShort: "adults",
    membersShort: "adults/member",
    childrenShort: "children/pupils",
    pupilsShort: "children/pupils (member)",
    teachersShort: "teachers",
  },
  nl: {
    steps: ["Periode & personen", "Aanleiding", "Contact", "Overzicht"],
    s0H: "Wanneer?",
    paymentMethodNote:
      "Betaling per krediet-/debitkaart (Stripe): je betaalt de aanbetaling nu online, het resterende bedrag (incl. borg en toeristenbelasting) wordt 14 dagen vóór aankomst automatisch van dezelfde kaart afgeschreven — je hoeft niet opnieuw in te loggen. Verenigingen, klassenreizen en schoolreizen (bijv. AG, SV) kunnen bij Stripe ook per SEPA-overschrijving betalen; wil je liever rechtstreeks naar onze verenigingsrekening overschrijven, dan vind je die optie aan het einde van de boeking, in het overzicht.",
    s1H: "Wie komt er?",
    s1AnlassH: "Aanleiding",
    s2H: "Jullie gegevens",
    s3H: "Overzicht",
    rangeBlocked: "Minstens één dag in deze periode is al geboekt — kies een andere periode.",
    arrival: "Aankomst",
    departure: "Vertrek",
    purpose: "Aanleiding *",
    purposePlaceholder: "Maak een keuze …",
    purposeOpts: {
      familie: "Groepsreis",
      klasse: "Klassenreis",
      schul: "Schoolreis",
      verein: "Verenigingsreis",
      firma: "Bedrijf / team-event",
      sonstiges: "Anders",
    },
    privateReasonLabel: "Korte beschrijving *",
    privateReasonPlaceholder: "Waar gaat het precies om? Wie komen er? Wat is er gepland?",
    purposeReasonHintNonPrivate: "1–2 zinnen over de groep / aanleiding — helpt ons de boeking in context te plaatsen.",
    eventLocationWarn: "Feestgroepen verzoeken we vriendelijk een andere accommodatie te zoeken.",
    firstName: "Voornaam",
    lastName: "Achternaam",
    email: "E-mail",
    phone: "Mobiel nummer *",
    phoneHint: "Voor de huttenbeheerder: hij spreekt de aankomsttijd met jullie af, ook per sms.",
    company: "Bedrijf / vereniging",
    institution: "Instelling / organisatie",
    institutionHint: "Naam van de school, vereniging of het bedrijf",
    schoolPayTitle: "Aanbetaling later — uitstel voor schoolgroepen",
    schoolPayBody:
      "Jullie hoeven nu niets te betalen. We reserveren de periode vast. De aanbetaling (10 %) wordt automatisch ongeveer 30 dagen voor aankomst verschuldigd via een betaallink per e-mail; de restbetaling incl. borg + toeristenbelasting 14 dagen voor aankomst. Wordt de aanbetaling niet op tijd (binnen 14 dagen) voldaan, dan volgt een annuleringskost en wordt de boeking geannuleerd.",
    schoolSubmit: "Reservering bindend aanvragen",
    schoolImmediateNote:
      "Omdat jullie aankomst minder dan 30 dagen weg is, moet de aanbetaling nu online gebeuren — uitstel is op zo'n korte termijn niet mogelijk.",
    fullPaymentNote:
      "Omdat de aankomst binnen 14 dagen is, is het volledige bedrag (huur + borg + toeristenbelasting) nu direct verschuldigd.",
    fullAmountLabel: "Volledige huurprijs",
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
    kurtaxeLabel: "Toeristenbelasting",
    restzahlung: "Restbedrag van",
    restzahlungBody: "(incl. borg + toeristenbelasting) wordt 14 dagen vóór aankomst automatisch geïncasseerd — een apart betaalverzoek volgt vooraf per e-mail. De borg wordt binnen 14 dagen na schadevrije afreis terugbetaald.",
    kurtaxeNote: "Let op: De toeristenbelasting Hochsauerland (€ 2,70 per persoon vanaf 16 jaar per nacht) zit in de restbetaling — wij dragen deze af aan de Kurverwaltung Winterberg.",
    holdNotice: "Let op: Deze periode is vanaf nu 30 minuten voor je gereserveerd. Rond je de boeking niet binnen deze tijd af, dan wordt de periode daarna automatisch weer vrijgegeven.",
    stornoH: "Annuleringsregeling",
    stornoToday: (d: number, p: number) => `Bij annulering vandaag (${d} dagen vóór aankomst): ${p}% terugbetaling`,
    stornoTodayNoDays: (p: number) => `Bij annulering vandaag: ${p}% terugbetaling`,
    stornoVerfaellt: "— boeking vervalt.",
    stornoBody: "Volledige annuleringsstaffel (gerekend terug vanaf aankomst):",
    stornoRefund: "terugbetaling",
    stornoNote: "Alleen gerekend over de overnachtingsprijs — eindschoonmaak en borg vervallen bij annulering. Annuleringen moeten schriftelijk gebeuren.",
    next: "Volgende",
    back: "Terug",
    overview: "Overzicht",
    payNow: "Nu betalen",
    redirecting: "Doorsturen ...",
    manualTransferButton: "Boeken via klassieke overschrijving",
    manualTransferSubmitting: "Boeking wordt aangemaakt ...",
    manualTransferOverviewNote:
      "Verenigingen, klassenreizen en schoolreizen (bijv. AG, SV) kunnen bij Stripe ook automatisch per SEPA-overschrijving betalen. Wil je liever rechtstreeks naar onze verenigingsrekening overschrijven, dan kan dat hier direct — zonder eerst te mailen. De aanbetaling moet dan binnen 7 dagen bij ons binnen zijn, anders komt de periode automatisch weer vrij.",
    manualTransferLeadTooShort:
      "Klassieke overschrijving is mogelijk vanaf 21 dagen vóór aankomst — dat is hier al te kort dag. Gebruik in dat geval Stripe (SEPA-overschrijving is daar ook mogelijk).",
    manualTransferConfirmTitle: "Boeking ontvangen!",
    manualTransferConfirmIntro: "Je boekingsnummer:",
    manualTransferConfirmBankTitle: "Maak de aanbetaling over naar deze rekening:",
    manualTransferConfirmDeadline: (date: string) =>
      `De periode is tot ${date} voor jullie gereserveerd. Is de aanbetaling dan nog niet bij ons binnen, dan wordt de boeking automatisch geannuleerd en komt de periode weer vrij. Alle gegevens ontvangen jullie ook per e-mail.`,
    manualTransferConfirmBank: "Bank",
    manualTransferConfirmIban: "IBAN",
    manualTransferConfirmKontoinhaber: "Rekeninghouder",
    manualTransferConfirmVerwendungszweck: "Omschrijving",
    manualTransferConfirmAnzahlung: "Aanbetaling (nu over te maken)",
    manualTransferConfirmRestzahlung: "Resterend bedrag (incl. borg & toeristenbelasting), verschuldigd vóór",
    manualTransferConfirmReminderNote:
      "Je hoeft verder niets te doen — we sturen op tijd vóór de deadline automatisch nogmaals een herinneringsmail met alle gegevens.",
    personsRange: (n: number, max: number) => `${n} personen · maximaal ${max}.`,
    valDepartureMissing: "Kies ook de vertrekdag in de kalender.",
    valMinNights: "Minimaal 2 nachten — kies een latere vertrekdag.",
    valMinNightsNewYear: "Rond oudejaarsavond geldt een minimum verblijf van 4 nachten — deze periode is erg gewild. Kom eerder aan of vertrek later.",
    valPersonsMin: "Voeg minstens één persoon toe.",
    valStep2Hint: "Vul de rood gemarkeerde velden in om door te gaan.",
    valRequired: "Verplicht veld.",
    valEmail: "Voer een geldig e-mailadres in.",
    valPhone: "Voer een geldig telefoonnummer in.",
    valInstitution: "Vul de instelling / organisatie in.",
    valTerms: "Ga akkoord met de voorwaarden om door te gaan.",
    minOccupancyNoteTitle: "Toeslag minimale bezetting",
    minOccupancyNoteBody:
      "Boekingen onder 15 personen worden afgerekend op het prijsniveau van 15 personen — de ontbrekende plaatsen kosten het standaardtarief (volwassene, niet-lid). Ben je zelf verenigingslid, dan vervalt de toeslag — dat geef je aan het eind van de boeking aan.",
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
    adultsLabel: "Volwassenen",
    adultsHint: "vanaf 16 jaar, incl. docenten · € 22,00 / nacht",
    childrenLabel: "Kinderen/leerlingen tot 16 jaar",
    childrenHint: "€ 12,00 / nacht",
    teachersLabel: "Docenten",
    teachersHint: "bij schoolgroepen · tellen als volwassenen (€ 22,00)",
    memberHonestyNote:
      "Ledentarieven gelden uitsluitend voor actieve leden van Skifreunde Gütersloh e.V. Boekingen met onjuiste opgaven over het lidmaatschap kunnen worden geannuleerd.",
    memberConfirmLabel:
      "Ik bevestig dat alle hier als verenigingslid opgegeven personen actieve leden van Skifreunde Gütersloh e.V. zijn.",
    valMemberConfirm: "Bevestig het lidmaatschap van de opgegeven personen.",
    memberNamesH: "Leden van Skifreunde Gütersloh e.V.",
    memberCheckLabel: "In onze groep zitten leden van de vereniging — vink hier aan.",
    memberNamesIntro:
      "Vul de leden in met voor- en achternaam. Wij controleren de gegevens.",
    memberNamePlaceholder: "Voor- en achternaam",
    memberKindAdult: "Volwassene",
    memberKindChild: "Kind onder 16",
    memberAdd: "+ Lid toevoegen",
    memberAddSelf: (name: string) => `+ ${name} (ik ben lid)`,
    memberRemove: "Verwijderen",
    valMemberName: "Vul voor- en achternaam in.",
    valMemberDuplicate: "Deze naam staat al op de lijst.",
    valMemberTooMany: (adults: number, children: number) =>
      `Jullie hebben ${adults} volwassenen en ${children} kinderen geboekt. Er kunnen niet meer leden worden ingevuld dan er personen in de betreffende groep zijn.`,
    bookerMemberLabel: (name: string) =>
      `Ik${name ? ` (${name})` : ""} ben zelf verenigingslid — dan vervalt de toeslag minimale bezetting.`,
    personsNoReduceNote:
      "Belangrijk: na de boeking kan het aantal personen alleen worden verhoogd, nooit verlaagd. Ook bij kortetermijnuitval van deelnemers blijft de volledige overnachtingsprijs verschuldigd. Tip: boek liever krap — personen bijboeken kan altijd via je account.",
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
    remainderBefore: "Restbedrag (14 dagen vóór aankomst, incl. borg + toeristenbelasting)",
    depositDueLater: "Aanbetaling (~30 dagen vóór aankomst)",
    schoolSummaryNote:
      "Je betaalt vandaag niets. De aanbetaling (10 %) wordt ongeveer 30 dagen vóór aankomst via een betaallink verschuldigd; de restbetaling incl. borg + toeristenbelasting 14 dagen vóór aankomst.",
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
  changeoverDates = [],
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
  // `persons` hält nur noch die Grund-Zählung (alle Erwachsenen / alle Kinder).
  // Mitglieder werden erst am Ende namentlich eingetragen (memberNames) und
  // daraus der Preis-Mix `pricedPersons` abgeleitet (Vorstandswunsch 11/2026).
  const [persons, setPersons] = useState<Persons>(
    repeatHint
      ? {
          adults: repeatHint.adults + repeatHint.members,
          members: 0,
          children: repeatHint.children + repeatHint.pupils,
          pupils: 0,
          teachers: repeatHint.teachers,
        }
      : emptyPersons
  );
  const [memberNames, setMemberNames] = useState<MemberName[]>([]);
  // Bucher/in ist selbst Vereinsmitglied → kein Mindestbelegungs-Aufschlag.
  const [bookerIsMember, setBookerIsMember] = useState(!!prefill?.membershipVerified);
  const [memberTried, setMemberTried] = useState(false);
  // Allein-/Exklusivnutzung-Option wurde aus dem Flow entfernt (Vorstands-
  // Entscheidung). soloUse bleibt fix auf false, damit kein Aufschlag entsteht
  // und der Wert für Pricing/Action-Kompatibilität vorhanden ist.
  const soloUse = false;
  // Anlass — Pflicht-Dropdown.
  const [purposeCategory, setPurposeCategory] = useState<PurposeKey | "">("");
  const [purposeReason, setPurposeReason] = useState("");

  const [customerType, setCustomerType] = useState<"privat" | "mitglied" | "verein" | "firma">(
    prefill?.customerType ?? "privat"
  );
  const [firstName, setFirstName] = useState(prefill?.firstName ?? "");
  const [lastName, setLastName] = useState(prefill?.lastName ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [company, setCompany] = useState("");
  const [institution, setInstitution] = useState("");
  const [street, setStreet] = useState(prefill?.street ?? "");
  const [zip, setZip] = useState(prefill?.zip ?? "");
  const [city, setCity] = useState(prefill?.city ?? "");
  const [customerMessage, setCustomerMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [memberConfirm, setMemberConfirm] = useState(false);
  // Wurde in Schritt 2 schon ein "Weiter"-Versuch gemacht? Steuert, ob
  // Feld-Fehler angezeigt werden (nicht naggy beim ersten Anschauen).
  const [step2Tried, setStep2Tried] = useState(false);

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

  const [manualTransferSubmitting, startManualTransferTransition] = useTransition();
  const [manualTransferError, setManualTransferError] = useState<string | null>(null);
  const [manualTransferSuccess, setManualTransferSuccess] = useState<Extract<
    ManualTransferResult,
    { ok: true }
  > | null>(null);

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
    ) >= minNightsFor(arrival, departure);

  const personsValid =
    totalPersons >= RULES.minPersons && totalPersons <= RULES.maxPersons;

  // Mitglieder-Namen → Preis-Mix. Mehr Mitglieder als gebuchte Personen der
  // jeweiligen Gruppe werden nicht verrechnet (Validierung zeigt den Fehler).
  const memberKinds = countMemberKinds(memberNames);
  const memberCountValid =
    memberKinds.adults <= persons.adults && memberKinds.children <= persons.children;
  const pricedPersons: Persons = useMemo(() => {
    const m = Math.min(memberKinds.adults, persons.adults);
    const p = Math.min(memberKinds.children, persons.children);
    return {
      adults: persons.adults - m,
      members: m,
      children: persons.children - p,
      pupils: p,
      teachers: persons.teachers,
    };
  }, [persons, memberKinds.adults, memberKinds.children]);

  // Nur relevant (und nur abgefragt) unter der Mindestbelegung.
  const belowFloor = totalPersons > 0 && totalPersons < RULES.minOccupancyFloor;
  const bookerMemberEffective = belowFloor && bookerIsMember;

  const breakdown = useMemo(() => {
    if (!datesValid || !personsValid) return null;
    return calculatePrice({
      arrival,
      departure,
      persons: pricedPersons,
      soloUse,
      locale,
      bookerIsMember: bookerMemberEffective,
    });
  }, [arrival, departure, pricedPersons, soloUse, datesValid, personsValid, locale, bookerMemberEffective]);

  const normName = (n: string) => n.trim().toLowerCase().replace(/\s+/g, " ");
  const memberNameErrors = memberNames.map((m, i) => {
    if (!isFullName(m.name) || m.name.trim().length < 3) return tt.valMemberName;
    if (memberNames.findIndex((o) => normName(o.name) === normName(m.name)) !== i)
      return tt.valMemberDuplicate;
    return null;
  });

  const rangeBlocked = useMemo(() => {
    if (!datesValid) return false;
    const cur = new Date(arrival);
    const end = new Date(departure);
    while (cur < end) {
      if (blockedSet.has(toLocalIso(cur))) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }, [arrival, departure, datesValid, blockedSet]);

  const canGoStep1 = datesValid && personsValid && !rangeBlocked;
  // Step 2: Anlass ist Pflicht. Grund-Pflichtfeld (min. 20 Z.) fuer ALLE
  // Anlaesse AUSSER Klassenfahrt — gibt dem Vorstand Kontext und schreckt
  // missbraeuchliche Anmeldungen ab.
  const reasonRequired = !!purposeCategory && purposeCategory !== "klasse";
  const reasonValid = !reasonRequired || purposeReason.trim().length >= 20;
  const purposeValid = !!purposeCategory && reasonValid;
  const canGoStep2 = breakdown !== null && purposeValid;

  // Institutions-Feld: Pflicht bei Schul-/Gruppen-/Firmen-Anlaessen.
  const institutionRequired =
    purposeCategory === "klasse" ||
    purposeCategory === "schul" ||
    purposeCategory === "verein" ||
    purposeCategory === "firma";
  const institutionValid = !institutionRequired || institution.trim().length >= 2;

  const isSchoolPurpose = purposeCategory === "klasse" || purposeCategory === "schul";
  // Komplettzahlung: bei JEDER Buchung mit Anreise < 14 Tagen wird der gesamte
  // Betrag sofort fällig. Schulgruppen zahlen sonst 10 %, alle anderen 50 %.
  const fullPaymentRequired = !!arrival && daysUntilLocalDate(arrival) < 14;
  const prepayPercent = isSchoolPurpose ? 10 : 50;

  // Klassische Ueberweisung (Selbstbedienung) -- nur fuer klasse/schul/verein,
  // NICHT firma (siehe manual-transfer-actions.ts, MANUAL_TRANSFER_PURPOSES).
  // Mindestvorlauf 21 Tage, sonst laege die dort kommunizierte T-14-Frist
  // schon in der Vergangenheit.
  const manualTransferEligible =
    purposeCategory === "klasse" || purposeCategory === "schul" || purposeCategory === "verein";
  const manualTransferLeadOk = !!arrival && daysUntilLocalDate(arrival) >= 21;

  // Feld-Validität (für Inline-Fehler in Schritt 2).
  const firstNameValid = firstName.trim().length > 0;
  const lastNameValid = lastName.trim().length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = phone.trim().length >= 5;
  const termsValid = acceptedTerms;
  // Ehrlichkeitsbestätigung (Issue #66): Pflicht, sobald Personen zum
  // Mitgliedstarif gebucht sind — schafft Storno-Recht bei Falschangaben.
  // Jetzt in der Übersicht (Schritt 4), sobald Mitglieder eingetragen sind.
  const memberTariffUsed = memberNames.length > 0 || bookerMemberEffective;
  const memberConfirmValid = !memberTariffUsed || memberConfirm;
  const memberSectionValid =
    memberCountValid && memberNameErrors.every((e) => e === null) && memberConfirmValid;
  const canGoStep3 =
    firstNameValid && lastNameValid && emailValid && phoneValid && institutionValid &&
    termsValid;

  // Payload-Felder für beide Server-Actions.
  const memberPayload = {
    persons: pricedPersons,
    memberNames: memberNames.map((m) => ({ name: m.name.trim().replace(/\s+/g, " "), kind: m.kind })),
    memberConfirm,
    bookerIsMember: bookerMemberEffective,
  };
  // Vor dem Absenden: Mitglieder-Abschnitt prüfen, Fehler sichtbar machen.
  const guardMembers = () => {
    if (memberSectionValid) return true;
    setMemberTried(true);
    return false;
  };

  const submit = () => {
    setError(null);
    if (!guardMembers()) return;
    startTransition(async () => {
      const res = await createBookingAndCheckout({
        arrival,
        departure,
        ...memberPayload,
        soloUse,
        customerType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim() || null,
        institution: institution.trim() || null,
        street: street.trim() || null,
        zip: zip.trim() || null,
        city: city.trim() || null,
        purpose: composePurpose(purposeCategory, tt) ?? "",
        purposeCategory: (purposeCategory || undefined) as PurposeKey | undefined,
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
      if ("checkoutUrl" in res && res.checkoutUrl) {
        track("booking_checkout_start", {
          nights: breakdown?.nights,
          total: breakdown ? Math.round(breakdown.subtotalCents / 100) : null,
          purpose: purposeCategory || null,
        });
        window.location.href = res.checkoutUrl;
      }
    });
  };

  // Klassische Ueberweisung: kein Redirect -- schliesst synchron mit einem
  // Klick ab, Erfolg wird lokal als Bestaetigungs-Panel angezeigt.
  const submitManualTransfer = () => {
    setManualTransferError(null);
    if (!guardMembers()) return;
    startManualTransferTransition(async () => {
      const res = await createManualTransferBooking({
        arrival,
        departure,
        ...memberPayload,
        soloUse,
        customerType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim() || null,
        institution: institution.trim() || null,
        street: street.trim() || null,
        zip: zip.trim() || null,
        city: city.trim() || null,
        purpose: composePurpose(purposeCategory, tt) ?? "",
        purposeCategory: (purposeCategory || undefined) as PurposeKey | undefined,
        customerMessage: customerMessage.trim() || null,
        discountCode:
          discountState.status === "valid" ? discountState.code : discountCode.trim() || null,
        acceptedTerms: true,
        locale,
      });
      if (!res.ok) {
        setManualTransferError(res.error);
        return;
      }
      track("booking_manual_transfer_created", {
        nights: breakdown?.nights,
        total: breakdown ? Math.round(breakdown.subtotalCents / 100) : null,
        purpose: purposeCategory || null,
      });
      setManualTransferSuccess(res);
    });
  };

  // Funnel-Tracking: nur beim Vorwärts-Springen den neu erreichten Schritt melden.
  const goToStep = (s: Step) => {
    if (s > step) {
      if (s === 1) track("booking_step_purpose");
      else if (s === 2) track("booking_step_contact");
      else if (s === 3) track("booking_step_review");
    }
    setStep(s);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 max-w-full min-w-0">
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-3 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
        <Stepper step={step} labels={tt.steps} onJump={(s) => setStep(s)} />

        {step === 0 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.s0H}</h3>

            <div className="rounded-[var(--radius-card)] bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] px-4 py-3 text-sm text-[var(--color-wh-fg-muted)]">
              {tt.paymentMethodNote}
            </div>

            <AvailabilityCalendar
              bookedDates={bookedDates}
              cleaningDates={cleaningDates}
              wartungDates={wartungDates}
              changeoverDates={changeoverDates}
              arrival={arrival}
              departure={departure}
              onSelect={(a, d) => {
                setArrival(a);
                setDeparture(d);
              }}
              locale={locale}
            />


            {/* Datumsfelder bewusst entfernt — der Kalender oben ist die
                alleinige Quelle (vermeidet Inkonsistenz zwischen Kalender und
                Input). Anreise/Abreise sind in der Preisuebersicht rechts
                sichtbar. */}
            {rangeBlocked && (
              <div className="text-[var(--color-wh-sunset)] text-sm font-semibold">
                {tt.rangeBlocked}
              </div>
            )}
            {/* Kontextuelle Datums-Hinweise statt nur ausgegrautem Button. */}
            {!rangeBlocked && arrival && !departure && (
              <div className="text-[var(--color-wh-fg-muted)] text-sm">
                {tt.valDepartureMissing}
              </div>
            )}
            {!rangeBlocked && arrival && departure && !datesValid && (
              <div className="text-[var(--color-wh-sunset)] text-sm font-semibold">
                {new Date(departure) > new Date(arrival) && coversNewYearsEve(arrival, departure)
                  ? tt.valMinNightsNewYear
                  : tt.valMinNights}
              </div>
            )}

            <h3 className="text-[22px] sm:text-[24px] mt-12 mb-0">{tt.s1H}</h3>
            <PersonsEditor persons={persons} onChange={setPersons} tt={tt} />
            <div
              className={`text-sm ${
                personsValid ? "text-[var(--color-wh-fg-muted)]" : "text-[var(--color-wh-sunset)]"
              }`}
            >
              {tt.personsRange(totalPersons, RULES.maxPersons)}
            </div>
            {totalPersons === 0 && (
              <div className="text-[var(--color-wh-sunset)] text-sm font-semibold">
                {tt.valPersonsMin}
              </div>
            )}
            {totalPersons > 0 && totalPersons < RULES.minOccupancyFloor && (
              <div className="rounded-[var(--radius-card)] bg-[var(--color-wh-sand)] border border-[var(--color-wh-winter-grey)] p-4 text-sm">
                <div className="font-semibold mb-1">{tt.minOccupancyNoteTitle}</div>
                <div className="text-[var(--color-wh-fg-muted)]">{tt.minOccupancyNoteBody}</div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                disabled={!canGoStep1}
                onClick={() => goToStep(1)}
                iconRight={<ArrowRight size={18} />}
              >
                {tt.next}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.s1AnlassH}</h3>

            <Select
              id="purpose"
              label={tt.purpose}
              placeholder={tt.purposePlaceholder}
              value={purposeCategory}
              onChange={(e) => {
                const v = e.target.value as PurposeKey;
                setPurposeCategory(v);
                if (v === "klasse") setPurposeReason("");
              }}
              required
              options={SELECTABLE_PURPOSE_KEYS.map((k) => ({ value: k, label: tt.purposeOpts[k] }))}
            />

            {purposeCategory && purposeCategory !== "klasse" && (
              <Textarea
                id="purposeReason"
                label={tt.privateReasonLabel}
                placeholder={tt.privateReasonPlaceholder}
                hint={tt.purposeReasonHintNonPrivate}
                value={purposeReason}
                onChange={(e) => setPurposeReason(e.target.value)}
                required
                minLength={20}
              />
            )}

            {/* Rote Warn-Zeile direkt darunter — Hütte ist KEINE Event-/Partylocation. */}
            <p className="text-[13px] sm:text-sm font-semibold text-[var(--color-wh-sunset)] leading-relaxed -mt-1">
              ⚠ {tt.eventLocationWarn}
            </p>

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
                onClick={() => goToStep(2)}
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
              <Input id="firstName" label={tt.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                error={step2Tried && !firstNameValid ? tt.valRequired : undefined} />
              <Input id="lastName" label={tt.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} required
                error={step2Tried && !lastNameValid ? tt.valRequired : undefined} />
              <Input id="email" type="email" label={tt.email} value={email} onChange={(e) => setEmail(e.target.value)} required
                error={step2Tried && !emailValid ? tt.valEmail : undefined} />
              <Input id="phone" type="tel" label={tt.phone} hint={tt.phoneHint} value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={5}
                error={step2Tried && !phoneValid ? tt.valPhone : undefined} />
              {institutionRequired ? (
                <Input
                  id="institution"
                  label={tt.institution}
                  hint={tt.institutionHint}
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  required
                  error={step2Tried && !institutionValid ? tt.valInstitution : undefined}
                />
              ) : customerType === "firma" || customerType === "verein" ? (
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
            {step2Tried && !termsValid && (
              <p className="-mt-3 text-xs text-[var(--color-wh-sunset)]">{tt.valTerms}</p>
            )}

            {/* Sammel-Hinweis, wenn der Übersicht-Versuch fehlschlug. */}
            {step2Tried && !canGoStep3 && (
              <div className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-4 py-3 text-sm font-medium text-[var(--color-wh-sunset)]">
                {tt.valStep2Hint}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                iconLeft={<ArrowLeft size={18} />}
              >
                {tt.back}
              </Button>
              <Button
                onClick={() => {
                  if (canGoStep3) goToStep(3);
                  else setStep2Tried(true);
                }}
                iconRight={<ArrowRight size={18} />}
              >
                {tt.overview}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && breakdown && !manualTransferSuccess && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.s3H}</h3>
            <ReviewBlock
              arrival={arrival}
              departure={departure}
              nights={breakdown.nights}
              persons={pricedPersons}
              firstName={firstName}
              lastName={lastName}
              email={email}
              tt={tt}
            />

            <MemberNamesSection
              names={memberNames}
              onChange={setMemberNames}
              errors={memberNameErrors}
              countValid={memberCountValid}
              adults={persons.adults}
              kids={persons.children}
              bookerName={`${firstName.trim()} ${lastName.trim()}`.trim()}
              confirm={memberConfirm}
              onConfirm={setMemberConfirm}
              showBookerMember={belowFloor}
              bookerIsMember={bookerIsMember}
              onBookerIsMember={setBookerIsMember}
              tried={memberTried}
              tt={tt}
            />

            {fullPaymentRequired ? (
              /* Anreise < 14 Tage → kompletter Betrag sofort fällig. */
              <div className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-beige)] px-4 py-3 text-sm text-[var(--color-wh-black)]">
                {tt.fullPaymentNote}
              </div>
            ) : null}

            {(() => {
              const subAfter = breakdown.subtotalCents;
              const prepayAfter = fullPaymentRequired
                ? subAfter
                : Math.round((subAfter * prepayPercent) / 100);
              const remainAfter = subAfter - prepayAfter;
              const extrasNow = fullPaymentRequired
                ? breakdown.depositCents + breakdown.kurtaxeCents
                : 0;
              const totalDueAfter = prepayAfter + extrasNow;
              return (
                <div className="bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-5 text-sm text-[var(--color-wh-black)]">
                  <p className="m-0 font-semibold mb-2">{tt.dueToday}</p>
                  <p className="m-0">
                    <strong>{formatEuro(prepayAfter, locale)}</strong>{" "}
                    {fullPaymentRequired ? tt.fullAmountLabel : tt.deposit} (
                    {fullPaymentRequired ? tt.bookingSum : tt.bookingTotalAfter})
                    {fullPaymentRequired && (
                      <>
                        {" + "}
                        <strong>{formatEuro(breakdown.depositCents, locale)}</strong> {tt.kaution}
                        {breakdown.kurtaxeCents > 0 && (
                          <>
                            {" + "}
                            <strong>{formatEuro(breakdown.kurtaxeCents, locale)}</strong> {tt.kurtaxeLabel}
                          </>
                        )}
                        {" = "}
                        <strong>{formatEuro(totalDueAfter, locale)}</strong>
                      </>
                    )}
                  </p>
                  {remainAfter > 0 && (
                    <p className="m-0 mt-3">
                      {tt.restzahlung}{" "}
                      <strong>
                        {formatEuro(remainAfter + breakdown.depositCents + breakdown.kurtaxeCents, locale)}
                      </strong>{" "}
                      {tt.restzahlungBody}
                    </p>
                  )}
                  {breakdown.kurtaxeCents > 0 && (
                    <p className="m-0 mt-3 text-[var(--color-wh-fg-muted)]">
                      {tt.kurtaxeNote}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Storno-Regelwerk klar im UI */}
            <CancellationPolicyBox arrival={arrival} tt={tt} locale={locale} />
            <p className="m-0 text-sm text-[var(--color-wh-fg-muted)]">{tt.holdNotice}</p>
            {error && (
              <div className="bg-[var(--color-wh-sunset)]/10 text-[var(--color-wh-sunset)] rounded-[var(--radius-md)] p-4 text-sm font-medium">
                {error}
              </div>
            )}

            {manualTransferEligible && (
              <div className="rounded-[var(--radius-card)] bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] p-5 text-sm space-y-3">
                <p className="m-0 text-[var(--color-wh-fg-muted)]">{tt.manualTransferOverviewNote}</p>
                {manualTransferLeadOk ? (
                  <>
                    {manualTransferError && (
                      <div className="bg-[var(--color-wh-sunset)]/10 text-[var(--color-wh-sunset)] rounded-[var(--radius-md)] p-3 text-sm font-medium">
                        {manualTransferError}
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      onClick={submitManualTransfer}
                      disabled={manualTransferSubmitting}
                      iconRight={
                        manualTransferSubmitting ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : undefined
                      }
                    >
                      {manualTransferSubmitting ? tt.manualTransferSubmitting : tt.manualTransferButton}
                    </Button>
                  </>
                ) : (
                  <p className="m-0 text-[var(--color-wh-fg-muted)] italic">
                    {tt.manualTransferLeadTooShort}
                  </p>
                )}
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
                  if (submitting) return tt.redirecting;
                  const subAfter = breakdown.subtotalCents;
                  const prepayAfter = fullPaymentRequired
                    ? subAfter
                    : Math.round((subAfter * prepayPercent) / 100);
                  const totalDueAfter = fullPaymentRequired
                    ? prepayAfter + breakdown.depositCents + breakdown.kurtaxeCents
                    : prepayAfter;
                  return `${tt.payNow} — ${formatEuro(totalDueAfter, locale)}`;
                })()}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && manualTransferSuccess && (
          <div className="mt-8 space-y-6">
            <h3 className="text-[22px] sm:text-[24px] m-0">{tt.manualTransferConfirmTitle}</h3>
            <ManualTransferConfirmationPanel result={manualTransferSuccess} tt={tt} locale={locale} />
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 self-start order-first lg:order-last">
        <PriceSummary
          breakdown={breakdown}
          arrival={arrival}
          departure={departure}
          totalPersons={totalPersons}
          fullPayment={fullPaymentRequired}
          prepayPercent={prepayPercent}
          tt={tt}
          locale={locale}
        />
      </aside>
    </div>
  );
};

const Stepper = ({
  step,
  labels,
  onJump,
}: {
  step: Step;
  labels: readonly string[];
  onJump: (s: Step) => void;
}) => {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto pb-2">
      {labels.map((l, i) => {
        // Bereits erledigte Schritte sind anklickbar (zurückspringen). Vorwärts
        // geht nur über die Weiter-Buttons (Validierung).
        const canJump = i < step;
        return (
          <div key={l} className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              disabled={!canJump}
              onClick={() => canJump && onJump(i as Step)}
              className={`flex items-center gap-2 sm:gap-3 ${
                canJump ? "cursor-pointer" : "cursor-default"
              }`}
              aria-current={i === step ? "step" : undefined}
            >
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
                  i <= step
                    ? "font-semibold text-[var(--color-wh-deep-green)]"
                    : "text-[var(--color-wh-fg-muted)]"
                } ${canJump ? "hover:underline" : ""}`}
              >
                {l}
              </span>
            </button>
            {i < labels.length - 1 && (
              <span className="hidden sm:inline-block w-6 h-px bg-[var(--color-wh-winter-grey)]" />
            )}
          </div>
        );
      })}
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
        aria-label={`${ariaLess}: ${label}`}
      >
        −
      </button>
      {/* Direktes Tippen (für große Gruppen) — clamp 0..max. */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        aria-label={label}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          const n = digits === "" ? 0 : parseInt(digits, 10);
          onChange(Math.max(0, Math.min(RULES.maxPersons, n)));
        }}
        className="w-12 h-9 text-center font-semibold rounded-md border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] focus:outline-none focus:ring-2 focus:ring-[var(--color-wh-green)]"
      />
      <button
        type="button"
        className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer text-lg font-semibold"
        onClick={() => onChange(Math.min(RULES.maxPersons, value + 1))}
        aria-label={`${ariaMore}: ${label}`}
      >
        +
      </button>
    </div>
  </div>
);

const PersonsEditor = ({
  persons,
  onChange,
  tt,
}: {
  persons: Persons;
  onChange: (p: Persons) => void;
  tt: BfCopy;
}) => (
  <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4">
    {/* Vorstandsbeschluss 04.07.2026: keine nachträgliche Reduzierung —
        deutlich sichtbar VOR der Personenwahl. */}
    <p className="text-sm font-bold text-[var(--color-wh-deep-green)] bg-[var(--color-wh-beige)] rounded-md p-3 mt-0 mb-3">
      {tt.personsNoReduceNote}
    </p>
    <PersonRow
      label={tt.adultsLabel}
      hint={tt.adultsHint}
      value={persons.adults}
      onChange={(v) => onChange({ ...persons, adults: v })}
      ariaLess={tt.ariaLess}
      ariaMore={tt.ariaMore}
    />
    <PersonRow
      label={tt.childrenLabel}
      hint={tt.childrenHint}
      value={persons.children}
      onChange={(v) => onChange({ ...persons, children: v })}
      ariaLess={tt.ariaLess}
      ariaMore={tt.ariaMore}
    />
    {/* Lehrkräfte zählen einfach als Erwachsene (gleicher Preis) — kein
        eigenes Feld mehr, persons.teachers bleibt immer 0. */}
    {/* Mitglieder werden nicht hier gezählt, sondern am Ende der Buchung
        namentlich eingetragen (MemberNamesSection). Bewusst ohne Hinweis auf
        den Rabatt — die Buchung soll nicht mit der Mitgliedschaft werben. */}
  </div>
);

const MemberNamesSection = ({
  names,
  onChange,
  errors,
  countValid,
  adults,
  kids,
  bookerName,
  confirm,
  onConfirm,
  showBookerMember,
  bookerIsMember,
  onBookerIsMember,
  tried,
  tt,
}: {
  names: MemberName[];
  onChange: (n: MemberName[]) => void;
  errors: (string | null)[];
  countValid: boolean;
  adults: number;
  kids: number;
  bookerName: string;
  confirm: boolean;
  onConfirm: (v: boolean) => void;
  showBookerMember: boolean;
  bookerIsMember: boolean;
  onBookerIsMember: (v: boolean) => void;
  tried: boolean;
  tt: BfCopy;
}) => {
  const update = (i: number, patch: Partial<MemberName>) =>
    onChange(names.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const remove = (i: number) => onChange(names.filter((_, j) => j !== i));
  const kinds = countMemberKinds(names);
  const total = adults + kids;
  const canAdd = names.length < total;
  // Neue Zeile: Erwachsene/r, solange noch Erwachsene frei sind, sonst Kind.
  const nextKind: MemberName["kind"] = kinds.adults < adults ? "adult" : "child";
  const bookerListed = names.some(
    (n) => n.name.trim().toLowerCase() === bookerName.toLowerCase()
  );
  const showSelf = canAdd && kinds.adults < adults && isFullName(bookerName) && !bookerListed;
  const fieldCls =
    "h-10 rounded-md border border-[var(--color-wh-winter-grey)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-wh-green)]";

  // Schlichtes Ankreuzen statt Werbung für den Rabatt (Vorstand 11/2026):
  // Wer nicht ankreuzt, sieht nichts weiter. Abwählen verwirft die Namen.
  const [open, setOpen] = useState(names.length > 0 || bookerIsMember);
  const toggle = (v: boolean) => {
    setOpen(v);
    if (!v) {
      onChange([]);
      onBookerIsMember(false);
      onConfirm(false);
    }
  };

  return (
    <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 text-sm space-y-4">
      <div>
        <div className="font-semibold text-[var(--color-wh-deep-green)] text-base">{tt.memberNamesH}</div>
        <label className="mt-2 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => toggle(e.target.checked)}
            className="mt-1"
          />
          <span>{tt.memberCheckLabel}</span>
        </label>
      </div>

      {open && (
      <>
      <p className="m-0 text-[var(--color-wh-fg-muted)]">{tt.memberNamesIntro}</p>

      {/* Bucher/in selbst Mitglied → keine Mindestbelegung (Vorstand 11/2026). */}
      {showBookerMember && (
        <label className="flex items-start gap-3 font-medium text-[var(--color-wh-deep-green)] cursor-pointer">
          <input
            type="checkbox"
            checked={bookerIsMember}
            onChange={(e) => onBookerIsMember(e.target.checked)}
            className="mt-1"
          />
          <span>{tt.bookerMemberLabel(isFullName(bookerName) ? bookerName : "")}</span>
        </label>
      )}

      {names.length > 0 && (
        <ul className="list-none p-0 m-0 space-y-3">
          {names.map((n, i) => (
            <li key={i}>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={n.name}
                  placeholder={tt.memberNamePlaceholder}
                  aria-label={`${tt.memberNamePlaceholder} ${i + 1}`}
                  autoComplete="off"
                  maxLength={120}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className={`${fieldCls} flex-1 min-w-0`}
                />
                <div className="flex gap-2">
                  <select
                    value={n.kind}
                    aria-label={`${tt.memberKindAdult} / ${tt.memberKindChild} ${i + 1}`}
                    onChange={(e) => update(i, { kind: e.target.value as MemberName["kind"] })}
                    className={`${fieldCls} flex-1 sm:flex-none`}
                  >
                    <option value="adult">{tt.memberKindAdult}</option>
                    <option value="child">{tt.memberKindChild}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="h-10 px-3 rounded-md border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-fg-muted)] hover:bg-[var(--color-wh-beige)] cursor-pointer"
                  >
                    {tt.memberRemove}
                  </button>
                </div>
              </div>
              {tried && errors[i] && (
                <p className="m-0 mt-1 text-xs text-[var(--color-wh-sunset)]">{errors[i]}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {!countValid && (
        <p className="m-0 text-xs font-semibold text-[var(--color-wh-sunset)]">
          {tt.valMemberTooMany(adults, kids)}
        </p>
      )}

      {canAdd && (
        <div className="flex flex-wrap gap-2">
          {showSelf && (
            <button
              type="button"
              onClick={() => {
                onChange([...names, { name: bookerName, kind: "adult" }]);
                onBookerIsMember(true);
              }}
              className="h-10 px-4 rounded-md border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] font-semibold hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
            >
              {tt.memberAddSelf(bookerName)}
            </button>
          )}
          <button
            type="button"
            onClick={() => onChange([...names, { name: "", kind: nextKind }])}
            className="h-10 px-4 rounded-md border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] font-semibold hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
          >
            {tt.memberAdd}
          </button>
        </div>
      )}

      {(names.length > 0 || (showBookerMember && bookerIsMember)) && (
        <>
          <p className="m-0 text-xs text-[var(--color-wh-fg-muted)]">{tt.memberHonestyNote}</p>
          {/* Ehrlichkeitsbestätigung (Issue #66) — schafft Storno-Recht bei Falschangaben. */}
          <label className="flex items-start gap-3 text-[var(--color-wh-fg-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => onConfirm(e.target.checked)}
              className="mt-1"
            />
            <span>{tt.memberConfirmLabel}</span>
          </label>
          {tried && !confirm && (
            <p className="m-0 -mt-2 text-xs text-[var(--color-wh-sunset)]">{tt.valMemberConfirm}</p>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
};

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
  fullPayment = false,
  prepayPercent = 50,
  tt,
  locale,
}: {
  breakdown: Breakdown | null;
  arrival: string;
  departure: string;
  totalPersons: number;
  fullPayment?: boolean;
  prepayPercent?: number;
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

      {fullPayment ? (
        /* Anreise < 14 Tage: kompletter Mietpreis + Kaution sofort fällig. */
        <>
          <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
              {tt.dueTodayShort}
            </div>
            <div className="flex justify-between">
              <span>{tt.fullAmountLabel}</span>
              <span className="font-semibold">{formatEuro(breakdown.subtotalCents, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span>{tt.plusKaution}</span>
              <span className="font-semibold">{formatEuro(breakdown.depositCents, locale)}</span>
            </div>
            {breakdown.kurtaxeCents > 0 && (
              <div className="flex justify-between">
                <span>{tt.kurtaxeLabel}</span>
                <span className="font-semibold">{formatEuro(breakdown.kurtaxeCents, locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-base pt-2 border-t border-[var(--color-wh-winter-grey)]">
              <span className="font-bold">{tt.todayToPay}</span>
              <span className="font-bold text-[var(--color-wh-deep-green)]">
                {formatEuro(
                  breakdown.subtotalCents + breakdown.depositCents + breakdown.kurtaxeCents,
                  locale
                )}
              </span>
            </div>
          </div>
          <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-1 text-xs text-[var(--color-wh-fg-muted)]">
            <div>{tt.fullPaymentNote}</div>
          </div>
        </>
      ) : (
        <>
          <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
              {tt.dueTodayShort}
            </div>
            <div className="flex justify-between text-base">
              <span className="font-bold">{tt.prepayment50.replace("50", String(prepayPercent))}</span>
              <span className="font-bold text-[var(--color-wh-deep-green)]">
                {formatEuro(Math.round(breakdown.subtotalCents * prepayPercent / 100), locale)}
              </span>
            </div>
          </div>

          <div className="border-t border-[var(--color-wh-winter-grey)] mt-4 pt-4 space-y-1 text-xs text-[var(--color-wh-fg-muted)]">
            <div className="flex justify-between">
              <span>{tt.remainderBefore}</span>
              <span>
                {formatEuro(
                  breakdown.subtotalCents -
                    Math.round(breakdown.subtotalCents * prepayPercent / 100) +
                    breakdown.depositCents +
                    breakdown.kurtaxeCents,
                  locale
                )}
              </span>
            </div>
          </div>
        </>
      )}
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

const ManualTransferConfirmationPanel = ({
  result,
  tt,
  locale,
}: {
  result: Extract<ManualTransferResult, { ok: true }>;
  tt: BfCopy;
  locale: "de" | "en" | "nl";
}) => (
  <div className="rounded-[var(--radius-card)] bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] p-5 text-sm text-[var(--color-wh-black)] space-y-4">
    <p className="m-0 font-semibold text-base">
      {tt.manualTransferConfirmIntro} <span className="font-mono">{result.bookingNumber}</span>
    </p>
    <div>
      <p className="m-0 mb-2">{tt.manualTransferConfirmBankTitle}</p>
      <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] p-3 font-mono text-sm space-y-1">
        <div>{tt.manualTransferConfirmBank}: {result.bank}</div>
        <div>{tt.manualTransferConfirmIban}: {result.iban}</div>
        <div>{tt.manualTransferConfirmKontoinhaber}: {result.kontoinhaber}</div>
        <div>{tt.manualTransferConfirmVerwendungszweck}: {result.bookingNumber}</div>
      </div>
    </div>
    <p className="m-0">
      <strong>{formatEuro(result.anzahlungCents, locale)}</strong> — {tt.manualTransferConfirmAnzahlung}
    </p>
    <p className="m-0 font-semibold">
      {tt.manualTransferConfirmDeadline(
        new Date(`${result.anzahlungDeadlineIso}T00:00:00`).toLocaleDateString(
          locale === "de" ? "de-DE" : locale === "nl" ? "nl-NL" : "en-GB",
          { day: "numeric", month: "long", year: "numeric" }
        )
      )}
    </p>
    <p className="m-0">
      <strong>{formatEuro(result.restzahlungCents, locale)}</strong> —{" "}
      {tt.manualTransferConfirmRestzahlung} {result.restzahlungDeadlineIso}
    </p>
    <p className="m-0 text-[var(--color-wh-fg-muted)]">{tt.manualTransferConfirmReminderNote}</p>
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
