import { verifyEmailChange } from "../actions";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "E-Mail-Wechsel bestätigen · Wiesenhütte" };

type Props = { searchParams: Promise<{ id?: string; token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { id, token } = await searchParams;
  const res =
    id && token
      ? await verifyEmailChange(id, token)
      : { ok: false as const, error: "Token oder ID fehlt im Link." };

  return (
    <div className="px-8 py-16 max-w-[640px] mx-auto">
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-8 text-center">
        {res.ok ? (
          <>
            <CheckCircle2 className="mx-auto text-[var(--color-wh-green)]" size={56} strokeWidth={1.4} />
            <h1 className="mt-4 text-[28px]">E-Mail-Wechsel bestätigt.</h1>
            <p className="text-[var(--color-wh-fg-muted)] mt-3">
              Dein Account erreicht ab jetzt unter{" "}
              <strong className="text-[var(--color-wh-deep-green)]">{res.newEmail}</strong>. Du
              kannst Dich mit dieser Adresse jetzt im Manager-Backend einloggen.
            </p>
            <Link
              href="/m/login"
              className="inline-flex mt-6 h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold"
            >
              Zum Login
            </Link>
          </>
        ) : (
          <>
            <AlertTriangle className="mx-auto text-[var(--color-wh-sunset)]" size={56} strokeWidth={1.4} />
            <h1 className="mt-4 text-[28px]">Wechsel fehlgeschlagen.</h1>
            <p className="text-[var(--color-wh-fg-muted)] mt-3">{res.error}</p>
            <Link
              href="/m/profil"
              className="inline-flex mt-6 h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold"
            >
              Zurück zum Profil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
