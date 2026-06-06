"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, MountainSnow } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

type ShellUser = { name: string; email: string; role: string };

/**
 * Responsive Backend-Shell.
 * - Desktop (lg+): feste 264px-Sidebar-Schiene, Inhalt scrollt eigenständig.
 * - Mobil (<lg): sticky Topbar mit Hamburger, Sidebar als slide-in Drawer
 *   über Backdrop. Schließt bei Nav-Klick, Backdrop-Tap, Escape, Routenwechsel.
 */
export function ManagerShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Drawer bei jedem Routenwechsel schließen.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape schließt, Body-Scroll sperren solange offen.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-[var(--color-wh-snow)] lg:grid lg:grid-cols-[264px_1fr] lg:h-screen">
      {/* Desktop: feste Sidebar-Schiene (Grid-Spalte 1) */}
      <div className="hidden lg:block lg:h-screen">
        <Sidebar user={user} />
      </div>

      {/* Mobil: sticky Topbar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2.5 h-14 px-3 bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menü öffnen"
          aria-expanded={open}
          className="p-2.5 -ml-1 rounded-md hover:bg-[var(--color-wh-snow)]/10 active:bg-[var(--color-wh-snow)]/15 transition-colors"
        >
          <Menu size={22} strokeWidth={1.8} />
        </button>
        <Link
          href="/m/dashboard"
          className="flex items-center gap-2 no-underline text-[var(--color-wh-snow)] min-w-0"
        >
          <MountainSnow size={20} strokeWidth={1.7} className="shrink-0" />
          <span className="font-display font-bold text-base leading-none truncate">
            Wiesenhütte
          </span>
          <span className="text-[10px] uppercase tracking-wider opacity-70 shrink-0">
            Manager
          </span>
        </Link>
      </header>

      {/* Mobil: Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Mobil: Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[284px] max-w-[86vw] shadow-2xl transition-transform duration-300 ease-out will-change-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Menü schließen"
          className="absolute top-4 right-3 z-10 p-1.5 rounded-md text-[var(--color-wh-snow)]/80 hover:text-[var(--color-wh-snow)] hover:bg-[var(--color-wh-snow)]/10 transition-colors"
        >
          <X size={20} />
        </button>
        <Sidebar user={user} onNavigate={() => setOpen(false)} />
      </div>

      {/* Inhalt */}
      <main className="min-w-0 lg:h-screen lg:overflow-auto">{children}</main>
    </div>
  );
}
