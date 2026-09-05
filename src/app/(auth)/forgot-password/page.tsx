"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { Logo } from "@/components/layout/app-shell";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    setLocalSuccess(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setLocalSuccess("If an account exists with that email, you will receive a password reset link.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      setLocalError(msg.includes("user-not-found") ? "No account found with this email" : msg);
    } finally {
      setLoading(false);
    }
  }

  const displayError = localError ?? (error ? decodeURIComponent(error) : null);
  const displaySuccess = localSuccess ?? (success ? decodeURIComponent(success) : null);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center"><Logo /></div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your email and we&apos;ll send you a reset link</p>
      </div>

      {displayError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {displayError}
        </div>
      )}

      {displaySuccess && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="mb-1 inline h-4 w-4" /> {displaySuccess}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com"
            className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <button type="submit" disabled={loading}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Back to sign in</Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
