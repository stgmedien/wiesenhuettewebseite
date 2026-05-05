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

  // Only the home page has a video hero — other pages always have a solid header.
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when path changes
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200 relative",
        overHero && !open
          ? "bg-transparent border-b border-transparent"
          : "bg-[var(--color-wh-snow)] border-b border-[var(--color-wh-winter-grey)] backdrop-blur-md"
      )}
    >
      {/* Dunkle Abtönung NUR wenn der Header über dem Video schwebt — damit der weiße Text auf hellen Frames nicht verschwindet */}
      {overHero && !open && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(17,17,17,0.55), rgba(17,17,17,0.15))",
          }}
        />
      )}
      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 no-underline shrink-0",
            overHero ? "text-[var(--color-wh-snow)]" : "text-[var(--color-wh-deep-green)]"
          )}
          onClick={() => setOpen(false)}
        >
          <Mountain size={26} strokeWidth={1.6} />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight leading-none drop-shadow-sm">
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
                  overHero
                    ? "text-[var(--color-wh-snow)] hover:bg-white/15 drop-shadow-sm"
                    : "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]",
                  active && (overHero ? "bg-white/15" : "bg-[var(--color-wh-green-soft)]")
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
            className={cn(
              "inline-flex h-10 px-4 sm:px-5 items-center rounded-[var(--radius-btn)] text-sm font-semibold no-underline transition-colors whitespace-nowrap",
              overHero
                ? "bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] hover:bg-white"
                : "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] hover:bg-[var(--color-wh-deep-green-hover)]"
            )}
          >
            Buchen
          </Link>
          <button
            type="button"
            className={cn(
              "md:hidden inline-flex w-10 h-10 items-center justify-center rounded-md cursor-pointer transition-colors",
              overHero
                ? "text-[var(--color-wh-snow)] hover:bg-white/15"
                : "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
            )}
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
