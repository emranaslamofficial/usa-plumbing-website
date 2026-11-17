import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  // Never log secrets or personal data
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-csrf-token']",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.twoFactorSecret",
    ],
    censor: "[redacted]",
  },
  ...(env.isProd ? {} : { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } } }),
});
