import { isNotNull } from "drizzle-orm";
import { Bike, Mail, Users, Sandwich } from "lucide-react";
import { db } from "@/lib/db";
import { rideInterests } from "@/lib/db/schema-rad";
import { upcomingWeekends, formatSlotLabel, RAD_MATCH_THRESHOLD } from "@/lib/rad";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { RadForm, type RadFormCopy } from "./RadForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Radtouren-Matching · Wiesenhütte",
  description:
    "Gemeinsame Rad-Wochenenden an der Wiesenhütte in Langewiese: Wunsch-Termine anklicken, E-Mail hinterlassen — ab 8 Personen wird gebucht. Mit Gerke-Lunchpaket.",
};

type Copy = {
  eyebrow: string;
  h1: string;
  lead: string;
  steps: Array<{ title: string; body: string }>;
  formH: string;
  form: RadFormCopy;
  status: { mail: string; fehler: string; mailfehler: string };
};

const COPY: Record<Locale, Copy> = {
  de: {
    eyebrow: "Radtouren · Matching",
    h1: "Gemeinsam aufs Rad — ab 8 wird gebucht.",
    lead: "Das Hochsauerland rund um Langewiese ist ein großartiges Radrevier — und die Wiesenhütte das perfekte Basislager. Wenn Dir allein die Mitfahrer:innen fehlen: Klick Deine Wunsch-Wochenenden an und hinterlass Deine E-Mail. Sobald sich 8 oder mehr für denselben Zeitraum gefunden haben, verbinden wir Euch — und Ihr übernehmt die Hütte zusammen.",
    steps: [
      { title: "Zeiträume anklicken", body: "Wähle die Wochenenden aus, an denen Du könntest — gerne mehrere, das erhöht die Chance auf ein Match." },
      { title: "Match abwarten", body: "Sobald 8 oder mehr Radbegeisterte denselben Zeitraum gewählt haben, bekommt Ihr alle automatisch eine Mail und werdet verbunden." },
      { title: "Buchen & losfahren", body: "Eine Person bucht das Wochenende für die Gruppe. Auf Wunsch mit Lunchpaket der Bäckerei Gerke gegenüber — z. B. Brotzeit mit Frikadellen." },
    ],
    formH: "Mitmachen",
    form: {
      slotsLabel: "Deine Wunsch-Wochenenden (Fr–So)",
      interested: "{n} interessiert",
      nameLabel: "Vorname",
      emailLabel: "E-Mail",
      lunchLabel: "Ich hätte Interesse am Gerke-Lunchpaket für die Tour (z. B. Brotzeit mit Frikadellen).",
      consentLabel: "Ich bin einverstanden, dass meine E-Mail-Adresse beim Zustandekommen einer Gruppe (ab 8 Personen) mit den anderen Teilnehmer:innen dieses Zeitraums geteilt wird, damit wir uns abstimmen können. Austragen jederzeit per Mail an info@skifreunde-gt.de.",
      submit: "Interesse eintragen",
      hint: "Du bekommst eine Bestätigungs-Mail (Double-Opt-in).",
    },
    status: {
      mail: "Fast geschafft! Wir haben Dir eine Bestätigungs-Mail geschickt — bitte klicke den Link darin.",
      fehler: "Bitte wähle mindestens ein Wochenende, gib eine gültige E-Mail an und bestätige die Einverständnis-Box.",
      mailfehler: "Dein Eintrag ist gespeichert, aber die Bestätigungs-Mail konnte nicht gesendet werden. Bitte versuch es später erneut oder schreib an info@skifreunde-gt.de.",
    },
  },
  en: {
    eyebrow: "Bike tours · Matching",
    h1: "Ride together — once you're 8, we book.",
    lead: "The Hochsauerland around Langewiese is superb cycling country — and the Wiesenhütte the perfect base camp. If all you're missing is company: tick your preferred weekends and leave your email. As soon as 8 or more pick the same dates, we connect you — and you take over the cabin together.",
    steps: [
      { title: "Pick weekends", body: "Choose the weekends that work for you — several, ideally, to raise the chance of a match." },
      { title: "Wait for the match", body: "Once 8 or more cyclists have picked the same weekend, all of you automatically get an email and are connected." },
      { title: "Book & ride", body: "One person books the weekend for the group. Optionally with a lunch package from the Gerke bakery across the road." },
    ],
    formH: "Join in",
    form: {
      slotsLabel: "Your preferred weekends (Fri–Sun)",
      interested: "{n} interested",
      nameLabel: "First name",
      emailLabel: "Email",
      lunchLabel: "I'd be interested in the Gerke lunch package for the tour.",
      consentLabel: "I agree that my email address will be shared with the other participants of a matched weekend (8+ people) so we can coordinate. Opt out anytime via info@skifreunde-gt.de.",
      submit: "Register interest",
      hint: "You'll receive a confirmation email (double opt-in).",
    },
    status: {
      mail: "Almost there! We've sent you a confirmation email — please click the link inside.",
      fehler: "Please pick at least one weekend, enter a valid email and tick the consent box.",
      mailfehler: "Your entry is saved, but the confirmation email could not be sent. Please try again later or write to info@skifreunde-gt.de.",
    },
  },
  nl: {
    eyebrow: "Fietstochten · Matching",
    h1: "Samen fietsen — vanaf 8 wordt geboekt.",
    lead: "Het Hochsauerland rond Langewiese is fantastisch fietsgebied — en de Wiesenhütte het perfecte basiskamp. Ontbreekt alleen het gezelschap? Vink je voorkeursweekenden aan en laat je e-mail achter. Zodra 8 of meer dezelfde data kiezen, brengen we jullie samen — en nemen jullie de hut samen over.",
    steps: [
      { title: "Weekenden aanvinken", body: "Kies de weekenden die jou passen — het liefst meerdere, dat vergroot de kans op een match." },
      { title: "Wachten op de match", body: "Zodra 8 of meer fietsers hetzelfde weekend kiezen, krijgen jullie allemaal automatisch een mail en worden jullie verbonden." },
      { title: "Boeken & rijden", body: "Eén persoon boekt het weekend voor de groep. Desgewenst met lunchpakket van bakkerij Gerke aan de overkant." },
    ],
    formH: "Doe mee",
    form: {
      slotsLabel: "Jouw voorkeursweekenden (vr–zo)",
      interested: "{n} geïnteresseerd",
      nameLabel: "Voornaam",
      emailLabel: "E-mail",
      lunchLabel: "Ik heb interesse in het Gerke-lunchpakket voor de tocht.",
      consentLabel: "Ik ga ermee akkoord dat mijn e-mailadres bij een match (8+ personen) wordt gedeeld met de andere deelnemers van dat weekend, zodat we kunnen afstemmen. Uitschrijven kan altijd via info@skifreunde-gt.de.",
      submit: "Interesse doorgeven",
      hint: "Je ontvangt een bevestigingsmail (double opt-in).",
    },
    status: {
      mail: "Bijna klaar! We hebben je een bevestigingsmail gestuurd — klik op de link daarin.",
      fehler: "Kies minstens één weekend, vul een geldig e-mailadres in en vink de toestemmingsbox aan.",
      mailfehler: "Je inschrijving is opgeslagen, maar de bevestigingsmail kon niet worden verzonden. Probeer het later opnieuw of mail naar info@skifreunde-gt.de.",
    },
  },
};

export default async function RadtourenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const locale = await getServerLocale();
  const c = COPY[locale];
  const { status } = await searchParams;

  // Bestätigte Interessen zählen — pro Slot ein Live-Zähler im Formular.
  const slots = upcomingWeekends();
  const verified = await db
    .select({ slots: rideInterests.slots, email: rideInterests.email })
    .from(rideInterests)
    .where(isNotNull(rideInterests.verifiedAt));
  const countFor = (slotId: string) =>
    new Set(verified.filter((v) => (v.slots ?? []).includes(slotId)).map((v) => v.email)).size;

  const formSlots = slots.map((s) => ({
    id: s.id,
    label: formatSlotLabel(s, locale),
    count: countFor(s.id),
  }));

  const statusMsg =
    status === "mail"
      ? { tone: "ok" as const, text: c.status.mail }
      : status === "fehler"
        ? { tone: "err" as const, text: c.status.fehler }
        : status === "mailfehler"
          ? { tone: "err" as const, text: c.status.mailfehler }
          : null;

  const stepIcons = [Users, Mail, Sandwich];

  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="flex items-center gap-2.5 eyebrow text-[var(--color-wh-snow)]/80">
            <Bike size={16} className="shrink-0" />
            {c.eyebrow}
          </div>
          <h1 className="text-[var(--color-wh-snow)] mt-4 text-[36px] sm:text-[56px] leading-tight">
            {c.h1}
          </h1>
          <p className="text-[var(--color-wh-snow)]/85 max-w-2xl text-base sm:text-[18px] leading-relaxed mt-4">
            {c.lead}
          </p>
        </div>
      </section>

      {/* 3 Schritte */}
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-14 sm:py-20">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {c.steps.map((s, i) => {
            const Icon = stepIcons[i] ?? Users;
            return (
              <div
                key={s.title}
                className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <Icon size={20} className="text-[var(--color-wh-deep-green)]" />
                </div>
                <h3 className="font-display font-bold text-[19px] text-[var(--color-wh-deep-green)] m-0 mb-2">
                  {s.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-[var(--color-wh-black)] m-0">
                  {s.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Formular */}
      <section id="mitmachen" className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[820px] mx-auto">
          <h2 className="text-[28px] sm:text-[36px] mt-0 mb-6">{c.formH}</h2>

          {statusMsg && (
            <div
              role={statusMsg.tone === "ok" ? "status" : "alert"}
              className={
                "mb-8 rounded-[var(--radius-card)] px-5 py-4 font-medium border " +
                (statusMsg.tone === "ok"
                  ? "bg-[var(--color-wh-green-soft)] border-[var(--color-wh-green)]/50 text-[var(--color-wh-deep-green)]"
                  : "bg-[var(--color-wh-beige)] border-[var(--color-wh-sunset)]/60 text-[var(--color-wh-sunset)]")
              }
            >
              {statusMsg.text}
            </div>
          )}

          <RadForm slots={formSlots} copy={c.form} />

          <p className="text-[13px] text-[var(--color-wh-fg-muted)] mt-8 m-0">
            {locale === "de"
              ? `Ein Slot matcht ab ${RAD_MATCH_THRESHOLD} bestätigten Personen. Die Buchung läuft danach ganz normal über das Buchungstool — zu den regulären Konditionen.`
              : locale === "nl"
                ? `Een weekend matcht vanaf ${RAD_MATCH_THRESHOLD} bevestigde personen. Daarna verloopt het boeken gewoon via de boekingstool — tegen de normale voorwaarden.`
                : `A weekend matches from ${RAD_MATCH_THRESHOLD} confirmed people. Booking then runs through the regular booking tool at the normal conditions.`}
          </p>
        </div>
      </section>
    </div>
  );
}
