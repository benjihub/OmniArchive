import type { ReactNode } from "react";

export function BentoCard({
  icon,
  title,
  children,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#131B2E] p-7 transition hover:border-indigo-500/40 hover:bg-[#131B2E]/70 hover:backdrop-blur-md ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 opacity-0 blur-3xl transition group-hover:opacity-100"
      />
      <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#090D16] text-indigo-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-slate-400">{children}</div>
    </div>
  );
}
