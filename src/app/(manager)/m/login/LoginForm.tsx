"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2, ShieldCheck } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        totp: totp || undefined,
        redirect: false,
      });
      if (!res || res.error) {
        // res.code is set by our custom CredentialsSignin subclasses
        const code = (res as { code?: string } | undefined)?.code;
        if (code === "totp_required") {
          setNeedsTotp(true);
          setError("Dein Account hat 2FA aktiv — bitte den 6-stelligen Code aus Deiner Authenticator-App eingeben.");
          return;
        }
        if (code === "totp_invalid") {
          setNeedsTotp(true);
          setError("2FA-Code falsch oder abgelaufen. Bitte erneut eingeben (oder Backup-Code im Format XXXXX-XXXXX).");
          return;
        }
        setError("Login fehlgeschlagen — E-Mail oder Passwort stimmen nicht.");
        return;
      }
      window.location.href = "/m/dashboard";
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input
        id="email"
        type="email"
        label="E-Mail"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={needsTotp}
      />
      <Input
        id="password"
        type="password"
        label="Passwort"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={needsTotp}
      />
      {needsTotp && (
        <div className="bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/30 rounded-[var(--radius-md)] p-4 space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-wh-deep-green)] font-semibold">
            <ShieldCheck size={18} />
            Zwei-Faktor-Authentifizierung
          </div>
          <Input
            id="totp"
            type="text"
            label="6-stelliger Code aus Authenticator-App"
            autoComplete="one-time-code"
            placeholder="123456"
            inputMode="numeric"
            required
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            hint="Oder Backup-Code im Format XXXXX-XXXXX wenn Du Dein Phone nicht zur Hand hast"
            autoFocus
          />
        </div>
      )}
      {error && (
        <div className="text-sm text-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      <Button
        type="submit"
        block
        disabled={pending}
        iconRight={pending ? <Loader2 className="animate-spin" size={18} /> : null}
      >
        {pending ? "Anmelden ..." : needsTotp ? "Code prüfen" : "Anmelden"}
      </Button>
    </form>
  );
}
