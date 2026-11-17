import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";
import { env } from "../config/env";
import { randomToken, safeEqual, sha256 } from "../lib/crypto";
import { forbidden, unauthorized, AppError } from "../lib/http";
import type { PermissionKey } from "./permissions";

export const SESSION_COOKIE = "plumb_sid";
export const CSRF_COOKIE = "plumb_csrf";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  permissions: Set<string>;
  twoFactorEnabled: boolean;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    sessionId?: string;
    /** true when authenticated with the server-to-server public API key */
    isTrustedServer?: boolean;
  }
}

const cookieBase = () => ({ httpOnly: true, secure: env.cookieSecure, sameSite: "strict" as const, path: "/" });

export async function createSession(res: Response, req: Request, userId: string, twoFactorPending: boolean) {
  const token = randomToken();
  const session = await prisma.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      twoFactorPending,
      expiresAt: new Date(Date.now() + env.SESSION_TTL_HOURS * 3600_000),
      ip: req.ip?.slice(0, 64),
      userAgent: req.get("user-agent")?.slice(0, 300),
    },
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieBase(), maxAge: env.SESSION_TTL_HOURS * 3600_000 });
  // CSRF double-submit token: readable by the admin SPA, echoed back in X-CSRF-Token.
  res.cookie(CSRF_COOKIE, randomToken(24), { ...cookieBase(), httpOnly: false, maxAge: env.SESSION_TTL_HOURS * 3600_000 });
  return session;
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieBase());
  res.clearCookie(CSRF_COOKIE, { ...cookieBase(), httpOnly: false });
}

async function loadSession(req: Request) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== "string") return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!session) return null;
  const now = Date.now();
  const idleLimit = session.lastSeenAt.getTime() + env.SESSION_IDLE_MINUTES * 60_000;
  if (session.expiresAt.getTime() < now || idleLimit < now || !session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  // Sliding idle timeout — write at most once a minute
  if (now - session.lastSeenAt.getTime() > 60_000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return session;
}

/**
 * Authenticates an admin request.
 * Mutating requests must carry X-CSRF-Token matching the CSRF cookie (double-submit).
 */
export function requireAuth(opts: { allowTwoFactorPending?: boolean } = {}) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const session = await loadSession(req);
    if (!session) throw unauthorized("Your session has expired. Please sign in again.");
    if (session.twoFactorPending && !opts.allowTwoFactorPending) throw new AppError(401, "TWO_FACTOR_REQUIRED", "Two-factor verification required");

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const header = req.get("x-csrf-token") ?? "";
      const cookie = req.cookies?.[CSRF_COOKIE] ?? "";
      if (!header || !cookie || !safeEqual(header, cookie)) throw new AppError(403, "CSRF_FAILED", "Security token missing or invalid. Refresh and try again.");
    }

    const u = session.user;
    req.sessionId = session.id;
    req.user = {
      id: u.id,
      email: u.email,
      name: u.name,
      roleId: u.roleId,
      roleName: u.role.name,
      permissions: new Set(u.role.permissions.map((rp) => rp.permission.key)),
      twoFactorEnabled: u.twoFactorEnabled,
    };
    next();
  };
}

export function requirePermission(...keys: PermissionKey[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!keys.every((k) => req.user!.permissions.has(k))) throw forbidden();
    next();
  };
}

export const can = (req: Request, key: PermissionKey) => Boolean(req.user?.permissions.has(key));

/** Public content API: requires the server-to-server key from the Next.js site. */
export function requirePublicKey(req: Request, _res: Response, next: NextFunction) {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeEqual(token, env.PUBLIC_API_KEY)) throw unauthorized("Invalid API key");
  req.isTrustedServer = true;
  next();
}

/** Real visitor IP: trusted only when forwarded by the Next.js server holding the API key. */
export function clientIp(req: Request) {
  const forwarded = req.isTrustedServer ? req.get("x-client-ip") : undefined;
  return (forwarded || req.ip || "unknown").slice(0, 64);
}
