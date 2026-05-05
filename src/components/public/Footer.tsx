import Link from "next/link";
import { Mountain } from "lucide-react";

export const Footer = () => (
  <footer className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] mt-auto">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-16 grid gap-12 md:grid-cols-4">
      <div className="col-span-2">
        <div className="flex items-center gap-2.5 mb-4">
          <Mountain size={28} strokeWidth={1.6} />
          <span className="font-display text-xl font-bold tracking-tight">
            Wiesenhütte
          </span>
        </div>
        <p className="text-[var(--color-wh-snow)]/80 max-w-md text-sm leading-relaxed">
          Selbstversorgerhütte in Langewiese, Hochsauerland. Getragen vom Verein Skifreunde
          Gütersloh e.V. — gebaut, gepflegt und genutzt von Generationen.
        </p>
      </div>

      <nav className="text-sm flex flex-col gap-2">
        <span className="eyebrow text-[var(--color-wh-snow)]/70 mb-2">Hütte</span>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/buchen">
          Buchen
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/huette">
          Ausstattung
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/lage">
          Lage & Anfahrt
        </Link>
      </nav>

      <nav className="text-sm flex flex-col gap-2">
        <span className="eyebrow text-[var(--color-wh-snow)]/70 mb-2">Verein</span>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/verein">
          Skifreunde Gütersloh
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/esg">
          Tradition mit dem ESG
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/kontakt">
          Kontakt
        </Link>
      </nav>
    </div>
    <div className="border-t border-[var(--color-wh-snow)]/10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[var(--color-wh-snow)]/70">
        <span>© {new Date().getFullYear()} Skifreunde Gütersloh e.V.</span>
        <nav className="flex gap-6">
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/impressum">
            Impressum
          </Link>
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/datenschutz">
            Datenschutz
          </Link>
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/agb">
            AGB
          </Link>
        </nav>
      </div>
    </div>
  </footer>
);
