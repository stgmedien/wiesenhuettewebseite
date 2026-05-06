import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Konto anlegen · Wiesenhütte" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/konto");

  return (
    <div className="container max-w-md mx-auto px-6 py-16">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        Wiesenhütte · Registrierung
      </p>
      <h1 className="font-heading text-4xl text-[var(--color-wh-deep-green)] mb-3">
        Konto anlegen.
      </h1>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-8">
        Mit einem Konto siehst Du Deine Buchungen, Anfragen und kannst Folgebuchungen schneller
        abschließen.
      </p>
      <SignupForm />
    </div>
  );
}
