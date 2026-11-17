import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../lib/api";
import { useAuth, type Me } from "../lib/auth";
import { Button, ErrorBox, Field } from "../components/ui";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-center text-lg font-bold text-slate-900">
          Website <span className="text-brand-600">Admin</span>
        </p>
        <h1 className="mt-1 text-center text-sm text-slate-500">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Login() {
  const { setUser } = useAuth();
  const [step, setStep] = useState<"password" | "totp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (step === "password") {
        const r = await api.post<{ twoFactorRequired: boolean; user?: Me }>("/auth/login", { email, password });
        if (r.twoFactorRequired) setStep("totp");
        else setUser(r.user!);
      } else {
        const r = await api.post<{ user: Me }>("/auth/2fa/verify", { code });
        setUser(r.user);
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={step === "password" ? "Sign in to manage your website" : "Enter the 6-digit code from your authenticator app"}>
      <ErrorBox error={error} />
      <form onSubmit={submit} className="space-y-4">
        {step === "password" ? (
          <>
            <Field label="Email">
              <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password">
              <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </>
        ) : (
          <Field label="Verification code">
            <input className="input text-center text-lg tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
          </Field>
        )}
        <Button className="w-full" loading={busy} type="submit">
          {step === "password" ? "Sign in" : "Verify"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="text-brand-700 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <Shell title="Reset your password">
      <ErrorBox error={error} />
      {done ? (
        <p className="text-sm text-slate-600">If an account exists for that email, a reset link is on its way. The link expires in 1 hour.</p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api.post("/auth/forgot-password", { email });
              setDone(true);
            } catch (err) {
              setError(err);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Email">
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button className="w-full" loading={busy} type="submit">
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <Shell title="Choose a new password">
      <ErrorBox error={error} />
      {done ? (
        <p className="text-sm text-slate-600">
          Password updated. <Link to="/login" className="text-brand-700 underline">Sign in</Link>
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api.post("/auth/reset-password", { token: params.get("token"), password });
              setDone(true);
            } catch (err) {
              setError(err);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="New password" hint="At least 12 characters, including letters and a number.">
            <input className="input" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button className="w-full" loading={busy} type="submit">
            Update password
          </Button>
        </form>
      )}
    </Shell>
  );
}
