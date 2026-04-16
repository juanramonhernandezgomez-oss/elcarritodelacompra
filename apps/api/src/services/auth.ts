import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return key.toString("hex");
}

export async function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password, salt);

  return { salt, passwordHash };
}

export async function verifyPassword(password: string, salt: string, currentHash: string) {
  const computedHash = await hashPassword(password, salt);
  return computedHash === currentHash;
}
