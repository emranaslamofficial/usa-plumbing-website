import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requirePermission } from "../auth/session";
import { body, cleanText, idParam, parse } from "../lib/validate";
import { badRequest, conflict, created, forbidden, notFound, ok } from "../lib/http";
import { audit } from "../lib/audit";
import { hashPassword, passwordPolicy } from "../auth/password";
import { ALL_PERMISSIONS } from "../auth/permissions";

export const usersRouter = Router();
export const rolesRouter = Router();

/** Never select passwordHash / 2FA secrets in API responses. */
const safeUser = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  lastLoginAt: true,
  twoFactorEnabled: true,
  lockedUntil: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const;

async function ownerGuard(targetRoleId: string, actingRoleName: string) {
  const role = await prisma.role.findUnique({ where: { id: targetRoleId } });
  if (!role) throw badRequest("Unknown role");
  if (role.isSystem && actingRoleName !== role.name) throw forbidden("Only an Owner can grant the Owner role");
}

usersRouter.get("/", requirePermission("users:manage"), async (_req, res) => {
  ok(res, await prisma.user.findMany({ orderBy: { name: "asc" }, select: safeUser }));
});

/** Lightweight list for "assign lead to" dropdowns. */
usersRouter.get("/assignable", requirePermission("leads:read"), async (_req, res) => {
  ok(res, await prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }));
});

usersRouter.post("/", requirePermission("users:manage"), async (req, res) => {
  const d = body(req, z.object({ email: z.string().trim().toLowerCase().email().max(200), name: cleanText(100).pipe(z.string().min(2)), roleId: z.string().max(40), password: passwordPolicy }));
  await ownerGuard(d.roleId, req.user!.roleName);
  if (await prisma.user.findUnique({ where: { email: d.email } })) throw conflict("A user with this email already exists", { email: "Already exists" });
  const user = await prisma.user.create({ data: { email: d.email, name: d.name, roleId: d.roleId, passwordHash: await hashPassword(d.password) }, select: safeUser });
  await audit(req, "create", "User", user.id, { summary: user.email });
  created(res, user);
});

usersRouter.patch("/:id", requirePermission("users:manage"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const d = body(req, z.object({ name: cleanText(100).optional(), roleId: z.string().max(40).optional(), isActive: z.boolean().optional(), password: passwordPolicy.optional(), unlock: z.boolean().optional() }));
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) throw notFound("User");
  if (target.role.isSystem && req.user!.roleName !== target.role.name) throw forbidden("Only an Owner can edit an Owner");
  if (id === req.user!.id && (d.isActive === false || (d.roleId && d.roleId !== target.roleId))) throw badRequest("You cannot deactivate yourself or change your own role");
  if (d.roleId) await ownerGuard(d.roleId, req.user!.roleName);
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: d.name,
      roleId: d.roleId,
      isActive: d.isActive,
      ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
      ...(d.unlock ? { lockedUntil: null, failedLoginCount: 0 } : {}),
    },
    select: safeUser,
  });
  // Deactivation or password reset by an admin ends that user's sessions
  if (d.isActive === false || d.password) await prisma.session.deleteMany({ where: { userId: id } });
  await audit(req, "update", "User", id, { summary: `${user.email} ${Object.keys(d).filter((k) => k !== "password").join(", ")}${d.password ? " password" : ""}` });
  ok(res, user);
});

usersRouter.delete("/:id", requirePermission("users:manage"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  if (id === req.user!.id) throw badRequest("You cannot delete your own account");
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) throw notFound("User");
  if (target.role.isSystem) {
    const owners = await prisma.user.count({ where: { roleId: target.roleId, isActive: true } });
    if (owners <= 1) throw badRequest("You cannot delete the last Owner");
  }
  await prisma.user.delete({ where: { id } });
  await audit(req, "delete", "User", id, { summary: target.email });
  ok(res, { deleted: true });
});

// ── Roles & permissions ──

rolesRouter.get("/permissions", requirePermission("users:manage"), async (_req, res) => {
  ok(res, await prisma.permission.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] }));
});

rolesRouter.get("/", requirePermission("users:manage"), async (_req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" }, include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } } });
  ok(res, roles.map((r) => ({ ...r, permissions: r.permissions.map((p) => p.permission.key) })));
});

const roleSchema = z.object({ name: cleanText(50).pipe(z.string().min(2)), description: cleanText(200).nullish(), permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).max(100) });

async function setPermissions(roleId: string, keys: string[]) {
  const perms = await prisma.permission.findMany({ where: { key: { in: keys } } });
  await prisma.$transaction([prisma.rolePermission.deleteMany({ where: { roleId } }), prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId, permissionId: p.id })) })]);
}

rolesRouter.post("/", requirePermission("roles:manage"), async (req, res) => {
  const d = body(req, roleSchema);
  if (await prisma.role.findUnique({ where: { name: d.name } })) throw conflict("Role name already exists");
  const role = await prisma.role.create({ data: { name: d.name, description: d.description } });
  await setPermissions(role.id, d.permissions);
  await audit(req, "create", "Role", role.id, { summary: role.name, diff: d.permissions });
  created(res, role);
});

rolesRouter.put("/:id", requirePermission("roles:manage"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const d = body(req, roleSchema);
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw notFound("Role");
  if (role.isSystem) throw badRequest("The Owner role always has every permission");
  await prisma.role.update({ where: { id }, data: { name: d.name, description: d.description } });
  await setPermissions(id, d.permissions);
  await audit(req, "update", "Role", id, { summary: d.name, diff: d.permissions });
  ok(res, { id });
});

rolesRouter.delete("/:id", requirePermission("roles:manage"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) throw notFound("Role");
  if (role.isSystem) throw badRequest("System roles cannot be deleted");
  if (role._count.users) throw badRequest("Reassign this role's users before deleting it");
  await prisma.role.delete({ where: { id } });
  await audit(req, "delete", "Role", id, { summary: role.name });
  ok(res, { deleted: true });
});
