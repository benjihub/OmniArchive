import { Lock, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
          <Lock className="h-3.5 w-3.5" aria-hidden />
        </span>
        OmniArchive
      </div>
      <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-label="Settings">
        <Settings className="h-4 w-4" aria-hidden />
      </button>
    </header>
  );
}
