"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock3 } from "lucide-react";

// One-month founding offer, ending at midnight in Kampala (EAT).
const OFFER_END = new Date("2026-12-04T00:00:00+03:00").getTime();

type Remaining = { days: number; hours: number; minutes: number; seconds: number; ended: boolean };

function getRemaining(now: number): Remaining {
  const milliseconds = Math.max(0, OFFER_END - now);
  return {
    days: Math.floor(milliseconds / 86_400_000),
    hours: Math.floor((milliseconds / 3_600_000) % 24),
    minutes: Math.floor((milliseconds / 60_000) % 60),
    seconds: Math.floor((milliseconds / 1_000) % 60),
    ended: milliseconds === 0,
  };
}

const twoDigits = (value: number) => String(value).padStart(2, "0");

export function OfferCountdown() {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const update = () => setRemaining(getRemaining(Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative z-10 border-b border-purple-300/15 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 px-4 py-2.5 text-purple-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center sm:justify-between sm:text-left">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold sm:text-xs">
          <Clock3 className="h-4 w-4 shrink-0 text-violet-300" aria-hidden />
          {remaining?.ended ? "The first-month founding offer has ended." : "First-month offer: Pro Lifetime for $19 — join the waitlist to claim it."}
        </p>
        {!remaining?.ended && <div className="flex items-center gap-1.5 font-mono text-[10px] tabular-nums sm:text-xs" aria-label="Time remaining in the founding offer" aria-live="off">
          {remaining ? <>
            <span className="rounded border border-white/15 bg-white/10 px-1.5 py-1">{twoDigits(remaining.days)}<small className="ml-1 font-sans text-[8px] text-purple-200">D</small></span>
            <span className="text-purple-300">:</span>
            <span className="rounded border border-white/15 bg-white/10 px-1.5 py-1">{twoDigits(remaining.hours)}<small className="ml-1 font-sans text-[8px] text-purple-200">H</small></span>
            <span className="text-purple-300">:</span>
            <span className="rounded border border-white/15 bg-white/10 px-1.5 py-1">{twoDigits(remaining.minutes)}<small className="ml-1 font-sans text-[8px] text-purple-200">M</small></span>
            <span className="text-purple-300">:</span>
            <span className="rounded border border-white/15 bg-white/10 px-1.5 py-1">{twoDigits(remaining.seconds)}<small className="ml-1 font-sans text-[8px] text-purple-200">S</small></span>
          </> : <span className="text-purple-200">Loading timer…</span>}
        </div>}
        <a href="#waitlist" className="inline-flex items-center gap-1 text-[10px] font-semibold text-white underline decoration-purple-300/50 underline-offset-4 hover:decoration-white sm:text-xs">Join waitlist <ArrowRight className="h-3 w-3" aria-hidden /></a>
      </div>
    </div>
  );
}
