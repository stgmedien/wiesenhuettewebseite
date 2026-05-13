import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

const PAGE_COPY: Record<Locale, { eyebrow: string; h1: string }> = {
  de: { eyebrow: "Wiesenhütte · Login", h1: "Willkommen zurück." },
  en: { eyebrow: "Wiesenhütte · Log in", h1: "Welcome back." },
  nl: { eyebrow: "Wiesenhütte · Inloggen", h1: "Welkom terug." },
};

export const metadata = { title: "Login · Wiesenhütte" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "manager" || role === "admin" ? "/m/dashboard" : "/konto");
  }
  const locale = await getServerLocale();
  const pc = PAGE_COPY[locale];

  return (
    <div className="container max-w-md mx-auto px-6 py-16">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        {pc.eyebrow}
      </p>
      <h1 className="font-heading text-4xl text-[var(--color-wh-deep-green)] mb-8">
        {pc.h1}
      </h1>
      <LoginForm locale={locale} />
    </div>
  );
}
