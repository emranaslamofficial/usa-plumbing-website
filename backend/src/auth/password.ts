import { hash, verify } from "@node-rs/argon2";
import { z } from "zod";

// Argon2id with OWASP-recommended parameters.
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (plain: string) => hash(plain, OPTS);

export async function verifyPassword(hashed: string, plain: string) {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}

// Used to keep login timing similar when the email does not exist.
let dummy: string | null = null;
export async function burnPasswordCheck(plain: string) {
  dummy ??= await hashPassword("not-a-real-password-placeholder");
  await verifyPassword(dummy, plain);
}

export const passwordPolicy = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(200)
  .refine((p) => /[a-z]/i.test(p) && /\d/.test(p), "Include letters and at least one number");
