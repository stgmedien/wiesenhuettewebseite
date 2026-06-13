import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { ConsentProvider } from "@/components/consent/ConsentContext";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { ConsentedAnalytics } from "@/components/consent/ConsentedAnalytics";
import { auth } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getServerLocale();
  const headerSession = {
    loggedIn: !!session?.user,
    name: session?.user?.name ?? null,
    role: (session?.user as { role?: string } | undefined)?.role,
  };

  return (
    <ConsentProvider>
      <Header session={headerSession} locale={locale} />
      {/* overflow-x-clip verhindert horizontale Page-Sprenge wenn ein
          Child-Element (z.B. Stepper-Labels, lange E-Mails) die Viewport-
          Breite ueberschreitet. Wichtig: 'clip' statt 'hidden' damit
          position:sticky in den Sections weiter funktioniert. */}
      <main className="flex-1 overflow-x-clip">{children}</main>
      <Footer locale={locale} />
      <CookieBanner />
      <ConsentedAnalytics />
    </ConsentProvider>
  );
}
