"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Mail,
  User,
  Loader2,
  Check,
  Copy,
  Smartphone,
} from "lucide-react";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  changeMyPassword,
  confirmTwoFactorSetup,
  disableTwoFactor,
  logoutAndForceRelogin,
  requestEmailChange,
  startTwoFactorSetup,
  updateMyName,
} from "./actions";

type Me = {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
  lastLoginAt: string | null;
};

export default function ProfileClient({ me, forced }: { me: Me; forced: boolean }) {
  return (
    <div className="mt-8 space-y-6">
      {(forced || me.mustChangePassword) && (
        <div className="bg-[var(--color-wh-sunset)]/10 border border-[var(--color-wh-sunset)]/30 rounded-[var(--radius-md)] p-4 flex items-start gap-3">
          <AlertTriangle className="text-[var(--color-wh-sunset)] shrink-0 mt-0.5" size={18} />
          <div>
            <div className="font-semibold text-[var(--color-wh-sunset)]">
              Passwort-Wechsel erforderlich
            </div>
            <p className="text-sm text-[var(--color-wh-black)] m-0 mt-1">
              Bevor Du andere Bereiche nutzen kannst, ändere bitte Dein Passwort. Solange dieser
              Hinweis steht, leiten wir Dich zu dieser Seite zurück.
            </p>
          </div>
        </div>
      )}

      <NameSection initial={me.name} />
      <PasswordSection forced={me.mustChangePassword} />
      <EmailSection currentEmail={me.email} />
      <TwoFactorSection
        enabled={me.twoFactorEnabled}
        backupRemaining={me.backupCodesRemaining}
        role={me.role}
        userEmail={me.email}
      />

      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <h3 className="m-0 mb-2 text-[18px]">Login-Aktivität</h3>
        <p className="m-0 text-sm text-[var(--color-wh-fg-muted)]">
          Letzter Login:{" "}
          {me.lastLoginAt
            ? new Date(me.lastLoginAt).toLocaleString("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "noch nie"}
        </p>
      </section>
    </div>
  );
}

const Card = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-[var(--color-wh-green-soft)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="m-0 text-[18px]">{title}</h3>
        {description && (
          <p className="m-0 mt-1 text-sm text-[var(--color-wh-fg-muted)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
    {children}
  </section>
);

function NameSection({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await updateMyName(name);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        setSavedAt(new Date());
        router.refresh();
      }
    });
  };

  return (
    <Card icon={<User size={18} className="text-[var(--color-wh-deep-green)]" />} title="Anzeigename">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button type="submit" disabled={pending || name === initial}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : "Speichern"}
        </Button>
      </form>
      {savedAt && (
        <div className="mt-2 text-xs text-[var(--color-wh-deep-green)] inline-flex items-center gap-1.5">
          <Check size={12} /> Gespeichert
        </div>
      )}
      {error && <div className="mt-2 text-sm text-[var(--color-wh-sunset)]">{error}</div>}
    </Card>
  );
}

function PasswordSection({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next.length < 8) return setError("Neues Passwort: mind. 8 Zeichen.");
    if (next !== confirm) return setError("Bestätigung stimmt nicht überein.");
    start(async () => {
      const r = await changeMyPassword({ current, next });
      if (!r.ok) {
        setError(r.error ?? "Fehler");
        return;
      }
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      router.refresh();
    });
  };

  return (
    <Card
      icon={<KeyRound size={18} className="text-[var(--color-wh-deep-green)]" />}
      title="Passwort ändern"
      description={
        forced
          ? "Aktuelles Passwort ist nur einmal gültig — bitte jetzt ein neues setzen."
          : "Aktuelles Passwort eingeben, dann das neue. Bestätigung beugt Tippfehlern vor."
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          id="current"
          type="password"
          label="Aktuelles Passwort"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <Input
          id="next"
          type="password"
          label="Neues Passwort (mind. 8 Zeichen)"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
        />
        <Input
          id="confirm"
          type="password"
          label="Neues Passwort bestätigen"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
        {error && (
          <div className="text-sm text-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-[var(--color-wh-deep-green)] bg-[var(--color-wh-green-soft)] px-3 py-2 rounded-md inline-flex items-center gap-1.5">
            <Check size={14} /> Passwort geändert.
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : "Passwort speichern"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    start(async () => {
      const r = await requestEmailChange({ newEmail, password });
      if (!r.ok) {
        setError(r.error ?? "Fehler");
        return;
      }
      setSent(true);
      setNewEmail("");
      setPassword("");
    });
  };

  return (
    <Card
      icon={<Mail size={18} className="text-[var(--color-wh-deep-green)]" />}
      title="E-Mail-Adresse ändern"
      description="Aktuell: einloggen geht mit dieser Adresse. Wir schicken einen Bestätigungs-Link an die neue Adresse — der Wechsel wird erst aktiv, wenn Du dort klickst."
    >
      <div className="text-sm text-[var(--color-wh-fg-muted)] mb-3">
        Aktuell: <strong className="text-[var(--color-wh-deep-green)]">{currentEmail}</strong>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Input
          id="new-email"
          type="email"
          label="Neue E-Mail-Adresse"
          autoComplete="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
        <Input
          id="email-pw"
          type="password"
          label="Aktuelles Passwort (zur Bestätigung)"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <div className="text-sm text-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        {sent && (
          <div className="text-sm text-[var(--color-wh-deep-green)] bg-[var(--color-wh-green-soft)] px-3 py-2 rounded-md inline-flex items-center gap-1.5">
            <Check size={14} /> Verifizierungs-Mail wurde an die neue Adresse geschickt. Klicke
            dort innerhalb von 24 h auf den Link.
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : "Wechsel anfragen"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TwoFactorSection({
  enabled,
  backupRemaining,
  role,
  userEmail,
}: {
  enabled: boolean;
  backupRemaining: number;
  role: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [setupOpen, setSetupOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpUri, setOtpUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const [disablePw, setDisablePw] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);

  const startSetup = () => {
    setError(null);
    start(async () => {
      const r = await startTwoFactorSetup();
      if (!r.ok) {
        setError(r.error ?? "Fehler");
        return;
      }
      setSecret(r.secret ?? null);
      setOtpUri(r.otpAuthUri ?? null);
      setSetupOpen(true);
    });
  };

  const confirmSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await confirmTwoFactorSetup({ code });
      if (!r.ok) {
        setError(r.error ?? "Fehler");
        return;
      }
      setBackupCodes(r.backupCodes ?? []);
      setSetupOpen(false);
      setSecret(null);
      setOtpUri(null);
      setCode("");
      router.refresh();
    });
  };

  const submitDisable = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await disableTwoFactor({ password: disablePw, code: disableCode });
      if (!r.ok) {
        setError(r.error ?? "Fehler");
        return;
      }
      setDisableOpen(false);
      setDisablePw("");
      setDisableCode("");
      router.refresh();
    });
  };

  return (
    <Card
      icon={
        enabled ? (
          <ShieldCheck size={18} className="text-[var(--color-wh-deep-green)]" />
        ) : (
          <ShieldOff size={18} className="text-[var(--color-wh-deep-green)]" />
        )
      }
      title={`Zwei-Faktor-Authentifizierung — ${enabled ? "aktiv" : "nicht aktiv"}`}
      description="Schützt Deinen Account zusätzlich zum Passwort. 6-stelliger Code aus Authenticator-App (z. B. Google Authenticator, 1Password, Authy)."
    >
      {enabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-[var(--color-wh-deep-green)] font-semibold">
            <Check size={16} /> 2FA ist aktiv. {backupRemaining} Backup-Codes verbleibend.
          </div>
          {!disableOpen ? (
            <button
              type="button"
              onClick={() => setDisableOpen(true)}
              className="inline-flex h-10 px-4 items-center gap-2 rounded-md bg-white border border-[var(--color-wh-sunset)] text-[var(--color-wh-sunset)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-sunset)]/10"
            >
              <ShieldOff size={14} /> 2FA deaktivieren
            </button>
          ) : (
            <form onSubmit={submitDisable} className="space-y-3 bg-[var(--color-wh-snow)] p-4 rounded-md border border-[var(--color-wh-winter-grey)]">
              <div className="text-sm text-[var(--color-wh-fg-muted)]">
                Zur Sicherheit: bitte aktuelles Passwort + 6-stelligen 2FA-Code eingeben.
              </div>
              <Input id="disable-pw" type="password" label="Aktuelles Passwort" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} required />
              <Input id="disable-code" type="text" label="2FA-Code" value={disableCode} onChange={(e) => setDisableCode(e.target.value)} required inputMode="numeric" placeholder="123456" />
              {error && <div className="text-sm text-[var(--color-wh-sunset)]">{error}</div>}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => setDisableOpen(false)}>Abbrechen</Button>
                <Button type="submit" variant="danger" disabled={pending}>
                  {pending ? <Loader2 size={16} className="animate-spin" /> : "2FA deaktivieren"}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {role === "admin" && (
            <div className="bg-[var(--color-wh-sunset)]/10 border border-[var(--color-wh-sunset)]/30 rounded-md p-3 text-sm">
              <strong className="text-[var(--color-wh-sunset)]">Empfehlung für Admins:</strong> 2FA
              dringend einrichten — Du hast Zugriff auf Buchungen, Zahlungen und Nutzerverwaltung.
            </div>
          )}

          {!setupOpen ? (
            <button
              type="button"
              onClick={startSetup}
              disabled={pending}
              className="inline-flex h-10 px-4 items-center gap-2 rounded-md bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)]"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
              2FA einrichten
            </button>
          ) : (
            <div className="bg-[var(--color-wh-snow)] p-4 rounded-md border border-[var(--color-wh-winter-grey)] space-y-4">
              <div>
                <div className="font-semibold mb-2">1. QR-Code mit Authenticator-App scannen</div>
                {otpUri && (
                  <div className="inline-block bg-white p-3 rounded">
                    <QRCode value={otpUri} size={180} />
                  </div>
                )}
                <div className="text-xs text-[var(--color-wh-fg-muted)] mt-2">
                  Falls Du nicht scannen kannst, gib das Geheimnis manuell ein:
                </div>
                <code className="block mt-1 text-xs font-mono bg-white px-2 py-1.5 rounded border border-[var(--color-wh-winter-grey)] break-all">
                  {secret}
                </code>
                <div className="text-xs text-[var(--color-wh-fg-muted)] mt-1">
                  Account-Name: <code>{userEmail}</code> · Issuer: <code>Wiesenhütte</code>
                </div>
              </div>

              <form onSubmit={confirmSetup} className="space-y-3">
                <div>
                  <div className="font-semibold mb-2">2. 6-stelligen Code aus der App eingeben</div>
                  <Input
                    id="totp-confirm"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    required
                  />
                </div>
                {error && <div className="text-sm text-[var(--color-wh-sunset)]">{error}</div>}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setSetupOpen(false)}>Abbrechen</Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? <Loader2 size={16} className="animate-spin" /> : "2FA aktivieren"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {backupCodes && backupCodes.length > 0 && (
        <BackupCodesPanel
          codes={backupCodes}
          onClose={async () => {
            setBackupCodes(null);
            await logoutAndForceRelogin();
          }}
        />
      )}
    </Card>
  );
}

function BackupCodesPanel({
  codes,
  onClose,
}: {
  codes: string[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const all = codes.join("\n");
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-deep)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-[var(--color-wh-deep-green)]" size={22} />
          <h3 className="m-0 text-[20px]">2FA aktiviert — Backup-Codes</h3>
        </div>
        <p className="m-0 text-sm text-[var(--color-wh-fg-muted)] leading-relaxed">
          Speichere diese 10 Codes <strong>jetzt</strong> sicher (Passwortmanager oder ausgedruckt
          im Schrank). Mit jedem Code kannst Du Dich einmal ohne Authenticator-App einloggen — falls
          Du Dein Telefon verlierst.
        </p>
        <div className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-md p-4 grid grid-cols-2 gap-2 font-mono text-sm">
          {codes.map((c) => (
            <code key={c} className="px-2 py-1 bg-white rounded">
              {c}
            </code>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(all);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex h-10 px-4 items-center gap-2 rounded-md border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] text-sm font-semibold cursor-pointer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Kopiert" : "Alle kopieren"}
          </button>
          <Button type="button" onClick={onClose}>
            Verstanden — bitte erneut einloggen
          </Button>
        </div>
      </div>
    </div>
  );
}
