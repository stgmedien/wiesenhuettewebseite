"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  PlusCircle,
  Lock,
  LogOut,
  MountainSnow,
  FileText,
  Settings,
  Users2,
  UserCircle,
  ScrollText,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ALL = [
  { href: "/m/dashboard", label: "Dashboard", Icon: LayoutDashboard, adminOnly: false },
  { href: "/m/buchungen", label: "Buchungen", Icon: Users, adminOnly: false },
  { href: "/m/kalender", label: "Kalender", Icon: CalendarDays, adminOnly: false },
  { href: "/m/manuell", label: "Manuelle Buchung", Icon: PlusCircle, adminOnly: false },
  { href: "/m/sperrzeiten", label: "Sperrzeiten", Icon: Lock, adminOnly: false },
  { href: "/m/blog", label: "Blog", Icon: FileText, adminOnly: false },
  { href: "/m/benutzer", label: "Benutzer", Icon: Users2, adminOnly: false },
  { href: "/m/mitgliedschaften", label: "Mitgliedschaften", Icon: BadgeCheck, adminOnly: false },
  { href: "/m/audit", label: "Audit-Log", Icon: ScrollText, adminOnly: true },
  { href: "/m/einstellungen", label: "Einstellungen", Icon: Settings, adminOnly: false },
];

export const Sidebar = ({
  user,
}: {
  user: { name: string; email: string; role: string };
}) => {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";
  const items = NAV_ALL.filter((n) => !n.adminOnly || isAdmin);

  return (
    <aside className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] flex flex-col min-h-screen">
      <Link href="/m/dashboard" className="flex items-center gap-2.5 p-6 no-underline text-[var(--color-wh-snow)]">
        <MountainSnow size={26} strokeWidth={1.6} />
        <div>
          <div className="font-display font-bold text-lg leading-tight">Wiesenhütte</div>
          <div className="text-xs uppercase tracking-wider opacity-75">Manager</div>
        </div>
      </Link>

      <nav className="px-4 mt-2 flex-1">
        {items.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-md no-underline text-[var(--color-wh-snow)]/85 hover:bg-[var(--color-wh-snow)]/10 transition-colors text-sm font-medium",
                active && "bg-[var(--color-wh-snow)]/15 text-[var(--color-wh-snow)] font-semibold"
              )}
            >
              <n.Icon size={18} strokeWidth={1.6} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-wh-snow)]/15 p-4">
        <Link
          href="/m/profil"
          className={cn(
            "flex items-center gap-3 group cursor-pointer rounded-md p-2 -m-2 hover:bg-[var(--color-wh-snow)]/10 no-underline text-[var(--color-wh-snow)]",
            pathname.startsWith("/m/profil") && "bg-[var(--color-wh-snow)]/10"
          )}
        >
          <div className="w-9 h-9 rounded-full bg-[var(--color-wh-snow)]/15 flex items-center justify-center text-sm font-semibold">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs opacity-70 truncate flex items-center gap-1">
              <UserCircle size={11} /> Mein Profil
            </div>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/m/login" })}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80 hover:opacity-100 cursor-pointer py-2 rounded-md border border-[var(--color-wh-snow)]/20 hover:bg-[var(--color-wh-snow)]/10 transition-colors"
        >
          <LogOut size={14} /> Abmelden
        </button>
      </div>
    </aside>
  );
};
