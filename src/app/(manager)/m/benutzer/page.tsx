import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersTable from "./UsersTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Benutzer · Wiesenhütte Manager" };

export default async function UsersPage() {
  const session = await auth();
  const myRole = (session?.user as { role?: string } | undefined)?.role ?? "customer";
  const myId = (session?.user as { id?: string } | undefined)?.id ?? "";
  const isAdmin = myRole === "admin";

  const all = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="eyebrow">Benutzer</div>
          <h1 className="text-[40px] mt-2 mb-0">Zugänge & Rollen</h1>
          <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2 max-w-2xl">
            {isAdmin
              ? "Du bist Admin. Du kannst Manager und Admins anlegen, Rollen ändern, Passwörter zurücksetzen und Nutzer löschen."
              : "Übersicht der registrierten Manager und Admins. Rollenänderungen können nur Admins durchführen."}
          </p>
        </div>
      </div>

      <UsersTable rows={all} myId={myId} isAdmin={isAdmin} />
    </div>
  );
}
