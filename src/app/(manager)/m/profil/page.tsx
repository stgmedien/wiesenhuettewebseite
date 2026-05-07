import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mein Profil · Wiesenhütte Manager" };

type Props = {
  searchParams: Promise<{ forced?: string; force_2fa?: string }>;
};

export default async function ProfilePage({ searchParams }: Props) {
  const { forced, force_2fa } = await searchParams;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/m/login");

  const me = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!me) redirect("/m/login");

  const need2FA =
    !me.twoFactorEnabled && (me.role === "admin" || me.mustEnable2FA);

  return (
    <div className="px-8 py-10 max-w-[840px]">
      <div className="eyebrow">Profil</div>
      <h1 className="text-[40px] mt-2 mb-1">Mein Konto</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2">
        Hier verwaltest Du Deinen Namen, Dein Passwort, Deine E-Mail-Adresse und die
        Zwei-Faktor-Authentifizierung.
      </p>

      {need2FA && (force_2fa === "1" || me.mustEnable2FA) && (
        <div className="mt-6 rounded-2xl bg-amber-50 border-l-4 border-amber-500 p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-amber-800 mb-1">
            ⚠ Zwei-Faktor-Authentifizierung erforderlich
          </p>
          <p className="text-sm text-amber-900 m-0">
            Aus Sicherheitsgründen müssen alle Manager-Konten mit erweiterten Rechten
            Zwei-Faktor-Authentifizierung (2FA) eingerichtet haben. Scroll zur 2FA-Sektion
            unten und scanne den QR-Code mit einer Authenticator-App (Google Authenticator,
            Authy, 1Password, Bitwarden …). Erst danach kannst Du andere Bereiche im
            Manager-Backend wieder erreichen.
          </p>
        </div>
      )}

      <ProfileClient
        forced={forced === "1"}
        me={{
          id: me.id,
          email: me.email,
          name: me.name ?? "",
          role: me.role,
          mustChangePassword: me.mustChangePassword,
          twoFactorEnabled: me.twoFactorEnabled,
          backupCodesRemaining: me.twoFactorBackupCodes?.length ?? 0,
          lastLoginAt: me.lastLoginAt ? me.lastLoginAt.toISOString() : null,
        }}
      />
    </div>
  );
}
