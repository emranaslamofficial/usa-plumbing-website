import type { ServiceRequestInput } from "@/types";

/**
 * Shared validation for the service-request form.
 * Runs in the browser for instant feedback AND in the API route (server-side) —
 * never trust client-side validation alone. The Phase 2 backend must validate again.
 */

export type FieldErrors = Partial<Record<keyof ServiceRequestInput, string>>;

export const PREFERRED_TIMES = [
  { value: "asap", label: "As soon as possible" },
  { value: "morning", label: "Morning (8 AM – 12 PM)" },
  { value: "afternoon", label: "Afternoon (12 – 4 PM)" },
  { value: "evening", label: "Evening (4 – 7 PM)" },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
export const MIN_FILL_MS = 2500;

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function formatPhoneInput(raw: string) {
  const d = normalizePhone(raw).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function validateServiceRequest(input: Partial<ServiceRequestInput>, validServiceSlugs?: string[]): FieldErrors {
  const e: FieldErrors = {};
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const phone = normalizePhone(input.phone ?? "");
  const zip = input.zip?.trim() ?? "";
  const message = input.message?.trim() ?? "";

  if (name.length < 2) e.name = "Please enter your name.";
  else if (name.length > 100) e.name = "Name is too long.";

  if (!phone) e.phone = "Please enter a phone number so we can reach you.";
  else if (phone.length !== 10) e.phone = "Enter a valid 10-digit US phone number.";

  if (email && !EMAIL_RE.test(email)) e.email = "Enter a valid email address, or leave it blank.";

  if (!input.serviceSlug) e.serviceSlug = "Please choose the service you need.";
  else if (validServiceSlugs && input.serviceSlug !== "other" && !validServiceSlugs.includes(input.serviceSlug))
    e.serviceSlug = "Please choose a service from the list.";

  if (!zip) e.zip = "Please enter your ZIP code.";
  else if (!ZIP_RE.test(zip)) e.zip = "Enter a valid 5-digit ZIP code.";

  if (input.preferredDate && input.preferredDate < todayISO()) e.preferredDate = "Please choose today or a future date.";

  if (input.preferredTime && !PREFERRED_TIMES.some((t) => t.value === input.preferredTime))
    e.preferredTime = "Please choose a time window.";

  if (message.length > 2000) e.message = "Please keep your message under 2,000 characters.";

  return e;
}
