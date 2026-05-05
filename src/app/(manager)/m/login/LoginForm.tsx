"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Login fehlgeschlagen.");
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
      />
      <Input
        id="password"
        type="password"
        label="Passwort"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
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
        {pending ? "Anmelden ..." : "Anmelden"}
      </Button>
    </form>
  );
}
