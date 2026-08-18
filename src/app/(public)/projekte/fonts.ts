import { Fraunces } from "next/font/google";

// Eigene Schrift nur für diese eine, versteckte Seite (Look "Projektkarte
// im Hüttenstil") — bewusst nicht im Root-Layout, damit der Rest der Seite
// nicht zusätzlich Fraunces laden muss.
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
