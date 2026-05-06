import bcrypt from "bcryptjs";

export const generateEmailChangeToken = (): string => {
  // 48 hex chars = 192 bits entropy
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const hashToken = async (token: string): Promise<string> => bcrypt.hash(token, 10);

export const verifyToken = async (token: string, hash: string): Promise<boolean> =>
  bcrypt.compare(token, hash);
