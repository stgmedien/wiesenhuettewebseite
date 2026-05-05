"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, Menu, X } from "lucide-react";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-wh-snow)]/90 backdrop-blur-md border-b border-[var(--color-wh-winter-grey)]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0" onClick={() => setOpen(false)}>
          <Mountain
            className="text-[var(--color-wh-deep-green)]"
            size={26}
            strokeWidth={1.6}
          />
          <span className="font-display text-base sm:text-lg font-bold text-[var(--color-wh-deep-green)] tracking-tight leading-none">
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

        <div className="flex items-center gap-2">
          <Link
            href="/buchen"
            className="inline-flex h-10 px-4 sm:px-5 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold no-underline hover:bg-[var(--color-wh-deep-green-hover)] transition-colors whitespace-nowrap"
          >
            Buchen
          </Link>
          <button
            type="button"
            className="md:hidden inline-flex w-10 h-10 items-center justify-center rounded-md text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Menü"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-snow)]">
          <div className="max-w-[1280px] mx-auto px-5 py-3 flex flex-col">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3 py-3 text-base font-medium no-underline rounded-md transition-colors",
                    "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]",
                    active && "bg-[var(--color-wh-green-soft)]"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
