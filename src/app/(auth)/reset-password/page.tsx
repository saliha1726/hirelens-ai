"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { confirmPasswordReset } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { Logo } from "@/components/layout/app-shell";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");
  const error = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!oobCode) {
      setLocalError("Invalid or expired reset link. Please request a new one.");
      return;
    }
    setLoading(true);
    setLocalError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      await confirmPasswordReset(auth, oobCode, password);
      router.push("/login?success=Password+updated+successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      setLocalError(msg.includes("expired-action-code") ? "Reset link has expired. Please request a new one." : msg);
      setLoading(false);
    }
  }

  const displayError = localError ?? (error ? decodeURIComponent(error) : null);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center"><Logo /></div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Set new password</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your new password below</p>
      </div>

      {displayError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {displayError}
        </div>
      )}

      {!oobCode && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          No reset code found. Please use the link from your email, or{" "}
          <Link href="/forgot-password" className="font-medium underline">request a new reset link</Link>.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="Min. 8 characters"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900" />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm new password</label>
          <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="Re-enter password"
            className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <button type="submit" disabled={loading || !oobCode}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Back to sign in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
