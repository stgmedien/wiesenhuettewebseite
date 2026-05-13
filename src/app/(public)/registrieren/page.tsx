import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "./SignupForm";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

const PAGE_COPY: Record<Locale, { eyebrow: string; h1: string; lead: string }> = {
  de: {
    eyebrow: "Wiesenhütte · Registrierung",
    h1: "Konto anlegen.",
    lead: "Mit einem Konto siehst Du Deine Buchungen, Anfragen und kannst Folgebuchungen schneller abschließen.",
  },
  en: {
    eyebrow: "Wiesenhütte · Sign up",
    h1: "Create an account.",
    lead: "With an account you can see your bookings, enquiries and complete follow-up bookings faster.",
  },
  nl: {
    eyebrow: "Wiesenhütte · Registreren",
    h1: "Account aanmaken.",
    lead: "Met een account zie je je boekingen en aanvragen, en kun je vervolgboekingen sneller afronden.",
  },
};

export const metadata = { title: "Konto anlegen · Wiesenhütte" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/konto");
  const locale = await getServerLocale();
  const pc = PAGE_COPY[locale];

  return (
    <div className="container max-w-md mx-auto px-6 py-16">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        {pc.eyebrow}
      </p>
      <h1 className="font-heading text-4xl text-[var(--color-wh-deep-green)] mb-3">
        {pc.h1}
      </h1>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-8">
        {pc.lead}
      </p>
      <SignupForm locale={locale} />
    </div>
  );
}
