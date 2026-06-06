import { ManagerShell } from "@/components/manager/ManagerShell";
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
    <ManagerShell
      user={{
        name: session.user?.name ?? "Manager",
        email: session.user?.email ?? "",
        role:
          (session.user as { role?: string } | undefined)?.role ?? "manager",
      }}
    >
      {children}
    </ManagerShell>
  );
}
