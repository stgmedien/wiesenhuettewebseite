import { generateSecret, generateURI, verifySync } from "otplib";
import bcrypt from "bcryptjs";

const TOTP_OPTIONS = {
  step: 30,         // 30-second window
  digits: 6,
  algorithm: "sha1" as const,
  window: 1,        // accept previous + next step (~±30s drift)
};

export const generateTotpSecret = (): string => generateSecret({ length: 20 });

export const buildOtpAuthUri = (
  secret: string,
  email: string,
  issuer = "Wiesenhütte"
): string =>
  generateURI({
    secret,
    issuer,
    label: email,
    strategy: "totp",
    digits: TOTP_OPTIONS.digits,
    period: TOTP_OPTIONS.step,
    algorithm: TOTP_OPTIONS.algorithm,
  });

export const verifyTotp = (token: string, secret: string): boolean => {
  if (!token || !secret) return false;
  const cleaned = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  try {
    const result = verifySync({
      token: cleaned,
      secret,
      ...TOTP_OPTIONS,
    });
    // verifySync returns { ok, value, error } shape in otplib v13
    if (typeof result === "object" && result !== null && "ok" in result) {
      return Boolean((result as { ok: boolean; value?: boolean }).ok &&
        (result as { value?: boolean }).value === true);
    }
    return Boolean(result);
  } catch {
    return false;
  }
};

export const generateBackupCodes = async (
  count = 10
): Promise<{ plain: string[]; hashed: string[] }> => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const plain: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    let code = "";
    for (let j = 0; j < 10; j++) code += alphabet[bytes[j] % alphabet.length];
    const formatted = `${code.slice(0, 5)}-${code.slice(5)}`;
    plain.push(formatted);
    hashed.push(await bcrypt.hash(formatted, 10));
  }
  return { plain, hashed };
};

export const consumeBackupCode = async (
  candidate: string,
  storedHashes: string[]
): Promise<string[] | null> => {
  const cleaned = candidate.trim().toUpperCase();
  for (let i = 0; i < storedHashes.length; i++) {
    if (await bcrypt.compare(cleaned, storedHashes[i])) {
      return [...storedHashes.slice(0, i), ...storedHashes.slice(i + 1)];
    }
  }
  return null;
};
