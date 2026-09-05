"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle2, LogOut } from "lucide-react";
import { updateProfile, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { useUser } from "@/lib/hooks/use-user";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.displayName ?? "");
    }
  }, [user]);

  if (userLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (!user) return null;

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const auth = getFirebaseAuth();
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  const creationTime = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString()
    : "—";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
        Settings
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Manage your account and preferences.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="mb-0.5 inline h-4 w-4" /> Profile updated successfully.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Profile</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Your account information</p>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input value={user.email ?? ""} disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400" />
            <p className="mt-1 text-[11px] text-slate-400">Email cannot be changed from here.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Account created</label>
            <input value={creationTime} disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400" />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveProfile} disabled={saving || !fullName.trim()}
              className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Security</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Account security information</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              To change your password, use the &quot;Forgot password?&quot; link on the login page.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Auth provider</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {user.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email/Password"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900">
        <div className="p-5">
          <button onClick={handleSignOut}
            className="focus-ring inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50 active:scale-[0.98] dark:border-rose-800 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/30">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
