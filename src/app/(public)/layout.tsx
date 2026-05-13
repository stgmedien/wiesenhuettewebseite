import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { ConsentProvider } from "@/components/consent/ConsentContext";
import { CookieBanner } from "@/components/consent/CookieBanner";
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
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
      <CookieBanner />
    </ConsentProvider>
  );
}
