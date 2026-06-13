import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Caveat } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const SITE_NAME = "Wiesenhütte · Skifreunde Gütersloh e.V.";
const SITE_DESCRIPTION =
  "Selbstversorgerhütte in Langewiese, Hochsauerland. 33 Schlafplätze, direkt am Rodelhang und an der Loipe. Hier buchen.";

export const metadata: Metadata = {
  // Kein title-Template: Unterseiten tragen ihren „· Wiesenhütte"-Suffix bereits
  // selbst, ein Template würde ihn verdoppeln.
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
  // Sitewide Social-Preview. Unterseiten erben diese og:image/twitter-Defaults,
  // sofern sie kein eigenes openGraph setzen (z. B. Blog-Artikel mit Cover).
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_DE",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/media/video/hero-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "Die Wiesenhütte in Langewiese, Hochsauerland",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/media/video/hero-poster.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${bricolage.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
