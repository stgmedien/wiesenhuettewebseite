"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[padding] duration-300",
        scrolled ? "px-3 sm:px-4 pt-3" : "px-0 pt-0"
      )}
    >
      <div
        className={cn(
          "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] transition-all duration-300",
          scrolled
            ? "mx-auto max-w-[980px] rounded-full shadow-[0_12px_32px_rgba(17,17,17,0.18),0_4px_10px_rgba(17,17,17,0.08)]"
            : "w-full rounded-none"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300",
            scrolled
              ? "h-14 px-4 sm:px-5"
              : "max-w-[1280px] mx-auto h-16 px-5 sm:px-6 lg:px-8"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 no-underline text-[var(--color-wh-snow)] shrink-0"
            onClick={() => setOpen(false)}
          >
            <Mountain size={24} strokeWidth={1.6} />
            <span className="font-display text-base sm:text-lg font-bold tracking-tight leading-none">
              Wiesenhütte
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium no-underline rounded-full transition-colors",
                    "text-[var(--color-wh-snow)]/90 hover:text-[var(--color-wh-snow)] hover:bg-white/12",
                    active && "bg-white/15 text-[var(--color-wh-snow)]"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/buchen"
              className="inline-flex h-9 sm:h-10 px-4 sm:px-5 items-center rounded-full bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] text-sm font-semibold no-underline hover:bg-white transition-colors whitespace-nowrap"
            >
              Buchen
            </Link>
            <button
              type="button"
              className="md:hidden inline-flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-full text-[var(--color-wh-snow)] hover:bg-white/12 cursor-pointer transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Menü"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — schiebt sich aus der grünen Bar nach unten */}
        {open && (
          <nav
            className={cn(
              "md:hidden bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] transition-all duration-200",
              scrolled
                ? "rounded-b-3xl border-t border-[var(--color-wh-deep-green-hover)] mx-auto"
                : "border-t border-[var(--color-wh-deep-green-hover)]"
            )}
          >
            <div className="px-5 py-3 flex flex-col gap-1">
              {NAV.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-3 py-3 text-base font-medium no-underline rounded-md transition-colors",
                      "text-[var(--color-wh-snow)]/90 hover:bg-white/12",
                      active && "bg-white/15 text-[var(--color-wh-snow)]"
                    )}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
