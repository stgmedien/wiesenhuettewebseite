/**
 * Voucher-Code-Generator + Format-Validierung.
 * Format: WH-GIFT-XXXX-YYYY (4+4 Zeichen, Crockford-Base32 ohne ähnliche
 * Zeichen wie 0/O, 1/I — minimiert Tipp-Fehler beim Eingeben).
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // ohne 0, 1, I, L, O, U

export function generateVoucherCode(): string {
  const seg = (len: number) => {
    let s = "";
    for (let i = 0; i < len; i++) {
      s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    return s;
  };
  return `WH-GIFT-${seg(4)}-${seg(4)}`;
}

/**
 * Lockere Format-Validierung (Sanity-Check vor DB-Lookup, kein Security-Layer).
 */
export function isValidVoucherCodeShape(code: string): boolean {
  return /^WH-GIFT-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code.trim().toUpperCase());
}

export function normalizeVoucherCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export const VOUCHER_TTL_YEARS = 3;

export function voucherExpiryDate(now = new Date()): Date {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() + VOUCHER_TTL_YEARS);
  return d;
}
