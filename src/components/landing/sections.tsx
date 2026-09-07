"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ScanSearch,
  Gauge,
  BrainCircuit,
  ShieldCheck,
  FileSearch,
  ListChecks,
  GitCompareArrows,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ButtonLink, Card } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-300/20 via-pink-300/15 to-rose-200/20 blur-3xl dark:from-rose-600/15 dark:via-pink-600/10 dark:to-rose-500/15" />
      <div className="absolute right-[-200px] top-[45%] h-[400px] w-[400px] rounded-full bg-rose-200/10 blur-3xl dark:bg-rose-500/5" />
      <motion.div
        className="absolute left-[-100px] top-[30%] h-[300px] w-[300px] rounded-full bg-pink-200/10 blur-3xl dark:bg-pink-500/5"
        animate={{ y: [0, -30, 0, 20, 0], x: [0, 15, -10, 5, 0], scale: [1, 1.05, 0.97, 1.03, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[10%] left-[20%] h-[250px] w-[250px] rounded-full bg-rose-300/8 blur-3xl dark:bg-rose-500/5"
        animate={{ y: [0, 20, -15, 10, 0], x: [0, -10, 8, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

export function LandingNav() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <a href="#how-it-works" className="transition-colors hover:text-brand-600">How it works</a>
          <a href="#scoring" className="transition-colors hover:text-brand-600">Scoring</a>
          <a href="#features" className="transition-colors hover:text-brand-600">Features</a>
          <a href="#safety" className="transition-colors hover:text-brand-600">Safety</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink href="/dashboard" size="sm" className="hidden sm:inline-flex">
            Launch app
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
      <motion.div {...rise}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-950/50 dark:text-brand-300">
          <Sparkles className="h-3 w-3" /> Deterministic scoring · AI interpretation
        </span>
      </motion.div>
      <motion.h1
        {...rise}
        transition={{ delay: 0.08 }}
        className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
      >
        Screen 100 resumes.{" "}
        <span className="text-gradient-animated">Understand every score.</span>
      </motion.h1>
      <motion.p
        {...rise}
        transition={{ delay: 0.16 }}
        className="mx-auto mt-6 max-w-2xl text-balance text-lg text-slate-600 dark:text-slate-300"
      >
        HireLens AI parses resumes, matches them against your job description with a
        transparent weighted model, and adds AI-written insights — so you shortlist
        with evidence, not guesswork.
      </motion.p>
      <motion.div
        {...rise}
        transition={{ delay: 0.24 }}
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <motion.div
          whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(59, 107, 246, 0.35)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="animate-pulse-glow rounded-xl"
        >
          <ButtonLink href="/screen" size="lg">
            Start screening free <ArrowRight className="ml-1 h-4 w-4" />
          </ButtonLink>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <ButtonLink href="/dashboard" size="lg" variant="outline">
            See live demo data
          </ButtonLink>
        </motion.div>
      </motion.div>

      {/* Hero product mock */}
      <motion.div {...rise} transition={{ delay: 0.34 }} className="relative mx-auto mt-14 max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-brand-900/10 sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-slate-400">Screening run · Senior Frontend Engineer</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { name: "Sofia M.", score: 91, role: "Lead Frontend Engineer", tone: "text-emerald-600" },
              { name: "Amara O.", score: 84, role: "Senior Frontend Engineer", tone: "text-emerald-600" },
              { name: "Lena K.", score: 42, role: "Junior Developer", tone: "text-rose-500" },
            ].map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.15 }}
                className="rounded-xl border border-slate-200 p-4 text-left dark:border-slate-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.role}</p>
                  </div>
                  <ScoreRing score={c.score} size={52} strokeWidth={6} delay={700 + i * 250} />
                </div>
                <div className="mt-3 space-y-1.5">
                  <MiniBar label="Required skills" value={i === 2 ? 25 : i === 1 ? 95 : 100} />
                  <MiniBar label="Experience" value={i === 2 ? 35 : i === 1 ? 84 : 92} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={value >= 70 ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-rose-400"}
        />
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: FileSearch,
    title: "Add the job",
    body: "Paste any job description or pick a saved one. HireLens extracts required vs. preferred skills, experience bar, education and certifications.",
  },
  {
    icon: ScanSearch,
    title: "Upload resumes",
    body: "Drop up to 10 PDFs, DOCX or TXT files. Structured parsing pulls out skills, roles, timelines and certifications — entirely server-side.",
  },
  {
    icon: Gauge,
    title: "Get explainable scores",
    body: "A transparent weighted model produces each match score with per-factor breakdowns, strengths, gaps and evidence quotes from the resume.",
  },
  {
    icon: BrainCircuit,
    title: "Read AI insights — then decide",
    body: "AI adds balanced interpretation: summary, concerns and interview focus. Scores never change. You stay the decision-maker.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-slate-200/70 bg-slate-50/60 py-20 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...rise} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">From raw resumes to ranked insight</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Four steps, zero black boxes.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div key={step.title} {...rise} transition={{ delay: i * 0.08 }}>
              <Card className="card-hover h-full p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600 dark:text-brand-400">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400">STEP {i + 1}</span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ScoreDemo() {
  const factors = [
    ["Required skills", 95],
    ["Relevant experience", 84],
    ["Years of experience", 100],
    ["Preferred skills", 82],
    ["Education", 97],
    ["Certifications", 70],
    ["Job keywords", 76],
  ] as const;
  return (
    <section id="scoring" className="py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div {...rise}>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Explainable matching</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            &ldquo;Overall Match: 87&rdquo; — and exactly why
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
            No random LLM numbers. Every candidate is scored by a deterministic engine across seven
            weighted factors — required skills carry the most weight at 40%, then relevant experience,
            tenure, preferred skills, education, certifications and job-specific keywords.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-slate-700 dark:text-slate-200">
            {[
              "Per-factor scores with plain-language explanations",
              "Matching strengths & missing requirements called out explicitly",
              "Evidence quotes showing where each signal was found",
              "AI only interprets results — it can never move a number",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...rise} transition={{ delay: 0.15 }}>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-5 border-b border-slate-100 p-6 dark:border-slate-800">
              <ScoreRing score={87} size={96} strokeWidth={9} />
              <div>
                <p className="font-semibold">Amara Okafor</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">vs. Senior Frontend Engineer</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Strong match
                </span>
              </div>
            </div>
            <div className="space-y-4 p-6">
              {factors.map(([label, v], i) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{label}</span>
                    <span className="tabular-nums text-slate-500">{v}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${v}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      className={
                        v >= 80 ? "h-full rounded-full bg-emerald-500" : v >= 65 ? "h-full rounded-full bg-brand-500" : "h-full rounded-full bg-amber-500"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: ScanSearch, title: "Batch screening", body: "Up to 10 resumes per run against one job, ranked strongest-first with per-file error isolation." },
  { icon: ListChecks, title: "Requirement extraction", body: "Required/preferred split, minimum years, degree bar, certifications, seniority target — parsed automatically." },
  { icon: FileSearch, title: "Deep resume parsing", body: "Skills taxonomy with alias handling (\"reactjs\" = React), work timelines, education, certifications, domains." },
  { icon: GitCompareArrows, title: "Candidate comparison", body: "Put finalists side-by-side and compare factor-by-factor before deciding who advances." },
  { icon: BrainCircuit, title: "AI-powered insights", body: "Balanced AI summaries, concerns and interview focus areas — clearly separated from deterministic scoring." },
  { icon: ShieldCheck, title: "Privacy-first design", body: "Server-side-only API keys, protected characteristics excluded, resume content treated as untrusted data." },
] as const;

export function Features() {
  return (
    <section id="features" className="border-y border-slate-200/70 bg-slate-50/60 py-20 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...rise} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything a screening workflow needs</h2>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...rise} transition={{ delay: (i % 3) * 0.07 }}>
              <Card className="card-hover h-full p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600 dark:text-brand-400">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SafetySection() {
  return (
    <section id="safety" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...rise} className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-brand-50 p-8 sm:p-12 dark:border-emerald-500/20 dark:from-emerald-950/30 dark:via-slate-900 dark:to-brand-950/30">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Hiring safety</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                A decision assistant — <br className="hidden sm:block" />never an automated decider
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
                HireLens is built for human-in-the-loop hiring. It measures textual alignment between
                a resume and a role; it does not judge people, and it never rejects anyone on its own.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Protected characteristics are excluded from scoring inputs and explicitly ignored by the AI layer.",
                  "Resume content is treated as untrusted DATA — injected instructions cannot influence anything.",
                  "Every score shows its math: factor weights, sub-scores and evidence quotes are always visible.",
                  "Your data stays yours — the demo workspace lives in your browser; no resume is sold or shared.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-200">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-emerald-900/5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">What we never score on</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Race / ethnicity", "Religion", "Gender", "Sexual orientation", "Disability / health", "Age", "Political affiliation", "Family status"].map((t) => (
                  <span key={t} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 line-through decoration-rose-400/60 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
                If such information appears in a resume, it is ignored during analysis and never sent to the AI layer with identifying context.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="pb-24 pt-4">
      <motion.div {...rise} className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to screen smarter?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
          Run your first screening in under a minute — no account required. Demo data included.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/screen" size="lg">
            Start screening <ArrowRight className="ml-1 h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/dashboard" size="lg" variant="ghost">
            Explore the dashboard
          </ButtonLink>
        </div>
      </motion.div>
    </section>
  );
}
