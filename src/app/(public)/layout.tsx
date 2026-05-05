import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { ConsentProvider } from "@/components/consent/ConsentContext";
import { CookieBanner } from "@/components/consent/CookieBanner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsentProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </ConsentProvider>
  );
}
