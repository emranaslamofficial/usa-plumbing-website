import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

/** Sends email via SMTP. Without SMTP configured (development) the message is logged instead. */
export async function sendMail(to: string | string[], subject: string, text: string) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return;
  if (!transport) {
    logger.info({ to: recipients, subject, text }, "📧 [dev mail — SMTP not configured]");
    return;
  }
  try {
    await transport.sendMail({ from: env.MAIL_FROM, to: recipients, subject, text });
  } catch (err) {
    logger.error({ err, subject }, "email send failed");
  }
}
