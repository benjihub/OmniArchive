import Image from "next/image";
import {
  ArrowDownToLine, ArrowRight, Archive, Check, Database, FileArchive,
  Layers, Lock, Search, ShieldCheck,
} from "lucide-react";
import { EmailForm } from "@/components/marketing/EmailForm";
import { Feature } from "@/components/marketing/Feature";
import { ParticleBackground } from "@/components/marketing/ParticleBackground";
import { ThemeToggle } from "@/components/marketing/ThemeToggle";
import { OfferCountdown } from "@/components/marketing/OfferCountdown";
import { FAQ } from "@/lib/faq";

const steps = [
  {
    number: "01",
    title: "Capture or import",
    description: "New chats are saved from supported AI sites. Bring in supported platform history files with Pro, or restore an OmniArchive backup for free.",
    icon: <ArrowDownToLine className="h-5 w-5" aria-hidden />,
  },
  {
    number: "02",
    title: "Find it in one vault",
    description: "Search conversation text across ChatGPT, Claude, and Gemini. Filter by platform, folder, tag, date, or speaker.",
    icon: <Search className="h-5 w-5" aria-hidden />,
  },
  {
    number: "03",
    title: "Take it with you",
    description: "Export an individual chat to Markdown or PDF, or make a portable .oav backup you can restore later.",
    icon: <Archive className="h-5 w-5" aria-hidden />,
  },
];

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090D16] text-slate-50 antialiased selection:bg-indigo-500/40">
      <ParticleBackground />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[720px] opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 70% 70% at 50% 0%, #000 40%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 0%, #000 40%, transparent 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-160px] z-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-35 blur-[120px]" style={{ background: "radial-gradient(circle, #6366F1 0%, #8B5CF6 40%, transparent 70%)" }} />

      <OfferCountdown />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight" aria-label="OmniArchive home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_0_20px_-4px_rgba(99,102,241,0.9)]"><Lock className="h-4 w-4 text-white" aria-hidden /></span>
          OmniArchive
        </a>
        <nav className="hidden items-center gap-6 text-xs text-slate-400 sm:flex" aria-label="Main navigation">
          <a className="transition hover:text-white" href="#how-it-works">How it works</a>
          <a className="transition hover:text-white" href="#pricing">Pricing</a>
          <a className="transition hover:text-white" href="#privacy">Privacy</a>
        </nav>
        <div className="flex items-center gap-2"><ThemeToggle /><a href="#waitlist" className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-[10px] font-semibold text-purple-100 transition hover:bg-purple-500/20 sm:text-xs">Founding month · $19 Pro</a></div>
      </header>

      <main id="top" className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#131B2E]/70 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur"><Layers className="h-3.5 w-3.5 text-violet-400" aria-hidden />For ChatGPT, Claude &amp; Gemini</span>
            <h1 className="mt-6 max-w-2xl text-balance text-4xl font-semibold leading-[1.07] tracking-tight sm:text-5xl lg:text-[3.6rem]">Your AI chats. One private archive. <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">Yours to take with you.</span></h1>
            <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">Capture new conversations in one local vault, search across platforms, and keep a portable backup. Import supported history exports with Pro; your archive stays on your device.</p>
            <div className="mt-7 max-w-md">
              <EmailForm id="waitlist" />
              <p className="mt-1 text-center text-[11px] leading-relaxed text-slate-500">Join before December 3, 2026 to claim the $19 lifetime offer when beta checkout opens. No card required now.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-slate-400 sm:text-xs">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />Chats stored locally</span>
              <span className="inline-flex items-center gap-1.5"><Search className="h-3.5 w-3.5 text-indigo-300" />Search free</span>
              <span className="inline-flex items-center gap-1.5"><FileArchive className="h-3.5 w-3.5 text-violet-300" />Portable backup</span>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[490px]">
            <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0D1423] shadow-[0_30px_100px_-35px_rgba(99,102,241,0.55)]">
              <Image src="/media/omniarchive-gemini-vault.png" alt="OmniArchive side panel showing a searchable vault with ChatGPT, Claude, and Gemini conversations" width={880} height={920} priority className="h-auto w-full" />
            </div>
            <figcaption className="mt-3 text-center text-[10px] text-slate-500">The live extension vault: conversations from three AI platforms in one place.</figcaption>
          </figure>
        </section>

        <section id="how-it-works" className="border-y border-slate-800/80 bg-[#0D1423]/70">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">A portable archive, by design</p><h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Keep the history. Keep control of it.</h2><p className="mt-4 text-sm leading-relaxed text-slate-400">Capture today’s chats, bring supported history into the vault, and carry your archive forward with exports and backups.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((step) => <article key={step.number} className="rounded-2xl border border-slate-800 bg-[#131B2E]/80 p-6">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-widest text-slate-600">{step.number}</span><span className="text-indigo-300">{step.icon}</span></div>
                <h3 className="mt-5 text-base font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
              </article>)}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div className="order-2 overflow-hidden rounded-2xl border border-slate-800 bg-[#0D1423] shadow-2xl lg:order-1">
            <Image src="/media/omniarchive-message-detail.png" alt="OmniArchive conversation detail view with readable message structure and Markdown and PDF export controls" width={880} height={920} className="h-auto w-full" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">Readable when it leaves the chat</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight">A useful answer should stay useful in your archive.</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">Open a saved thread with its messages organized by speaker. Export individual conversations to Markdown or PDF, with rich content such as lists and tables kept readable.</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />One-click Markdown and PDF for individual chats</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />Portable .oav backup and restore stays free</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />Folder Markdown export and supported history imports with Pro</li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-6 sm:pb-20">
          <div className="mb-6 text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">See the product</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">A real walkthrough of OmniArchive</h2><p className="mt-2 text-sm text-slate-400">Watch the capture, vault, export, and backup workflow.</p></div>
          <video className="w-full rounded-2xl border border-slate-700 bg-[#0D1423] shadow-[0_25px_80px_-40px_rgba(99,102,241,0.5)]" controls preload="none" playsInline poster="/media/omniarchive-demo-poster.png" aria-label="OmniArchive product walkthrough video">
            <source src="/media/omniarchive-walkthrough.mp4" type="video/mp4" />
            Your browser does not support the video element. You can still explore the screenshots above.
          </video>
        </section>

        <section id="privacy" className="border-y border-slate-800/80 bg-[#0D1423]/70">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300"><Database className="h-5 w-5" aria-hidden /></span><h2 className="mt-4 text-2xl font-semibold tracking-tight">Private by how it stores your chats.</h2><p className="mt-3 text-sm leading-relaxed text-slate-400">Conversation content is saved in the extension’s local browser database. OmniArchive’s website does not receive your archived chats.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#131B2E] p-4"><h3 className="text-xs font-semibold text-slate-200">Your archive</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">Chat text stays in local extension storage. Export a backup before clearing browser extension data or uninstalling.</p></div>
              <div className="rounded-xl border border-slate-800 bg-[#131B2E] p-4"><h3 className="text-xs font-semibold text-slate-200">What contacts servers</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">Waitlist signup sends your email to our email provider. Pro activation sends a Paddle transaction ID for purchase verification, never your chats.</p></div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">Simple lifetime upgrade</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Free for your everyday archive. Pro for the heavy lifting.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Keep searching and exporting your own chats for free. Upgrade when you need deeper organization or a large migration.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-[#131B2E] p-7 sm:p-8">
              <h3 className="text-lg font-semibold">Free Local Vault</h3><p className="mt-2 text-sm text-slate-400">Core capture, search, and portability. $0 forever.</p>
              <ul className="mt-6 space-y-3"><Feature>Auto-capture on ChatGPT, Claude, and Gemini</Feature><Feature>Local full-text search, pins, tags, and filters</Feature><Feature>Individual thread export to Markdown and PDF</Feature><Feature>Portable .oav backup and restore</Feature><Feature>Save prompts and insert them into a chat</Feature></ul>
              <a href="#waitlist" className="mt-8 block rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/50">Join the beta waitlist</a>
            </article>
            <article className="relative rounded-2xl bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] p-px shadow-[0_0_55px_-22px_rgba(99,102,241,0.8)]">
              <div className="h-full rounded-[15px] bg-[#131B2E] p-7 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">Pro Lifetime · Founding</h3><span className="rounded-full border border-purple-500/50 bg-purple-500/15 px-2.5 py-1 text-[9px] font-semibold text-purple-200">FIRST-MONTH OFFER</span></div>
                <p className="mt-2 text-sm text-slate-400">For organizing and moving a growing archive.</p>
                <p className="mt-5 flex flex-wrap items-baseline gap-x-2"><span className="text-4xl font-semibold tracking-tight">$19</span><span className="text-lg text-slate-500 line-through">$39</span><span className="text-sm text-slate-400">one-time, for waitlist signups through Dec 3</span></p>
                <ul className="mt-6 space-y-3"><Feature>Everything in Free</Feature><Feature>Cross-platform folders, nested up to 3 levels</Feature><Feature>Folder-level Markdown export</Feature><Feature>Import supported platform history archives</Feature><Feature>Prompt categories and custom tags</Feature></ul>
                <a href="#waitlist" className="mt-8 block rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">Join the waitlist for the $19 offer <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden /></a>
                <p className="mt-2 text-center text-[10px] text-slate-500">Checkout opens with the beta. Join by Dec 3, 2026 to claim the founding price.</p>
              </div>
            </article>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-5 pb-16 sm:px-6 sm:pb-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Questions, answered</h2>
          <div className="mt-8 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-[#131B2E]">
            {FAQ.map((item) => <details key={item.q} className="group px-5 py-4 sm:px-6 sm:py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-medium text-slate-50 focus:outline-none focus-visible:text-indigo-300 [&::-webkit-details-marker]:hidden">{item.q}<span className="text-slate-500 transition group-open:rotate-180">⌄</span></summary><p className="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p></details>)}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-20 text-center sm:px-6 sm:pb-24">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Keep your AI history yours.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Join the private beta list. We’ll send one note when access opens and include the founding lifetime offer.</p>
          <div className="mt-7"><EmailForm id="waitlist-bottom" /></div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-slate-500 sm:px-6 md:flex-row">
          <p>© {new Date().getFullYear()} OmniArchive. All rights reserved.</p>
          <p className="flex items-center gap-2 text-slate-400"><Lock className="h-3.5 w-3.5 text-indigo-400" aria-hidden />Your chat archive stays on your device.</p>
          <nav className="flex items-center gap-5" aria-label="Footer navigation"><a href="/privacy" className="transition hover:text-slate-200">Privacy</a><a href="mailto:james.carter78041@gmail.com" className="transition hover:text-slate-200">Contact</a>{process.env.NEXT_PUBLIC_X_URL ? <a href={process.env.NEXT_PUBLIC_X_URL} rel="noopener noreferrer" target="_blank" className="transition hover:text-slate-200">X</a> : null}{process.env.NEXT_PUBLIC_GITHUB_URL ? <a href={process.env.NEXT_PUBLIC_GITHUB_URL} rel="noopener noreferrer" target="_blank" className="transition hover:text-slate-200">GitHub</a> : null}</nav>
        </div>
      </footer>
    </div>
  );
}
