import { verifyEmailChange } from "@/app/(manager)/m/profil/actions";
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
      <div className="bg-white border border-[var(--color-wh-winter-grey)]/40 rounded-2xl p-8 text-center">
        {res.ok ? (
          <>
            <CheckCircle2
              className="mx-auto text-[var(--color-wh-deep-green)]"
              size={56}
              strokeWidth={1.4}
            />
            <h1 className="mt-4 text-2xl font-heading text-[var(--color-wh-deep-green)]">
              E-Mail-Wechsel bestätigt.
            </h1>
            <p className="text-[var(--color-wh-black)]/80 mt-3">
              Dein Account erreicht ab jetzt unter{" "}
              <strong className="text-[var(--color-wh-deep-green)]">{res.newEmail}</strong>. Du kannst
              Dich mit dieser Adresse jetzt einloggen.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Link
                href="/login"
                className="inline-flex h-12 px-6 items-center rounded-full bg-[var(--color-wh-deep-green)] text-white no-underline font-semibold"
              >
                Zum Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle
              className="mx-auto text-amber-600"
              size={56}
              strokeWidth={1.4}
            />
            <h1 className="mt-4 text-2xl font-heading text-[var(--color-wh-deep-green)]">
              Wechsel fehlgeschlagen.
            </h1>
            <p className="text-[var(--color-wh-black)]/80 mt-3">{res.error}</p>
            <Link
              href="/konto/profil"
              className="inline-flex mt-6 h-12 px-6 items-center rounded-full bg-[var(--color-wh-deep-green)] text-white no-underline font-semibold"
            >
              Zurück zum Profil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
