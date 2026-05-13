"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, Menu, X, UserCircle, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { t, type Locale } from "@/lib/i18n-shared";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV_KEYS: Array<{ href: string; key: string }> = [
  { href: "/huette", key: "nav.huette" },
  { href: "/verein", key: "nav.verein" },
  { href: "/schulprojekt", key: "nav.schulprojekt" },
  { href: "/lage", key: "nav.lage" },
  { href: "/kontakt", key: "nav.kontakt" },
];

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION_MS = 450;

export type HeaderSession = {
  loggedIn: boolean;
  name?: string | null;
  role?: string;
};

export const Header = ({ session, locale }: { session: HeaderSession; locale: Locale }) => {
  const NAV = NAV_KEYS.map((n) => ({ href: n.href, label: t(n.key, locale) }));
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Viewport-Detection: nur ab >=768px morphen wir den Header in den Pill-State.
  // Auf Mobile bleibt er full-width, sonst entsteht der "Blob"-Effekt im Burger-Menu.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Pill/Blob-State nur auf Desktop UND wenn das Burger-Menu nicht offen ist.
  const morph = isDesktop && scrolled && !open;

  // Single transition declaration, identical in both states — smooth morph.
  const morphTransition = `max-width ${DURATION_MS}ms ${EASE}, border-radius ${DURATION_MS}ms ${EASE}, box-shadow ${DURATION_MS}ms ${EASE}, margin ${DURATION_MS}ms ${EASE}`;
  const wrapperTransition = `padding ${DURATION_MS}ms ${EASE}`;

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        transition: wrapperTransition,
        paddingTop: morph ? 12 : 0,
        paddingLeft: morph ? 12 : 0,
        paddingRight: morph ? 12 : 0,
      }}
    >
      <div
        className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] mx-auto"
        style={{
          transition: morphTransition,
          maxWidth: morph ? "980px" : "100vw",
          borderRadius: morph ? 9999 : 0,
          boxShadow: morph
            ? "0 12px 32px rgba(17,17,17,0.18), 0 4px 10px rgba(17,17,17,0.08)"
            : "0 0 0 rgba(17,17,17,0)",
          willChange: "max-width, border-radius, box-shadow, margin",
        }}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3 sm:gap-4 h-14",
            morph ? "px-4 sm:px-5" : "px-5 sm:px-6 lg:px-8 max-w-[1280px] mx-auto"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 no-underline text-[var(--color-wh-snow)] shrink-0"
            onClick={() => setOpen(false)}
          >
            <Mountain size={22} strokeWidth={1.6} />
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
            <div className="hidden md:block bg-white/10 rounded-full p-0.5">
              <LanguageSwitcher current={locale} />
            </div>
            {session.loggedIn ? (
              <Link
                href={
                  session.role === "manager" || session.role === "admin"
                    ? "/m/dashboard"
                    : "/konto"
                }
                className="hidden sm:inline-flex h-9 px-3 items-center gap-1.5 rounded-full text-[var(--color-wh-snow)]/90 text-sm font-medium no-underline hover:bg-white/12 transition-colors whitespace-nowrap"
                title={session.name ?? t("nav.account", locale)}
              >
                <UserCircle size={16} />
                <span className="hidden lg:inline">
                  {session.role === "manager" || session.role === "admin"
                    ? "Manager"
                    : t("nav.account", locale)}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex h-9 px-3 items-center gap-1.5 rounded-full text-[var(--color-wh-snow)]/90 text-sm font-medium no-underline hover:bg-white/12 transition-colors whitespace-nowrap"
              >
                <LogIn size={16} />
                {t("nav.login", locale)}
              </Link>
            )}
            <Link
              href="/buchen"
              className="inline-flex h-9 px-4 sm:px-5 items-center rounded-full bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] text-sm font-semibold no-underline hover:bg-white transition-colors whitespace-nowrap"
            >
              {t("nav.book", locale)}
            </Link>
            <button
              type="button"
              className="md:hidden inline-flex w-9 h-9 items-center justify-center rounded-full text-[var(--color-wh-snow)] hover:bg-white/12 cursor-pointer transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Menü"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav
            className="md:hidden bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] border-t border-white/15"
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
              <div className="border-t border-white/12 mt-2 pt-2">
                {session.loggedIn ? (
                  <Link
                    href={
                      session.role === "manager" || session.role === "admin"
                        ? "/m/dashboard"
                        : "/konto"
                    }
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-3 text-base font-medium no-underline rounded-md text-[var(--color-wh-snow)]/90 hover:bg-white/12"
                  >
                    <UserCircle size={18} />
                    {session.role === "manager" || session.role === "admin"
                      ? "Manager-Backend"
                      : "Mein Konto"}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 text-base font-medium no-underline rounded-md text-[var(--color-wh-snow)]/90 hover:bg-white/12"
                    >
                      <LogIn size={18} />
                      Login
                    </Link>
                    <Link
                      href="/registrieren"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 text-base font-medium no-underline rounded-md text-[var(--color-wh-snow)]/90 hover:bg-white/12"
                    >
                      <UserCircle size={18} />
                      Konto anlegen
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
