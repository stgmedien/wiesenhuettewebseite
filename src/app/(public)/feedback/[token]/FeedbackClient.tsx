"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "./actions";
import type { Locale } from "@/lib/i18n-shared";

type Props = {
  token: string;
  guestName: string;
  bookingNumber: string;
  arrival: string; // ISO yyyy-mm-dd
  departure: string;
  locale: Locale;
};

type Step = number; // 0..TOTAL_STEPS
const TOTAL_STEPS = 4;

const STAR_EMPTY = "☆";
const STAR_FILL = "★";

type Copy = {
  thanks: { h: string; body: string; footer: string };
  progress: { step: string; of: string };
  bookingLabel: string;
  step0: { h1: string; intro: string };
  step1: { eye: string; h2: string; intro: string; cleanliness: string; comfort: string; location: string; communication: string; price: string };
  step2: { eye: string; h2: string; highlight: { label: string; hint: string }; improve: { label: string; hint: string }; surprise: { label: string; hint: string } };
  step3: { eye: string; h2: string; yes: string; no: string; quote: { title: string; body: string } };
  step4: { eye: string; h2: string; intro: string; namePlaceholder: string; privacy: string };
  nav: { back: string; next: string; submit: string; submitting: string };
  ratings: string[];
  error: string;
  through: string;
};

const COPY: Record<Locale, Copy> = {
  de: {
    thanks: {
      h: "Danke,",
      body: "Dein Feedback ist bei uns angekommen. Wir lesen jede einzelne Rückmeldung — und das, was Du geschrieben hast, hilft uns, die Hütte noch besser zu machen.",
      footer: "Bis bald in der Wiesenhütte.",
    },
    progress: { step: "Schritt", of: "von" },
    bookingLabel: "Buchung",
    step0: { h1: "Wie war Dein Aufenthalt?", intro: "Eine Antwort reicht uns schon — der Rest ist optional." },
    step1: {
      eye: "Im Detail",
      h2: "Was passt, was nicht?",
      intro: "Optional — überspring einfach, was Du nicht bewerten möchtest.",
      cleanliness: "Sauberkeit",
      comfort: "Ausstattung & Komfort",
      location: "Lage & Umgebung",
      communication: "Kommunikation mit uns",
      price: "Preis-Leistung",
    },
    step2: {
      eye: "In Worten",
      h2: "Erzähl uns mehr.",
      highlight: { label: "Was hat Dir besonders gut gefallen?", hint: "Eine Anekdote, ein Moment, ein Detail — alles willkommen." },
      improve: { label: "Was könnten wir besser machen?", hint: "Auch hier sind wir dankbar für jede konkrete Beobachtung." },
      surprise: { label: "Gab es etwas, das Dich überrascht hat?", hint: "Positiv oder negativ — wir lernen aus beidem." },
    },
    step3: {
      eye: "Empfehlung",
      h2: "Würdest Du die Hütte weiterempfehlen?",
      yes: "Ja, gerne",
      no: "Eher nicht",
      quote: { title: "Wir dürfen Deine Worte intern zitieren", body: "Für Vereins-Berichte oder Lessons-Learned-Runden im Vorstand. Nie öffentlich oder mit vollem Namen, nur anonymisiert." },
    },
    step4: {
      eye: "Letzter Schritt",
      h2: "Wer hat ausgefüllt?",
      intro: "Damit wir Dein Feedback richtig einordnen können — Du kannst auch anonym (Feld leer lassen) oder einen Spitznamen eintragen.",
      namePlaceholder: "Dein Name (optional)",
      privacy: "Datenschutz-Hinweis: Wir speichern Dein Feedback ausschließlich intern. Es wird nicht öffentlich gezeigt und nie mit Dritten geteilt. Wenn Du die Quote-Zustimmung gegeben hast, dürfen wir Dein Zitat anonymisiert im Vereinskontext nutzen.",
    },
    nav: { back: "← Zurück", next: "Weiter →", submit: "Feedback senden", submitting: "Wird gesendet …" },
    ratings: ["Sehr schlecht", "Schlecht", "Okay", "Gut", "Sehr gut"],
    error: "Bitte gib mindestens ein Gesamt-Rating ab.",
    through: "Vom {a} bis {b}.",
  },
  en: {
    thanks: {
      h: "Thanks,",
      body: "Your feedback has arrived. We read every single response — and what you wrote helps us make the cabin even better.",
      footer: "See you again at the Wiesenhütte.",
    },
    progress: { step: "Step", of: "of" },
    bookingLabel: "Booking",
    step0: { h1: "How was your stay?", intro: "One answer is enough — the rest is optional." },
    step1: {
      eye: "In detail",
      h2: "What worked, what didn't?",
      intro: "Optional — skip anything you don't want to rate.",
      cleanliness: "Cleanliness",
      comfort: "Amenities & comfort",
      location: "Location & surroundings",
      communication: "Communication with us",
      price: "Value for money",
    },
    step2: {
      eye: "In words",
      h2: "Tell us more.",
      highlight: { label: "What did you enjoy most?", hint: "An anecdote, a moment, a detail — all welcome." },
      improve: { label: "What could we do better?", hint: "Every concrete observation is welcome." },
      surprise: { label: "Did anything surprise you?", hint: "Positive or negative — we learn from both." },
    },
    step3: {
      eye: "Recommendation",
      h2: "Would you recommend the cabin?",
      yes: "Yes, gladly",
      no: "Probably not",
      quote: { title: "We may quote you internally", body: "For club reports or lessons-learned sessions on the board. Never publicly or with your full name, always anonymised." },
    },
    step4: {
      eye: "Final step",
      h2: "Who filled this in?",
      intro: "So we can place your feedback correctly — you can stay anonymous (leave the field blank) or use a nickname.",
      namePlaceholder: "Your name (optional)",
      privacy: "Privacy note: We store your feedback only internally. It is never shown publicly and never shared with third parties. If you gave the quote-permission, we may use your quote anonymised in the club context.",
    },
    nav: { back: "← Back", next: "Next →", submit: "Send feedback", submitting: "Sending …" },
    ratings: ["Very poor", "Poor", "Okay", "Good", "Excellent"],
    error: "Please give at least an overall rating.",
    through: "From {a} to {b}.",
  },
  nl: {
    thanks: {
      h: "Bedankt,",
      body: "Je feedback is binnen. We lezen elke reactie — wat je hebt geschreven helpt ons de hut nog beter te maken.",
      footer: "Tot snel in de Wiesenhütte.",
    },
    progress: { step: "Stap", of: "van" },
    bookingLabel: "Boeking",
    step0: { h1: "Hoe was je verblijf?", intro: "Eén antwoord is genoeg — de rest is optioneel." },
    step1: {
      eye: "In detail",
      h2: "Wat klopte, wat niet?",
      intro: "Optioneel — sla over wat je niet wilt beoordelen.",
      cleanliness: "Netheid",
      comfort: "Voorzieningen & comfort",
      location: "Ligging & omgeving",
      communication: "Communicatie met ons",
      price: "Prijs-kwaliteit",
    },
    step2: {
      eye: "In woorden",
      h2: "Vertel ons meer.",
      highlight: { label: "Wat vond je het leukste?", hint: "Een anekdote, een moment, een detail — alles is welkom." },
      improve: { label: "Wat zouden we beter kunnen doen?", hint: "Elke concrete observatie is welkom." },
      surprise: { label: "Heeft iets je verrast?", hint: "Positief of negatief — we leren van allebei." },
    },
    step3: {
      eye: "Aanbeveling",
      h2: "Zou je de hut aanbevelen?",
      yes: "Ja, graag",
      no: "Eerder niet",
      quote: { title: "We mogen je woorden intern citeren", body: "Voor verenigingsrapporten of lessons-learned binnen het bestuur. Nooit publiek of met volledige naam, alleen anoniem." },
    },
    step4: {
      eye: "Laatste stap",
      h2: "Wie heeft het ingevuld?",
      intro: "Zodat we je feedback goed kunnen plaatsen — je kunt ook anoniem (veld leeglaten) of een nickname invullen.",
      namePlaceholder: "Je naam (optioneel)",
      privacy: "Privacy-bericht: We bewaren je feedback uitsluitend intern. Deze wordt nooit publiek getoond en nooit met derden gedeeld. Als je toestemming voor citeren hebt gegeven, mogen we je quote anoniem in de verenigingscontext gebruiken.",
    },
    nav: { back: "← Terug", next: "Volgende →", submit: "Feedback verzenden", submitting: "Verzenden …" },
    ratings: ["Heel slecht", "Slecht", "Oké", "Goed", "Heel goed"],
    error: "Geef minstens een algemene beoordeling.",
    through: "Van {a} tot {b}.",
  },
};

function formatLocaleDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const localeMap = { de: "de-DE", en: "en-GB", nl: "nl-NL" } as const;
  return d.toLocaleDateString(localeMap[locale], { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Premium-Survey: Step-Wizard mit gradient Progress, Stern-Picker mit Hover-Preview,
 * sanfte Slide-Transitions zwischen Schritten. Keine Pflichtfelder außer overallRating.
 */
export function FeedbackClient({ token, guestName, bookingNumber, arrival, departure, locale }: Props) {
  const c = COPY[locale];
  const [step, setStep] = useState<Step>(0);
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [detailRatings, setDetailRatings] = useState<{
    cleanliness: number | null;
    comfort: number | null;
    location: number | null;
    communication: number | null;
    pricePerformance: number | null;
  }>({
    cleanliness: null,
    comfort: null,
    location: null,
    communication: null,
    pricePerformance: null,
  });
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [highlightText, setHighlightText] = useState("");
  const [improvementText, setImprovementText] = useState("");
  const [surpriseText, setSurpriseText] = useState("");
  const [allowQuote, setAllowQuote] = useState(false);
  const [respondentName, setRespondentName] = useState(guestName);

  const progress = ((step + 1) / (TOTAL_STEPS + 1)) * 100;

  const canAdvanceFromStep0 = overallRating !== null;

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = () => {
    if (overallRating === null) {
      setError(c.error);
      setStep(0);
      return;
    }
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("token", token);
      fd.set("respondentName", respondentName);
      fd.set("overallRating", String(overallRating));
      if (detailRatings.cleanliness !== null)
        fd.set("cleanlinessRating", String(detailRatings.cleanliness));
      if (detailRatings.comfort !== null) fd.set("comfortRating", String(detailRatings.comfort));
      if (detailRatings.location !== null) fd.set("locationRating", String(detailRatings.location));
      if (detailRatings.communication !== null)
        fd.set("communicationRating", String(detailRatings.communication));
      if (detailRatings.pricePerformance !== null)
        fd.set("pricePerformanceRating", String(detailRatings.pricePerformance));
      if (wouldRecommend !== null) fd.set("wouldRecommend", wouldRecommend ? "yes" : "no");
      if (highlightText.trim()) fd.set("highlightText", highlightText.trim());
      if (improvementText.trim()) fd.set("improvementText", improvementText.trim());
      if (surpriseText.trim()) fd.set("surpriseText", surpriseText.trim());
      if (allowQuote) fd.set("allowQuoteInternally", "on");

      const r = await submitFeedback(fd);
      if (r.ok) setSubmitted(true);
      else setError(r.error);
    });
  };

  if (submitted) {
    return (
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[28px] p-8 sm:p-12 text-center shadow-[0_8px_30px_rgba(47,74,53,0.08)]">
        <div className="text-[64px] mb-4">✨</div>
        <h2 className="font-display font-bold text-[28px] sm:text-[36px] text-[var(--color-wh-deep-green)] m-0 mb-4">
          {c.thanks.h} {respondentName || ""}!
        </h2>
        <p className="text-[16px] sm:text-[18px] text-[var(--color-wh-black)] leading-relaxed max-w-xl mx-auto m-0">
          {c.thanks.body}
        </p>
        <p className="text-[14px] text-[var(--color-wh-fg-muted)] mt-6 m-0 italic">
          {c.thanks.footer}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[28px] p-6 sm:p-10 shadow-[0_8px_30px_rgba(47,74,53,0.08)] overflow-hidden">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
          <span>
            {c.progress.step} {step + 1} {c.progress.of} {TOTAL_STEPS + 1}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-wh-beige)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-wh-deep-green)] to-[var(--color-wh-deep-green)]/70 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step 0: Overall */}
      {step === 0 && (
        <StepWrapper>
          <Eyebrow>{c.bookingLabel} {bookingNumber}</Eyebrow>
          <h1 className="font-display font-bold text-[28px] sm:text-[36px] text-[var(--color-wh-deep-green)] m-0 mb-3 leading-tight">
            {c.step0.h1}
          </h1>
          <p className="text-[15px] text-[var(--color-wh-fg-muted)] m-0 mb-8">
            {c.through
              .replace("{a}", formatLocaleDate(arrival, locale))
              .replace("{b}", formatLocaleDate(departure, locale))}{" "}
            {c.step0.intro}
          </p>
          <div className="flex justify-center mb-2">
            <StarPicker value={overallRating} onChange={setOverallRating} size="lg" />
          </div>
          {overallRating !== null && (
            <p className="text-center text-[14px] text-[var(--color-wh-deep-green)] font-semibold mt-3 m-0 animate-[fadeIn_300ms]">
              {c.ratings[overallRating - 1]}
            </p>
          )}
          {error && (
            <p className="text-center text-[13px] text-red-700 mt-4 m-0">{error}</p>
          )}
        </StepWrapper>
      )}

      {/* Step 1: Detail-Ratings */}
      {step === 1 && (
        <StepWrapper>
          <Eyebrow>{c.step1.eye}</Eyebrow>
          <h2 className="font-display font-bold text-[24px] sm:text-[28px] text-[var(--color-wh-deep-green)] m-0 mb-2">
            {c.step1.h2}
          </h2>
          <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-8">{c.step1.intro}</p>
          <div className="space-y-5">
            <DetailRating
              label={c.step1.cleanliness}
              value={detailRatings.cleanliness}
              onChange={(v) => setDetailRatings((r) => ({ ...r, cleanliness: v }))}
            />
            <DetailRating
              label={c.step1.comfort}
              value={detailRatings.comfort}
              onChange={(v) => setDetailRatings((r) => ({ ...r, comfort: v }))}
            />
            <DetailRating
              label={c.step1.location}
              value={detailRatings.location}
              onChange={(v) => setDetailRatings((r) => ({ ...r, location: v }))}
            />
            <DetailRating
              label={c.step1.communication}
              value={detailRatings.communication}
              onChange={(v) => setDetailRatings((r) => ({ ...r, communication: v }))}
            />
            <DetailRating
              label={c.step1.price}
              value={detailRatings.pricePerformance}
              onChange={(v) => setDetailRatings((r) => ({ ...r, pricePerformance: v }))}
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 2: Highlights & Verbesserung (Freitext) */}
      {step === 2 && (
        <StepWrapper>
          <Eyebrow>{c.step2.eye}</Eyebrow>
          <h2 className="font-display font-bold text-[24px] sm:text-[28px] text-[var(--color-wh-deep-green)] m-0 mb-6">
            {c.step2.h2}
          </h2>
          <div className="space-y-5">
            <TextField
              label={c.step2.highlight.label}
              hint={c.step2.highlight.hint}
              value={highlightText}
              onChange={setHighlightText}
            />
            <TextField
              label={c.step2.improve.label}
              hint={c.step2.improve.hint}
              value={improvementText}
              onChange={setImprovementText}
            />
            <TextField
              label={c.step2.surprise.label}
              hint={c.step2.surprise.hint}
              value={surpriseText}
              onChange={setSurpriseText}
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 3: Empfehlung + Quote-Permission */}
      {step === 3 && (
        <StepWrapper>
          <Eyebrow>{c.step3.eye}</Eyebrow>
          <h2 className="font-display font-bold text-[24px] sm:text-[28px] text-[var(--color-wh-deep-green)] m-0 mb-6">
            {c.step3.h2}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={`rounded-[var(--radius-md)] border-2 py-5 px-4 transition-all ${
                wouldRecommend === true
                  ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-beige)] shadow-md scale-[1.02]"
                  : "border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-deep-green)]/60"
              }`}
            >
              <div className="text-[32px] mb-2">👍</div>
              <div className="font-semibold text-[var(--color-wh-deep-green)]">{c.step3.yes}</div>
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={`rounded-[var(--radius-md)] border-2 py-5 px-4 transition-all ${
                wouldRecommend === false
                  ? "border-red-400 bg-red-50 shadow-md scale-[1.02]"
                  : "border-[var(--color-wh-winter-grey)] hover:border-red-300"
              }`}
            >
              <div className="text-[32px] mb-2">👎</div>
              <div className="font-semibold text-red-700">{c.step3.no}</div>
            </button>
          </div>

          <div className="mt-8 p-5 rounded-[var(--radius-md)] bg-[var(--color-wh-beige)]/50 border border-[var(--color-wh-winter-grey)]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowQuote}
                onChange={(e) => setAllowQuote(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <p className="m-0 text-[14px] font-medium text-[var(--color-wh-black)]">
                  {c.step3.quote.title}
                </p>
                <p className="m-0 mt-1 text-[12px] text-[var(--color-wh-fg-muted)]">
                  {c.step3.quote.body}
                </p>
              </div>
            </label>
          </div>
        </StepWrapper>
      )}

      {/* Step 4: Absenden */}
      {step === 4 && (
        <StepWrapper>
          <Eyebrow>{c.step4.eye}</Eyebrow>
          <h2 className="font-display font-bold text-[24px] sm:text-[28px] text-[var(--color-wh-deep-green)] m-0 mb-3">
            {c.step4.h2}
          </h2>
          <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-6">{c.step4.intro}</p>
          <input
            type="text"
            value={respondentName}
            onChange={(e) => setRespondentName(e.target.value)}
            placeholder={c.step4.namePlaceholder}
            maxLength={120}
            className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-4 py-3 text-[16px] bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none mb-6"
          />
          <div className="bg-[var(--color-wh-beige)]/50 rounded-[var(--radius-md)] p-5 text-[13px] text-[var(--color-wh-fg-muted)] leading-relaxed">
            {c.step4.privacy}
          </div>
          {error && (
            <p className="text-center text-[13px] text-red-700 mt-4 m-0">{error}</p>
          )}
        </StepWrapper>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-wh-winter-grey)]/40">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0 || pending}
          className="rounded-full px-4 py-2 text-sm text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {c.nav.back}
        </button>
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            disabled={(step === 0 && !canAdvanceFromStep0) || pending}
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {c.nav.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {pending ? c.nav.submitting : c.nav.submit}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[280px]" style={{ animation: "fadeInSlide 360ms ease-out" }}>
      <style jsx>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]/80 mb-3">
      <span className="inline-block w-6 h-px bg-[var(--color-wh-deep-green)]/60" />
      {children}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number | null;
  onChange: (v: number) => void;
  size?: "md" | "lg";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const dim = size === "lg" ? "text-[52px] sm:text-[64px]" : "text-[28px]";
  const display = hover ?? value ?? 0;
  return (
    <div className="inline-flex items-center gap-1 sm:gap-2" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} Sterne`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`${dim} leading-none transition-transform duration-150 hover:scale-110 ${
            n <= display ? "text-amber-500" : "text-[var(--color-wh-winter-grey)]"
          }`}
        >
          {n <= display ? STAR_FILL : STAR_EMPTY}
        </button>
      ))}
    </div>
  );
}

function DetailRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[15px] text-[var(--color-wh-black)]">{label}</span>
      <StarPicker value={value} onChange={onChange} />
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[14px] font-medium text-[var(--color-wh-black)] mb-1">
        {label}
      </label>
      {hint && <p className="m-0 mb-2 text-[12px] text-[var(--color-wh-fg-muted)]">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={4000}
        className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none text-[15px] resize-y"
      />
    </div>
  );
}
