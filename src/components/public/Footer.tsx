import Link from "next/link";
import { Mountain } from "lucide-react";
import { CookieSettingsLink } from "@/components/consent/CookieBanner";

export const Footer = () => (
  <footer className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] mt-auto">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-14 sm:py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2.5 mb-4">
          <Mountain size={28} strokeWidth={1.6} className="text-[var(--color-wh-snow)]" />
          <span className="font-display text-xl font-bold tracking-tight text-[var(--color-wh-snow)]">
            Wiesenhütte
          </span>
        </div>
        <p className="text-[var(--color-wh-snow)]/80 max-w-md text-sm leading-relaxed m-0">
          Selbstversorgerhütte in Langewiese, Hochsauerland. Getragen vom Verein Skifreunde
          Gütersloh e.V. — gebaut, gepflegt und genutzt von Generationen.
        </p>
      </div>

      <nav className="text-sm flex flex-col gap-2 items-start">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-wh-snow)]/70 mb-2">
          Hütte
        </span>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/buchen">
          Buchen
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/huette">
          Ausstattung
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/lage">
          Lage & Anfahrt
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/wandertouren">
          Wandertouren
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/packliste">
          Packliste
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/hausordnung">
          Hausordnung
        </Link>
      </nav>

      <nav className="text-sm flex flex-col gap-2 items-start">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-wh-snow)]/70 mb-2">
          Verein
        </span>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/verein">
          Skifreunde Gütersloh
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/schulprojekt">
          Schulprojekt mit dem ESG
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/blog">
          Blog
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/gaestebuch">
          Gästebuch
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/kontakt">
          Kontakt
        </Link>
      </nav>
    </div>

    <div className="border-t border-[var(--color-wh-snow)]/10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between text-xs text-[var(--color-wh-snow)]/70">
        <span>© {new Date().getFullYear()} Skifreunde Gütersloh e.V.</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/impressum">
            Impressum
          </Link>
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/datenschutz">
            Datenschutz
          </Link>
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/agb">
            AGB
          </Link>
          <CookieSettingsLink />
        </nav>
      </div>
    </div>
  </footer>
);
