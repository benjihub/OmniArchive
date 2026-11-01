import { ChevronDown, FileOutput, Layers, Lock, Search, ShieldCheck } from "lucide-react";
import { BentoCard } from "@/components/marketing/BentoCard";
import { EmailForm } from "@/components/marketing/EmailForm";
import { Feature } from "@/components/marketing/Feature";
import { FAQ } from "@/lib/faq";

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090D16] text-slate-50 antialiased selection:bg-indigo-500/40">
      {/* Background grid + hero glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 0%, #000 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 0%, #000 40%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-160px] h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, #6366F1 0%, #8B5CF6 40%, transparent 70%)" }}
      />

      {/* Navigation */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_0_20px_-4px_rgba(99,102,241,0.9)]">
            <Lock className="h-4 w-4 text-white" aria-hidden />
          </span>
          OmniArchive
        </a>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200 shadow-[0_0_20px_-6px_rgba(99,102,241,0.8)]">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818CF8]" aria-hidden />
          v1.0 Early Access
        </span>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#131B2E]/70 px-4 py-1.5 text-xs text-slate-300 backdrop-blur">
            <Layers className="h-3.5 w-3.5 text-violet-400" aria-hidden />
            Multi-Platform Support for ChatGPT, Claude &amp; Gemini
          </span>
          <h1 className="mx-auto mt-8 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Stop Letting AI Platforms Trap Your Chat History.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-slate-400 sm:text-lg">
            The universal, local-first vault for ChatGPT, Claude, and Gemini. Search your conversation history
            offline, organize prompts, and export clean Markdown or PDFs without cloud locks.
          </p>
          <div className="mt-10">
            <EmailForm id="waitlist" />
          </div>
        </section>

        {/* Bento features */}
        <section id="features" className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="mx-auto max-w-xl text-balance text-center text-3xl font-semibold tracking-tight">
            One vault for every conversation you have with AI
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <BentoCard icon={<Layers className="h-5 w-5" aria-hidden />} title="Multi-Platform Native">
              Save and browse chats from ChatGPT, Claude, and Gemini in one library. No more hunting through three
              different sidebars to find that one answer.
            </BentoCard>
            <BentoCard icon={<ShieldCheck className="h-5 w-5" aria-hidden />} title="100% Local Privacy">
              Everything lives in local browser storage (IndexedDB) on your device. No account, no cloud sync, no
              tracking. Your chats never touch our servers because we do not have any.
            </BentoCard>
            <BentoCard icon={<Search className="h-5 w-5" aria-hidden />} title="Instant Offline Search">
              Full-text search across thousands of chats, with or without an internet connection. Find a snippet, a
              prompt, or a code block in milliseconds.
            </BentoCard>
            <BentoCard icon={<FileOutput className="h-5 w-5" aria-hidden />} title="Flawless Exporter Engine">
              Export to Markdown, Notion, or styled PDF without broken code blocks, mangled tables, or lost LaTeX
              formulas.
            </BentoCard>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-4xl px-6 pb-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Pay once, or never</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-slate-400">
            No subscriptions for storing your own data in your own browser.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-[#131B2E] p-8">
              <h3 className="text-lg font-semibold">Free Forever</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">$0</span>
                <span className="text-sm text-slate-500">forever</span>
              </p>
              <ul className="mt-6 space-y-3">
                <Feature>Unlimited local browser storage (IndexedDB)</Feature>
                <Feature>Instant full-text search</Feature>
                <Feature>Manual chat saves</Feature>
                <Feature>ChatGPT, Claude &amp; Gemini</Feature>
              </ul>
              <a
                href="#waitlist"
                className="mt-8 block rounded-xl border border-slate-700 px-4 py-2.5 text-center text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Join the waitlist
              </a>
            </div>

            <div className="relative rounded-2xl bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] p-px shadow-[0_0_60px_-15px_rgba(99,102,241,0.8)]">
              <div className="h-full rounded-[15px] bg-[#131B2E] p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pro Lifetime</h3>
                  <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
                    One-time
                  </span>
                </div>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">$19</span>
                  <span className="text-sm text-slate-500">one-time</span>
                </p>
                <ul className="mt-6 space-y-3">
                  <Feature>Everything in Free</Feature>
                  <Feature>Batch exports</Feature>
                  <Feature>Custom formatting templates</Feature>
                  <Feature>Optional end-to-end encrypted backup</Feature>
                  <Feature>Pay once, own it forever</Feature>
                </ul>
                <a
                  href="#waitlist"
                  className="mt-8 block rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  Get early access
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-2xl px-6 pb-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Questions, answered</h2>
          <div className="mt-10 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-[#131B2E]">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-slate-50 focus:outline-none focus-visible:text-indigo-300 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            Your conversations are worth keeping. Keep them yours.
          </h2>
          <div className="mt-8">
            <EmailForm id="waitlist-bottom" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
          <p>&copy; {new Date().getFullYear()} OmniArchive. All rights reserved.</p>
          <p className="flex items-center gap-2 text-slate-400">
            <Lock className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
            Your data stays on your device.
          </p>
          <nav className="flex gap-5" aria-label="Social links">
            {process.env.NEXT_PUBLIC_X_URL ? (
              <a
                href={process.env.NEXT_PUBLIC_X_URL}
                className="transition hover:text-slate-200"
                rel="noopener noreferrer"
                target="_blank"
              >
                X
              </a>
            ) : null}
            {process.env.NEXT_PUBLIC_GITHUB_URL ? (
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL}
                className="transition hover:text-slate-200"
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            ) : null}
            <a href="mailto:hello@omniarchive.app" className="transition hover:text-slate-200">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
