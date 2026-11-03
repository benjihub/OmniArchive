"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

const ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "/api/subscribe";

type Status = "idle" | "loading" | "success" | "error";

export function EmailForm({ id }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Could not save your email. Check the address and try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        id={id}
        role="status"
        className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3.5 text-sm text-slate-50"
      >
        <Check className="h-4 w-4 text-indigo-400" aria-hidden />
        You are on the list. We will email when the beta opens and share the founding offer.
      </div>
    );
  }

  return (
    <form id={id} onSubmit={onSubmit} className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-[#131B2E]/80 p-1.5 backdrop-blur sm:flex-row">
        <label htmlFor={`${id ?? "email"}-input`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id ?? "email"}-input`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(99,102,241,0.7)] transition hover:shadow-[0_0_32px_-2px_rgba(139,92,246,0.9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:opacity-70"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>
              Join the waitlist
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </button>
      </div>
      <p className="mt-3 min-h-5 text-center text-xs text-slate-500" aria-live="polite">
        {status === "error" ? <span className="text-rose-400">{message}</span> : "No spam. One email when it launches."}
      </p>
    </form>
  );
}
