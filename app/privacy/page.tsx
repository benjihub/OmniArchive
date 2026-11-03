import Link from "next/link";
import { Lock } from "lucide-react";
import { ThemeToggle } from "@/components/marketing/ThemeToggle";

export const metadata = {
  title: "Privacy | OmniArchive",
  description: "How OmniArchive handles extension data, waitlist emails, and Pro license checks.",
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page min-h-screen bg-[#090D16] px-5 py-12 text-slate-50 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white"><Lock className="h-4 w-4 text-indigo-400" />OmniArchive</Link><ThemeToggle /></div>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Privacy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your chats stay on your device.</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">This page describes the current OmniArchive website and Chrome extension. Last updated November 3, 2026.</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section><h2 className="text-lg font-semibold text-white">Conversation data</h2><p className="mt-2">The extension reads conversation content on supported ChatGPT, Claude, and Gemini pages so it can capture and display your chats. Captured conversations, prompts, folders, tags, and the search data are stored in the extension’s local browser database on your device. The website does not receive your archived chat content.</p><p className="mt-2">The extension needs access to the supported AI chat sites to capture conversations. You can remove captured data from the extension or export an .oav backup. Browser extension data may be removed when you uninstall the extension or clear its storage, so keep a backup if you need one.</p></section>

          <section><h2 className="text-lg font-semibold text-white">Waitlist email</h2><p className="mt-2">If you submit the waitlist form, the email address you provide is sent to Resend and stored in the OmniArchive waitlist audience. It is used to contact you about beta access and the founding offer. Your email is not taken from your extension or AI accounts. Contact <a className="text-indigo-300 underline underline-offset-4" href="mailto:james.carter78041@gmail.com">james.carter78041@gmail.com</a> to request an update or removal.</p></section>

          <section><h2 className="text-lg font-semibold text-white">Pro purchase verification</h2><p className="mt-2">When you activate Pro, the extension sends the Paddle transaction ID you enter to OmniArchive’s license verification endpoint. The server checks the transaction with Paddle. Your chats, prompts, and backup files are not included in this request.</p></section>

          <section><h2 className="text-lg font-semibold text-white">Website services</h2><p className="mt-2">The landing page loads its decorative particle background from jsDelivr. Submitting the waitlist form contacts OmniArchive’s API and Resend. We do not currently include an analytics or advertising tracker in the site code.</p></section>

          <section><h2 className="text-lg font-semibold text-white">Changes and contact</h2><p className="mt-2">We may update this notice as the product and its services change. For privacy questions, email <a className="text-indigo-300 underline underline-offset-4" href="mailto:james.carter78041@gmail.com">james.carter78041@gmail.com</a>.</p></section>
        </div>

        <Link href="/" className="mt-10 inline-block text-sm text-indigo-300 hover:text-indigo-200">← Back to OmniArchive</Link>
      </article>
    </main>
  );
}
