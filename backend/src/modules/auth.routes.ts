import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import * as OTPAuth from "otpauth";
import { prisma } from "../db.js";
import { env } from "../config/env.js";
import { body } from "../lib/validate.js";
import { ok, unauthorized, AppError, badRequest } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { decrypt, encrypt, randomToken, sha256 } from "../lib/crypto.js";
import { sendMail } from "../lib/mailer.js";
import { background } from "../lib/background.js";
import { burnPasswordCheck, hashPassword, passwordPolicy, verifyPassword } from "../auth/password.js";
import { clearSessionCookies, createSession, requireAuth } from "../auth/session.js";

export const authRouter = Router();

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in a few minutes." } },
});

const totpFor = (secret: string, email: string) =>
  new OTPAuth.TOTP({ issuer: "Plumbing Admin", label: email, secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });

function publicUser(u: { id: string; email: string; name: string; twoFactorEnabled: boolean; role: { name: string; permissions: { permission: { key: string } }[] } }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role.name, twoFactorEnabled: u.twoFactorEnabled, permissions: u.role.permissions.map((p) => p.permission.key) };
}

const userInclude = { role: { include: { permissions: { include: { permission: true } } } } } as const;

/** POST /auth/login */
authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = body(req, z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) }));
  const user = await prisma.user.findUnique({ where: { email }, include: userInclude });

  if (!user) {
    await burnPasswordCheck(password);
    throw unauthorized("Invalid email or password");
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(423, "ACCOUNT_LOCKED", `Too many failed attempts. Try again after ${user.lockedUntil.toLocaleTimeString("en-US")}.`);
  }
  const valid = user.isActive && (await verifyPassword(user.passwordHash, password));
  if (!valid) {
    const failed = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: failed, lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null },
    });
    await audit(req, "login_failed", "User", user.id, { summary: email });
    throw unauthorized("Invalid email or password");
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession(res, req, user.id, user.twoFactorEnabled);
  background(prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }));
  req.user = { id: user.id } as never;
  await audit(req, "login", "User", user.id);
  ok(res, user.twoFactorEnabled ? { twoFactorRequired: true } : { twoFactorRequired: false, user: publicUser(user) });
});

/** POST /auth/2fa/verify — second step of login when 2FA is enabled */
authRouter.post("/2fa/verify", loginLimiter, requireAuth({ allowTwoFactorPending: true }), async (req, res) => {
  const { code } = body(req, z.object({ code: z.string().regex(/^\d{6}$/) }));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, include: userInclude });
  if (!user.twoFactorSecret || totpFor(decrypt(user.twoFactorSecret), user.email).validate({ token: code, window: 1 }) === null) {
    throw unauthorized("Invalid verification code");
  }
  await prisma.session.update({ where: { id: req.sessionId }, data: { twoFactorPending: false } });
  ok(res, { user: publicUser(user) });
});

/** POST /auth/logout */
authRouter.post("/logout", requireAuth({ allowTwoFactorPending: true }), async (req, res) => {
  await prisma.session.delete({ where: { id: req.sessionId } }).catch(() => undefined);
  clearSessionCookies(res);
  await audit(req, "logout", "User", req.user!.id);
  ok(res, { loggedOut: true });
});

/** GET /auth/me */
authRouter.get("/me", requireAuth(), async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, include: userInclude });
  ok(res, publicUser(user));
});

/** POST /auth/password — change own password (signs out other sessions) */
authRouter.post("/password", requireAuth(), async (req, res) => {
  const { currentPassword, newPassword } = body(req, z.object({ currentPassword: z.string().min(1).max(200), newPassword: passwordPolicy }));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!(await verifyPassword(user.passwordHash, currentPassword))) throw badRequest("Current password is incorrect");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await prisma.session.deleteMany({ where: { userId: user.id, NOT: { id: req.sessionId } } });
  await audit(req, "password_change", "User", user.id);
  ok(res, { changed: true });
});

/** POST /auth/forgot-password — always 200 to avoid account enumeration */
authRouter.post("/forgot-password", loginLimiter, async (req, res) => {
  const { email } = body(req, z.object({ email: z.string().trim().toLowerCase().email().max(200) }));
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.isActive) {
    const token = randomToken();
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60_000) } });
    const link = `${env.API_PUBLIC_URL}/admin/reset-password?token=${token}`;
    await sendMail(user.email, "Reset your admin password", `Use this link within 1 hour to reset your password:\n\n${link}\n\nIf you didn't request this, ignore this email.`);
  }
  ok(res, { message: "If that account exists, a reset link has been sent." });
});

/** POST /auth/reset-password */
authRouter.post("/reset-password", loginLimiter, async (req, res) => {
  const { token, password } = body(req, z.object({ token: z.string().min(20).max(200), password: passwordPolicy }));
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) throw badRequest("This reset link is invalid or has expired");
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(password), failedLoginCount: 0, lockedUntil: null } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: row.userId } }),
  ]);
  req.user = { id: row.userId } as never;
  await audit(req, "password_reset", "User", row.userId);
  ok(res, { reset: true });
});

// ── Two-factor (TOTP) management ──

/** POST /auth/2fa/setup → returns otpauth:// URI to show as QR code. Not active until confirmed. */
authRouter.post("/2fa/setup", requireAuth(), async (req, res) => {
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  await prisma.user.update({ where: { id: req.user!.id }, data: { twoFactorSecret: encrypt(secret), twoFactorEnabled: false } });
  ok(res, { otpauthUrl: totpFor(secret, req.user!.email).toString(), secret });
});

/** POST /auth/2fa/enable { code } */
authRouter.post("/2fa/enable", requireAuth(), async (req, res) => {
  const { code } = body(req, z.object({ code: z.string().regex(/^\d{6}$/) }));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!user.twoFactorSecret) throw badRequest("Start 2FA setup first");
  if (totpFor(decrypt(user.twoFactorSecret), user.email).validate({ token: code, window: 1 }) === null) throw badRequest("Invalid code");
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  await audit(req, "2fa_enabled", "User", user.id);
  ok(res, { enabled: true });
});

/** POST /auth/2fa/disable { password } */
authRouter.post("/2fa/disable", requireAuth(), async (req, res) => {
  const { password } = body(req, z.object({ password: z.string().min(1).max(200) }));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!(await verifyPassword(user.passwordHash, password))) throw badRequest("Password is incorrect");
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  await audit(req, "2fa_disabled", "User", user.id);
  ok(res, { enabled: false });
});
