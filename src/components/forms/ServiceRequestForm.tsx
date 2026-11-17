"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CircleCheck, LoaderCircle, Phone, Send, CircleAlert } from "lucide-react";
import type { ServiceRequestInput, ServiceRequestResult } from "@/types";
import { validateServiceRequest, formatPhoneInput, PREFERRED_TIMES, type FieldErrors } from "@/lib/validation";
import { cn, telHref } from "@/lib/utils";
import { getAttribution, newSubmissionKey } from "@/lib/attribution";

type Values = Omit<ServiceRequestInput, "startedAt" | "captchaToken" | "sourcePath" | "formType" | "submissionKey" | "attribution">;

const EMPTY: Values = { name: "", phone: "", email: "", serviceSlug: "", zip: "", preferredDate: "", preferredTime: "", message: "", company: "" };

const ORDER: (keyof Values)[] = ["name", "phone", "email", "serviceSlug", "zip", "preferredDate", "preferredTime", "message"];

interface Props {
  services: { slug: string; name: string }[];
  phone: { display: string; e164: string };
  defaultService?: string;
  compact?: boolean;
  /** "contact" submissions are also stored as contact messages in the CMS. */
  formType?: "service_request" | "contact";
}

export function ServiceRequestForm({ services, phone, defaultService, compact, formType = "service_request" }: Props) {
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;
  const [values, setValues] = useState<Values>({ ...EMPTY, serviceSlug: defaultService ?? "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [referenceId, setReferenceId] = useState<string>();
  const startedAt = useRef<number>(0);
  // Same key for retries of one submission → the backend never creates duplicate leads
  const submissionKey = useRef<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [minDate, setMinDate] = useState<string>();

  useEffect(() => {
    startedAt.current = Date.now();
    submissionKey.current = newSubmissionKey();
    const d = new Date();
    setMinDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const set = (field: keyof Values, value: string) => {
    const next = { ...values, [field]: field === "phone" ? formatPhoneInput(value) : value };
    setValues(next);
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validateServiceRequest(next)[field] }));
  };

  const blur = (field: keyof Values) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateServiceRequest(values)[field] }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateServiceRequest(values);
    setErrors(found);
    setTouched(Object.fromEntries(ORDER.map((f) => [f, true])));
    const firstBad = ORDER.find((f) => found[f]);
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(firstBad))}`)?.focus();
      return;
    }

    setStatus("submitting");
    setServerMessage("");
    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          startedAt: startedAt.current,
          sourcePath: window.location.pathname,
          formType,
          submissionKey: submissionKey.current,
          attribution: getAttribution(),
          // captchaToken: Phase 2 — add Turnstile/reCAPTCHA token here
        } satisfies ServiceRequestInput),
      });
      const data = (await res.json()) as ServiceRequestResult;
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setServerMessage(data.message || "Something went wrong. Please call us instead.");
        setStatus("error");
        return;
      }
      setReferenceId(data.referenceId);
      setServerMessage(data.message);
      setStatus("success");
    } catch {
      setServerMessage("We couldn't send your request. Please check your connection or call us directly.");
      setStatus("error");
    }
  }

  const fieldCls = (f: keyof Values) =>
    cn(
      "mt-1.5 block w-full rounded-xl bg-white px-4 text-ink-900 shadow-sm ring-1 transition-shadow placeholder:text-ink-400 focus:outline-none focus:ring-2",
      errors[f] ? "ring-red-400 focus:ring-red-500" : "ring-ink-200 focus:ring-brand-500",
    );

  const Err = ({ f }: { f: keyof Values }) =>
    errors[f] ? (
      <p id={id(`${f}-error`)} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600">
        <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
        {errors[f]}
      </p>
    ) : null;

  const a11y = (f: keyof Values) => ({
    id: id(f),
    name: f,
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? id(`${f}-error`) : undefined,
    onBlur: () => blur(f),
  });

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <m.div
            key="success"
            ref={successRef}
            tabIndex={-1}
            role="status"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white p-8 text-center ring-1 ring-emerald-200 focus:outline-none"
          >
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CircleCheck aria-hidden="true" className="size-9" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">Request received — thank you!</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-500">{serverMessage}</p>
            {referenceId && (
              <p className="mt-4 text-sm text-ink-500">
                Reference number: <span className="font-mono font-semibold text-ink-900">{referenceId}</span>
              </p>
            )}
            <div className="mt-6 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
              Urgent problem? Don&apos;t wait for a callback —{" "}
              <a href={telHref(phone.e164)} className="font-bold text-brand-700 underline underline-offset-4">
                call {phone.display}
              </a>
              .
            </div>
          </m.div>
        ) : (
          <m.form
            key="form"
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            aria-describedby={id("required-note")}
            initial={false}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <p id={id("required-note")} className="text-sm text-ink-500">
              Fields marked <span className="font-semibold text-red-600">*</span> are required.
            </p>

            <div className={cn("grid gap-5", !compact && "sm:grid-cols-2")}>
              <div>
                <label htmlFor={id("name")} className="text-sm font-semibold text-ink-800">
                  Full name <span className="text-red-600">*</span>
                </label>
                <input {...a11y("name")} type="text" autoComplete="name" required value={values.name} onChange={(e) => set("name", e.target.value)} className={cn(fieldCls("name"), "h-12")} />
                <Err f="name" />
              </div>
              <div>
                <label htmlFor={id("phone")} className="text-sm font-semibold text-ink-800">
                  Phone <span className="text-red-600">*</span>
                </label>
                <input {...a11y("phone")} type="tel" inputMode="tel" autoComplete="tel-national" required placeholder="(555) 555-0123" value={values.phone} onChange={(e) => set("phone", e.target.value)} className={cn(fieldCls("phone"), "h-12")} />
                <Err f="phone" />
              </div>
              <div>
                <label htmlFor={id("email")} className="text-sm font-semibold text-ink-800">
                  Email <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input {...a11y("email")} type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} className={cn(fieldCls("email"), "h-12")} />
                <Err f="email" />
              </div>
              <div>
                <label htmlFor={id("zip")} className="text-sm font-semibold text-ink-800">
                  ZIP code <span className="text-red-600">*</span>
                </label>
                <input {...a11y("zip")} type="text" inputMode="numeric" autoComplete="postal-code" maxLength={10} required value={values.zip} onChange={(e) => set("zip", e.target.value)} className={cn(fieldCls("zip"), "h-12")} />
                <Err f="zip" />
              </div>
              <div className={cn(!compact && "sm:col-span-2")}>
                <label htmlFor={id("serviceSlug")} className="text-sm font-semibold text-ink-800">
                  Service needed <span className="text-red-600">*</span>
                </label>
                <select {...a11y("serviceSlug")} required value={values.serviceSlug} onChange={(e) => set("serviceSlug", e.target.value)} className={cn(fieldCls("serviceSlug"), "h-12 pr-10")}>
                  <option value="">Select a service…</option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                  <option value="other">Other / Not sure</option>
                </select>
                <Err f="serviceSlug" />
              </div>
              <div>
                <label htmlFor={id("preferredDate")} className="text-sm font-semibold text-ink-800">
                  Preferred date
                </label>
                <input {...a11y("preferredDate")} type="date" min={minDate} value={values.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} className={cn(fieldCls("preferredDate"), "h-12")} />
                <Err f="preferredDate" />
              </div>
              <div>
                <label htmlFor={id("preferredTime")} className="text-sm font-semibold text-ink-800">
                  Preferred time
                </label>
                <select {...a11y("preferredTime")} value={values.preferredTime} onChange={(e) => set("preferredTime", e.target.value)} className={cn(fieldCls("preferredTime"), "h-12 pr-10")}>
                  <option value="">Any time</option>
                  {PREFERRED_TIMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Err f="preferredTime" />
              </div>
              <div className={cn(!compact && "sm:col-span-2")}>
                <label htmlFor={id("message")} className="text-sm font-semibold text-ink-800">
                  Describe the problem
                </label>
                <textarea {...a11y("message")} rows={4} maxLength={2000} placeholder="e.g. Kitchen sink is draining slowly and gurgling" value={values.message} onChange={(e) => set("message", e.target.value)} className={cn(fieldCls("message"), "py-3")} />
                <Err f="message" />
              </div>
            </div>

            {/* Honeypot: hidden from people, often filled by bots */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor={id("company")}>Company</label>
              <input id={id("company")} name="company" type="text" tabIndex={-1} autoComplete="off" value={values.company} onChange={(e) => set("company", e.target.value)} />
            </div>

            {/* Phase 2 spam protection placeholder: render Cloudflare Turnstile / reCAPTCHA widget here */}

            <div aria-live="polite">
              {status === "error" && serverMessage && (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-200">
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {serverMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-base font-bold uppercase tracking-wide text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              {status === "submitting" ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Sending request…
                </>
              ) : (
                <>
                  <Send aria-hidden="true" className="size-5" /> Request Plumbing Service
                </>
              )}
            </button>

            <p className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-ink-500">
              <Phone aria-hidden="true" className="size-4" /> Need help right now?
              <a href={telHref(phone.e164)} className="font-bold text-brand-700 hover:underline">
                Call {phone.display}
              </a>
            </p>
            <p className="text-center text-xs text-ink-400">
              By submitting, you agree to be contacted about your request. See our{" "}
              <a href="/privacy-policy" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
