/**
 * Creates (or resets) an Owner account.
 *
 *   npm run admin:create -- --email owner@company.com --name "Jane Smith"
 *
 * Password: taken from the ADMIN_PASSWORD env var if set, otherwise a strong random
 * password is generated and printed ONCE. Change it after first login.
 * Add --reset to reset the password of an existing account.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { prisma } from "../src/db.js";
import { hashPassword } from "../src/auth/password.js";

const { values } = parseArgs({ options: { email: { type: "string" }, name: { type: "string" }, reset: { type: "boolean", default: false } } });
const email = values.email?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:create -- --email you@company.com --name "Your Name" [--reset]');
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString("base64url");
if (password.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const owner = await prisma.role.findUnique({ where: { name: "Owner" } });
if (!owner) {
  console.error("Roles are missing — run `npm run db:seed` first.");
  process.exit(1);
}

const existing = await prisma.user.findUnique({ where: { email } });
if (existing && !values.reset) {
  console.error(`User ${email} already exists. Use --reset to set a new password.`);
  process.exit(1);
}

const passwordHash = await hashPassword(password);
if (existing) {
  await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null, isActive: true } });
  await prisma.session.deleteMany({ where: { userId: existing.id } });
} else {
  await prisma.user.create({ data: { email, name: values.name ?? "Site Owner", roleId: owner.id, passwordHash } });
}

console.log(`\n✅ Owner account ${existing ? "reset" : "created"}: ${email}`);
if (!process.env.ADMIN_PASSWORD) console.log(`   Temporary password (shown once): ${password}\n   Sign in at /admin and change it under My Account.\n`);
await prisma.$disconnect();
