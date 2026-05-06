import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Login · Wiesenhütte" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "manager" || role === "admin" ? "/m/dashboard" : "/konto");
  }

  return (
    <div className="container max-w-md mx-auto px-6 py-16">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        Wiesenhütte · Login
      </p>
      <h1 className="font-heading text-4xl text-[var(--color-wh-deep-green)] mb-8">
        Willkommen zurück.
      </h1>
      <LoginForm />
    </div>
  );
}
