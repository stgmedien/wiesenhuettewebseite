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
  BarChart3,
  Database,
  MailIcon,
  BookOpen,
  MessageSquare,
  Footprints,
  Star,
  Gift,
  Wrench,
  Send,
  MapPin,
  ThumbsUp,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
};

type NavGroup = { label?: string; items: NavItem[] };

// Konsolidierte Navigation: 21 Punkte in thematische Gruppen sortiert,
// damit das Backend auf einen Blick überschaubar ist.
const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: "/m/dashboard", label: "Dashboard", Icon: LayoutDashboard }],
  },
  {
    label: "Buchungen",
    items: [
      { href: "/m/buchungen", label: "Buchungen", Icon: Users },
      { href: "/m/kalender", label: "Kalender", Icon: CalendarDays },
      { href: "/m/manuell", label: "Manuelle Buchung", Icon: PlusCircle },
      { href: "/m/sperrzeiten", label: "Sperrzeiten", Icon: Lock },
      { href: "/m/wapelbad", label: "Wapelbad", Icon: Flame },
    ],
  },
  {
    label: "Gäste & Mitglieder",
    items: [
      { href: "/m/mitgliedschaften", label: "Mitgliedschaften", Icon: BadgeCheck },
      { href: "/m/benutzer", label: "Benutzer", Icon: Users2 },
    ],
  },
  {
    label: "Inhalte",
    items: [
      { href: "/m/blog", label: "Blog", Icon: FileText },
      { href: "/m/wandertouren", label: "Wandertouren", Icon: Footprints },
      { href: "/m/empfehlungen", label: "Empfehlungen", Icon: MapPin },
      { href: "/m/community", label: "Anekdoten", Icon: MessageSquare },
    ],
  },
  {
    label: "Kommunikation",
    items: [
      { href: "/m/bulk-mail", label: "Bulk-Mail", Icon: Send },
      { href: "/m/mail-templates", label: "Mail-Templates", Icon: MailIcon },
      { href: "/m/feedback", label: "Feedback", Icon: Star },
      { href: "/m/bewertungen", label: "Bewertungen", Icon: ThumbsUp },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/m/reporting", label: "Reporting", Icon: BarChart3 },
      { href: "/m/stammdaten", label: "Stammdaten", Icon: Database },
      { href: "/m/wartung", label: "Wartung", Icon: Wrench },
      { href: "/m/einstellungen", label: "Einstellungen", Icon: Settings },
      { href: "/m/audit", label: "Audit-Log", Icon: ScrollText, adminOnly: true },
    ],
  },
];

export const Sidebar = ({
  user,
  onNavigate,
}: {
  user: { name: string; email: string; role: string };
  /** Called whenever a nav link is tapped — used to close the mobile drawer. */
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] flex flex-col h-full min-h-0">
      <Link
        href="/m/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-6 py-5 no-underline text-[var(--color-wh-snow)] shrink-0"
      >
        <MountainSnow size={26} strokeWidth={1.6} />
        <div>
          <div className="font-display font-bold text-lg leading-tight">Wiesenhütte</div>
          <div className="text-xs uppercase tracking-wider opacity-75">Manager</div>
        </div>
      </Link>

      <nav className="px-3 flex-1 overflow-y-auto overscroll-contain pb-2 [scrollbar-width:thin]">
        {NAV_GROUPS.map((group, gi) => {
          const items = group.items.filter((n) => !n.adminOnly || isAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.label ?? `g${gi}`} className={cn(gi > 0 && "mt-4")}>
              {group.label && (
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-wh-snow)]/45">
                  {group.label}
                </div>
              )}
              {items.map((n) => {
                const active = isActive(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 my-0.5 rounded-md no-underline text-[var(--color-wh-snow)]/85 hover:bg-[var(--color-wh-snow)]/10 transition-colors text-sm font-medium",
                      active &&
                        "bg-[var(--color-wh-snow)]/15 text-[var(--color-wh-snow)] font-semibold"
                    )}
                  >
                    <n.Icon size={18} strokeWidth={1.6} className="shrink-0" />
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-wh-snow)]/15 p-4 shrink-0">
        <Link
          href="/m/handbuch"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 px-3 py-2 mb-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-snow)]/85 hover:text-[var(--color-wh-snow)] hover:bg-[var(--color-wh-snow)]/10 rounded-md no-underline transition-colors",
            pathname.startsWith("/m/handbuch") && "bg-[var(--color-wh-snow)]/10 text-[var(--color-wh-snow)]"
          )}
        >
          <BookOpen size={14} strokeWidth={1.6} />
          Handbuch
        </Link>
        <Link
          href="/m/profil"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 group cursor-pointer rounded-md p-2 -m-2 hover:bg-[var(--color-wh-snow)]/10 no-underline text-[var(--color-wh-snow)]",
            pathname.startsWith("/m/profil") && "bg-[var(--color-wh-snow)]/10"
          )}
        >
          <div className="w-9 h-9 rounded-full bg-[var(--color-wh-snow)]/15 flex items-center justify-center text-sm font-semibold shrink-0">
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
