"use client";

import { useEffect, useState } from "react";
import { cn, scoreTone, TONE_STYLES } from "@/lib/utils";

/**
 * Animated SVG score ring. Counts up from 0 to the score on mount and
 * animates the arc — the signature visual of HireLens results.
 */
export function ScoreRing({
  score,
  size = 88,
  strokeWidth = 8,
  label,
  className,
  delay = 0,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const tone = TONE_STYLES[scoreTone(score)];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const duration = 1100;
    const timer = window.setTimeout(() => {
      const tick = (t: number) => {
        if (start == null) start = t;
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplayed(Math.round(eased * score));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf ?? 0);
    };
  }, [score, delay]);

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      role="img"
      aria-label={`${label ?? "Match score"}: ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (displayed / 100) * circumference}
          style={{ transition: "stroke-dashoffset 0.15s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-semibold tabular-nums", tone.text)} style={{ fontSize: size / 3.4 }}>
          {displayed}
          <span className="text-[0.55em] font-normal text-slate-400">%</span>
        </span>
      </div>
    </div>
  );
}

/** Animated factor bar used in score breakdowns. */
export function FactorBar({
  score,
  weight,
  delay = 0,
}: {
  score: number;
  weight: number;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  const tone = TONE_STYLES[scoreTone(score)];

  useEffect(() => {
    const t = window.setTimeout(() => setWidth(score), 150 + delay);
    return () => window.clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: tone.stroke,
          transition: "width 1s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 text-[10px] font-medium text-white mix-blend-luminosity sm:block">
        w{weight}
      </span>
    </div>
  );
}
