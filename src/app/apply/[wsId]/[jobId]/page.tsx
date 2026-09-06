"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Upload, CheckCircle2, Loader2, ArrowLeft, Clock, MapPin, GraduationCap } from "lucide-react";
import { Logo } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { JobRequirements } from "@/lib/types";

interface PageProps {
  params: Promise<{ wsId: string; jobId: string }>;
}

export default function ApplyPage({ params }: PageProps) {
  const { wsId, jobId } = use(params);
  const [job, setJob] = useState<JobRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch(`/api/public-job?wsId=${wsId}&jobId=${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJob(data.job);
        }
      } catch {}
      setLoading(false);
    }
    loadJob();
  }, [wsId, jobId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !fullName.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("wsId", wsId);
      form.append("jobId", jobId);
      form.append("fullName", fullName.trim());
      form.append("email", email.trim());
      form.append("phone", phone.trim());
      form.append("coverLetter", coverLetter.trim());
      form.append("resume", file);

      const res = await fetch("/api/apply", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");

      setMatchScore(data.match?.score ?? null);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/20">
        <header className="glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
            <Logo />
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Application submitted!</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Thank you, <strong>{fullName}</strong>. Your application for <strong>{job?.title}</strong> has been received.
            </p>
            {matchScore !== null && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 dark:border-brand-500/30 dark:bg-brand-950/50">
                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                  Match Score: {Math.round(matchScore * 100)}%
                </span>
              </div>
            )}
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              We&apos;ll review your application and get back to you soon.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/20">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {job ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Job summary card */}
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600 dark:text-brand-400">
                  <Briefcase className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
                  {job.company && <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                {job.minYearsExperience != null && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {job.minYearsExperience}+ years</span>
                )}
                {job.educationRequirement && (
                  <span className="flex items-center gap-1 capitalize"><GraduationCap className="h-3.5 w-3.5" /> {job.educationRequirement.level.replace("-", " ")}</span>
                )}
                {job.seniorityTarget && (
                  <span className="flex items-center gap-1 capitalize"><MapPin className="h-3.5 w-3.5" /> {job.seniorityTarget}</span>
                )}
              </div>
              {job.requiredSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.requiredSkills.slice(0, 8).map((s) => (
                    <span key={s.name} className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Application form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Apply for this position</h2>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full name *</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="John Doe" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="john@example.com" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="+1 (555) 123-4567" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Resume *</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-sm transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-brand-500">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{fileName || "Click to upload PDF, DOCX, or TXT"}</span>
                  <input type="file" accept=".pdf,.docx,.txt" className="hidden" required onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setFile(f); setFileName(f.name); }
                  }} />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">Max 10 MB</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cover letter (optional)</label>
                <textarea rows={4} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Tell us why you're a great fit..." />
              </div>

              <button type="submit" disabled={submitting || !file || !fullName.trim() || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 disabled:opacity-50">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit application"}
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="py-20 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400">Job not found</p>
            <p className="mt-1 text-sm text-slate-400">This position may have been removed.</p>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
          Powered by <strong>HireLens AI</strong> · AI-powered resume screening
        </div>
      </footer>
    </div>
  );
}
