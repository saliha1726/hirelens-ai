import Link from "next/link";
import {
  BackgroundGlow,
  LandingNav,
  Hero,
  HowItWorks,
  ScoreDemo,
  Features,
  SafetySection,
  FinalCTA,
} from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-white dark:bg-slate-950">
      <BackgroundGlow />
      <LandingNav />
      <Hero />
      <HowItWorks />
      <ScoreDemo />
      <Features />
      <SafetySection />
      <FinalCTA />
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p>
          HireLens AI · Decision-support screening assistant ·{" "}
          <Link href="/dashboard" className="text-brand-600 hover:underline dark:text-brand-400">
            Open dashboard
          </Link>
        </p>
      </footer>
    </div>
  );
}
