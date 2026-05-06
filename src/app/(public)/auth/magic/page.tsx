import { AutoSubmitMagic } from "./AutoSubmit";
import { redirect } from "next/navigation";

export const metadata = { title: "Login wird abgeschlossen … · Wiesenhütte" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function MagicLinkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token?.trim();

  if (!token) {
    redirect("/login?error=missing_token");
  }

  return (
    <div className="container max-w-md mx-auto px-6 py-24 text-center">
      <p className="eyebrow text-[var(--color-wh-deep-green)] uppercase tracking-wider text-xs font-semibold mb-2">
        Wiesenhütte · Login
      </p>
      <h1 className="font-heading text-3xl text-[var(--color-wh-deep-green)] mb-3">
        Anmeldung wird abgeschlossen …
      </h1>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-8">
        Wir prüfen Deinen Login-Link. Das dauert nur einen Moment.
      </p>
      <AutoSubmitMagic token={token} />
    </div>
  );
}
