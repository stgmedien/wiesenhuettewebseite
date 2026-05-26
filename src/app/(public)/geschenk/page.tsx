import Link from "next/link";
import { Flame, Mountain, Sparkles, ShieldCheck, Clock3, Mail, Coins, ArrowRight } from "lucide-react";
import { PurchaseClient } from "./PurchaseClient";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { ScrollReveal } from "@/components/public/ScrollReveal";

export const dynamic = "force-static";

export const metadata = {
  title: "Geschenk-Gutschein · Wiesenhütte",
  description:
    "Verschenke einen Aufenthalt in der Wiesenhütte. Online kaufen, sofort per E-Mail an die Beschenkten — oder ausdrucken und persönlich überreichen.",
};

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    h1l1: string;
    h1l2: string;
    h1l3: string;
    lead: string;
    scrollCta: string;
    // Anatomy
    anaEyebrow: string;
    anaH2: string;
    anaBody: string;
    ana: { emoji: string; gradient: string; h: string; body: string }[];
    // Buy
    buyEyebrow: string;
    buyH2: string;
    buyBody: string;
    // Trust
    trust: { icon: "shield" | "clock" | "mail" | "coins"; h: string; body: string }[];
    // Closing
    closingEyebrow: string;
    closingH: string;
    closingBody: string;
    closingCta: string;
  }
> = {
  de: {
    eyebrow: "Verschenken",
    h1l1: "Statt schon",
    h1l2: "wieder Socken:",
    h1l3: "drei Tage Hütte.",
    lead: "Drei Generationen am Kachelofen, ein Wald voller Pfade, ein Lager voller Vorfreude. Du wählst den Betrag — wir kümmern uns um den Rest.",
    scrollCta: "Jetzt verschenken",
    anaEyebrow: "Was Du verschenkst",
    anaH2: "Mehr als nur Übernachtungen.",
    anaBody: "Eine Wiesenhütten-Nacht ist nichts, was man bei Amazon klickt. Sie ist ein Versprechen — auf Stille, Holz, Schnee und das, was zwischen den Menschen passiert, wenn das Handy keinen Empfang hat.",
    ana: [
      {
        emoji: "🔥",
        gradient: "from-amber-400/40 via-orange-400/25 to-rose-400/15",
        h: "Drei Generationen am Kachelofen",
        body: "Das alte Haus knackt nachts im Holz. Großeltern erzählen Geschichten von früher, Kinder klettern auf den Schoß. Was Du verschenkst, ist nicht das Zimmer — es ist diese Stunde.",
      },
      {
        emoji: "🥾",
        gradient: "from-emerald-400/40 via-teal-300/25 to-sky-300/15",
        h: "Wege, die niemand sonst kennt",
        body: "Vom Kahler Asten bis zur Lennequelle, durch Hochheide, vorbei am Astenturm. Ohne Touri-Bus, ohne App-Empfehlung — nur die, die wir Euch in die Hand drücken.",
      },
      {
        emoji: "✨",
        gradient: "from-indigo-400/40 via-violet-300/25 to-fuchsia-300/15",
        h: "Sterne, die man in der Stadt vergisst",
        body: "Wenn nachts das Licht aus ist, sieht man die Milchstraße über dem Schnee. Drei Tage reichen, um sich daran zu erinnern, wie viel davon eigentlich da ist.",
      },
    ],
    buyEyebrow: "Wertbetrag wählen",
    buyH2: "Wie viel soll's sein?",
    buyBody: "Wähle Betrag, wähle Versandart, schreibe eine Nachricht. Live-Vorschau rechts zeigt Dir, wie der fertige Gutschein aussieht.",
    trust: [
      { icon: "shield", h: "Sicher per Stripe", body: "Zahlung über den Marktführer für Online-Payment — Deine Daten bleiben verschlüsselt." },
      { icon: "clock", h: "3 Jahre gültig", body: "Ab Ausstellungsdatum. Genug Zeit, einen passenden Termin zu finden." },
      { icon: "mail", h: "Sofort per Mail", body: "Code direkt nach Zahlung — oder druckbares PDF zum persönlichen Überreichen." },
      { icon: "coins", h: "Partiell einlösbar", body: "Wird nicht der ganze Betrag genutzt, bleibt der Rest auf dem Code, bis er aufgebraucht ist." },
    ],
    closingEyebrow: "Fragen?",
    closingH: "Schreib uns einfach.",
    closingBody: "Verschenken soll Freude machen — nicht Kopfzerbrechen. Wenn etwas unklar ist, schreib uns kurz, wir antworten meistens am selben Tag.",
    closingCta: "Kontakt aufnehmen",
  },
  en: {
    eyebrow: "Gifting",
    h1l1: "Instead of",
    h1l2: "socks again:",
    h1l3: "three days at the cabin.",
    lead: "Three generations around the tile stove, a forest full of trails, a dormitory full of family joy. You choose the amount — we handle the rest.",
    scrollCta: "Give now",
    anaEyebrow: "What you're giving",
    anaH2: "More than just overnight stays.",
    anaBody: "A night at the Wiesenhütte isn't something you click into a cart. It's a promise — of quiet, wood, snow, and the things that happen between people when phones have no signal.",
    ana: [
      {
        emoji: "🔥",
        gradient: "from-amber-400/40 via-orange-400/25 to-rose-400/15",
        h: "Three generations by the fire",
        body: "The old house creaks in the wood at night. Grandparents tell stories from before, kids climb onto laps. What you give isn't the room — it's that hour.",
      },
      {
        emoji: "🥾",
        gradient: "from-emerald-400/40 via-teal-300/25 to-sky-300/15",
        h: "Trails no one else knows",
        body: "From the Kahler Asten to the source of the Lenne, across heath and past the Asten tower. No tourist bus, no app recommendation — only the routes we hand you ourselves.",
      },
      {
        emoji: "✨",
        gradient: "from-indigo-400/40 via-violet-300/25 to-fuchsia-300/15",
        h: "Stars you forget in the city",
        body: "When the lights are out at night, you can see the Milky Way above the snow. Three days are enough to remember how much of it is actually up there.",
      },
    ],
    buyEyebrow: "Choose an amount",
    buyH2: "How much shall it be?",
    buyBody: "Pick a value, pick a delivery method, write a note. The live preview on the right shows you what the finished voucher will look like.",
    trust: [
      { icon: "shield", h: "Stripe-secure", body: "Payment via the leading online-payment provider — your data stays encrypted." },
      { icon: "clock", h: "Valid for 3 years", body: "From the issue date. Plenty of time to find a date that works." },
      { icon: "mail", h: "Email-instant", body: "Code right after payment — or a printable PDF to hand over in person." },
      { icon: "coins", h: "Partial redemption", body: "If not all of it is used, the rest stays on the code until it runs out." },
    ],
    closingEyebrow: "Questions?",
    closingH: "Just drop us a line.",
    closingBody: "Gifting should be a pleasure, not a headache. If anything is unclear, write us — we usually answer the same day.",
    closingCta: "Contact us",
  },
  nl: {
    eyebrow: "Cadeau",
    h1l1: "In plaats van",
    h1l2: "alweer sokken:",
    h1l3: "drie dagen hut.",
    lead: "Drie generaties bij de kachel, een bos vol paden, een slaapzaal vol voorpret. Jij kiest het bedrag — wij regelen de rest.",
    scrollCta: "Nu cadeau geven",
    anaEyebrow: "Wat je geeft",
    anaH2: "Meer dan alleen overnachtingen.",
    anaBody: "Een nacht in de Wiesenhütte klik je niet in een winkelmandje. Het is een belofte — van rust, hout, sneeuw, en alles wat tussen mensen gebeurt als de telefoon geen bereik heeft.",
    ana: [
      {
        emoji: "🔥",
        gradient: "from-amber-400/40 via-orange-400/25 to-rose-400/15",
        h: "Drie generaties bij het vuur",
        body: "Het oude huis kraakt 's nachts in het hout. Grootouders vertellen verhalen van vroeger, kinderen klimmen op schoot. Wat je geeft is niet de kamer — het is dat uur.",
      },
      {
        emoji: "🥾",
        gradient: "from-emerald-400/40 via-teal-300/25 to-sky-300/15",
        h: "Paden die niemand anders kent",
        body: "Van de Kahler Asten tot de bron van de Lenne, door hoogvenen, langs de Astentoren. Geen touringcar, geen app — alleen de routes die wij je zelf in de hand drukken.",
      },
      {
        emoji: "✨",
        gradient: "from-indigo-400/40 via-violet-300/25 to-fuchsia-300/15",
        h: "Sterren die je in de stad vergeet",
        body: "Als 's nachts het licht uit is, zie je de Melkweg boven de sneeuw. Drie dagen zijn genoeg om je te herinneren hoeveel er daarboven is.",
      },
    ],
    buyEyebrow: "Bedrag kiezen",
    buyH2: "Hoeveel mag het zijn?",
    buyBody: "Kies een bedrag, kies een verzendmethode, schrijf een berichtje. De live-voorbeeld rechts laat zien hoe de uiteindelijke cadeaubon eruitziet.",
    trust: [
      { icon: "shield", h: "Veilig via Stripe", body: "Betaling via de marktleider voor online-betaling — je gegevens blijven versleuteld." },
      { icon: "clock", h: "3 jaar geldig", body: "Vanaf de uitgiftedatum. Genoeg tijd om een passende datum te vinden." },
      { icon: "mail", h: "Direct per mail", body: "Code meteen na betaling — of een afdrukbare PDF om persoonlijk te overhandigen." },
      { icon: "coins", h: "Gedeeltelijk inwisselbaar", body: "Wordt het bedrag niet helemaal opgebruikt, blijft de rest op de code staan tot het op is." },
    ],
    closingEyebrow: "Vragen?",
    closingH: "Stuur ons gewoon een berichtje.",
    closingBody: "Cadeau geven moet leuk zijn, geen gedoe. Als iets onduidelijk is, schrijf ons — meestal antwoorden we dezelfde dag.",
    closingCta: "Contact opnemen",
  },
};

const TRUST_ICONS = {
  shield: ShieldCheck,
  clock: Clock3,
  mail: Mail,
  coins: Coins,
} as const;

export default async function GeschenkPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] overflow-x-clip">
      {/* ============= HERO ============= */}
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        {/* Background layers: warm gradient (fire glow) + cool gradient (snow night) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-wh-deep-green)] via-[#3a5a3f] to-[#1c2e23]" />
        {/* Fire glow from bottom-right */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 80% 95%, rgba(255,170,90,0.45) 0px, transparent 50%), radial-gradient(ellipse at 15% 20%, rgba(180,200,255,0.18) 0px, transparent 45%)",
          }}
        />
        {/* Snow flakes scattered */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 24%, rgba(255,255,255,0.6) 1px, transparent 1.5px)," +
              "radial-gradient(circle at 67% 18%, rgba(255,255,255,0.5) 1px, transparent 1.5px)," +
              "radial-gradient(circle at 88% 41%, rgba(255,255,255,0.55) 1px, transparent 1.5px)," +
              "radial-gradient(circle at 31% 62%, rgba(255,255,255,0.45) 1px, transparent 1.5px)," +
              "radial-gradient(circle at 54% 78%, rgba(255,255,255,0.5) 1px, transparent 1.5px)," +
              "radial-gradient(circle at 22% 88%, rgba(255,255,255,0.4) 1px, transparent 1.5px)",
            backgroundSize: "120% 120%",
          }}
          aria-hidden
        />
        {/* Mountain silhouette */}
        <svg
          className="absolute bottom-0 left-0 w-full opacity-40 pointer-events-none"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ height: "32%" }}
          aria-hidden
        >
          <path
            fill="rgba(0,0,0,0.45)"
            d="M0,240 L180,180 L320,220 L470,150 L620,190 L780,140 L920,200 L1070,160 L1240,210 L1440,180 L1440,320 L0,320 Z"
          />
        </svg>

        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pb-16 sm:pb-24 pt-32 z-10 w-full">
          <ScrollReveal>
            <div className="inline-block px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-[var(--color-wh-snow)] text-[11px] uppercase tracking-[0.2em] font-semibold mb-7">
              {c.eyebrow}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <h1
              className="font-display font-extrabold uppercase tracking-tight text-[var(--color-wh-snow)] m-0 leading-[0.92]"
              style={{
                fontSize: "clamp(44px, 8vw, 116px)",
                letterSpacing: "-0.03em",
              }}
            >
              {c.h1l1}
              <br />
              {c.h1l2}
              <br />
              <span className="text-[var(--color-wh-sunset)]">{c.h1l3}</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={280}>
            <p className="text-[var(--color-wh-snow)]/90 text-base sm:text-[19px] leading-relaxed max-w-xl mt-8 m-0 drop-shadow">
              {c.lead}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={420}>
            <div className="mt-10">
              <a
                href="#buy"
                className="inline-flex items-center gap-2 h-13 sm:h-14 px-7 rounded-full bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-colors shadow-[var(--shadow-float)]"
              >
                {c.scrollCta}
                <ArrowRight size={18} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============= ANATOMY ============= */}
      <section className="px-6 sm:px-8 py-24 sm:py-32">
        <div className="max-w-[1080px] mx-auto">
          <ScrollReveal>
            <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.anaEyebrow}</div>
            <h2
              className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-6 leading-[1.05]"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
            >
              {c.anaH2}
            </h2>
            <p className="text-[var(--color-wh-black)] text-base sm:text-lg leading-relaxed m-0 mb-14 max-w-2xl">
              {c.anaBody}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {c.ana.map((card, i) => (
              <ScrollReveal key={i} delay={i * 120} as="article">
                <div
                  className={`relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br ${card.gradient} p-7 sm:p-8 flex flex-col justify-between border border-[var(--color-wh-winter-grey)] shadow-[0_16px_44px_rgba(47,74,53,0.10)] hover:shadow-[0_24px_60px_rgba(47,74,53,0.16)] transition-shadow`}
                >
                  <div
                    className="absolute top-6 right-6 leading-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                    style={{ fontSize: "clamp(60px, 8vw, 96px)" }}
                  >
                    {card.emoji}
                  </div>
                  <div className="relative mt-auto">
                    <h3
                      className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-3 leading-[1.1]"
                      style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}
                    >
                      {card.h}
                    </h3>
                    <p className="text-[var(--color-wh-black)]/90 text-[14px] sm:text-[15px] leading-relaxed m-0">
                      {card.body}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============= BUY (Form + Live Preview) ============= */}
      <section id="buy" className="relative px-6 sm:px-8 py-20 sm:py-28 bg-[var(--color-wh-beige)] scroll-mt-24">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.buyEyebrow}</div>
              <h2
                className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-4 leading-tight"
                style={{ fontSize: "clamp(30px, 4.5vw, 52px)", letterSpacing: "-0.02em" }}
              >
                {c.buyH2}
              </h2>
              <p className="text-[var(--color-wh-black)] text-base sm:text-lg leading-relaxed m-0 max-w-2xl mx-auto">
                {c.buyBody}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <PurchaseClient locale={locale} />
          </ScrollReveal>
        </div>
      </section>

      {/* ============= TRUST ============= */}
      <section className="px-6 sm:px-8 py-20 sm:py-24 bg-[var(--color-wh-snow)]">
        <div className="max-w-[1080px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {c.trust.map((t, i) => {
              const Icon = TRUST_ICONS[t.icon];
              return (
                <ScrollReveal key={i} delay={i * 80}>
                  <div className="flex flex-col items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] flex items-center justify-center">
                      <Icon size={22} strokeWidth={1.6} />
                    </div>
                    <h3 className="font-display font-bold text-[var(--color-wh-deep-green)] text-[17px] sm:text-[19px] m-0 leading-tight">
                      {t.h}
                    </h3>
                    <p className="text-[var(--color-wh-black)]/85 text-[13px] sm:text-[14px] leading-relaxed m-0">
                      {t.body}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============= CLOSING ============= */}
      <section className="relative overflow-hidden px-6 sm:px-8 py-20 sm:py-28 bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 30%, rgba(247,247,242,0.5) 0px, transparent 55%), radial-gradient(circle at 80% 70%, rgba(255,170,90,0.3) 0px, transparent 50%)",
          }}
        />
        <div className="relative max-w-[680px] mx-auto text-center">
          <ScrollReveal>
            <Sparkles size={42} className="mx-auto mb-6 opacity-80" strokeWidth={1.2} />
            <div className="text-[11px] uppercase tracking-[0.25em] font-semibold opacity-70 mb-3">
              {c.closingEyebrow}
            </div>
            <h2
              className="font-display font-bold m-0 mb-5 leading-tight text-[var(--color-wh-snow)]"
              style={{ fontSize: "clamp(28px, 4.5vw, 48px)", letterSpacing: "-0.02em" }}
            >
              {c.closingH}
            </h2>
            <p className="text-[var(--color-wh-snow)]/85 text-base sm:text-lg leading-relaxed m-0 mb-9 max-w-lg mx-auto">
              {c.closingBody}
            </p>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-colors shadow-[var(--shadow-float)]"
            >
              {c.closingCta}
              <ArrowRight size={18} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Helper icons (force imports) */}
      <span className="sr-only" aria-hidden>
        <Flame /> <Mountain />
      </span>
    </div>
  );
}
