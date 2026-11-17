import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./db";

const app = createApp();
const server = app.listen(env.PORT, () => logger.info(`🚰 API listening on port ${env.PORT} — public URL ${env.API_PUBLIC_URL} (admin at /admin)`));

// Housekeeping: purge expired sessions and reset tokens hourly
const cleanup = setInterval(async () => {
  const now = new Date();
  await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);
}, 3600_000);

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  clearInterval(cleanup);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
