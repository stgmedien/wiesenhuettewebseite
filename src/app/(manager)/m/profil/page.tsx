import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mein Profil · Wiesenhütte Manager" };

type Props = { searchParams: Promise<{ forced?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const { forced } = await searchParams;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/m/login");

  const me = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!me) redirect("/m/login");

  return (
    <div className="px-8 py-10 max-w-[840px]">
      <div className="eyebrow">Profil</div>
      <h1 className="text-[40px] mt-2 mb-1">Mein Konto</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2">
        Hier verwaltest Du Deinen Namen, Dein Passwort, Deine E-Mail-Adresse und die
        Zwei-Faktor-Authentifizierung.
      </p>

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
