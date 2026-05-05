"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/huette", label: "Hütte" },
  { href: "/verein", label: "Verein" },
  { href: "/esg", label: "ESG" },
  { href: "/lage", label: "Lage" },
  { href: "/kontakt", label: "Kontakt" },
];

export const Header = () => {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-[var(--color-wh-snow)]/80 backdrop-blur-md border-b border-[var(--color-wh-winter-grey)]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Mountain
            className="text-[var(--color-wh-deep-green)]"
            size={26}
            strokeWidth={1.6}
          />
          <span className="font-display text-lg font-bold text-[var(--color-wh-deep-green)] tracking-tight leading-none">
            Wiesenhütte
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium no-underline rounded-md transition-colors",
                  "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]",
                  active && "bg-[var(--color-wh-green-soft)]"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/buchen"
          className="inline-flex h-10 px-5 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold no-underline hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
        >
          Verfügbarkeit prüfen
        </Link>
      </div>
    </header>
  );
};
