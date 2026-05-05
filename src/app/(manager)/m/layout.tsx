import { Sidebar } from "@/components/manager/Sidebar";
import { auth } from "@/lib/auth";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // No session — render children directly (login page).
  // Middleware redirects unauthenticated requests to /m/login.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-wh-snow)] grid grid-cols-[260px_1fr]">
      <Sidebar
        user={{
          name: session.user?.name ?? "Manager",
          email: session.user?.email ?? "",
          role:
            (session.user as { role?: string } | undefined)?.role ?? "manager",
        }}
      />
      <main className="overflow-auto">{children}</main>
    </div>
  );
}
