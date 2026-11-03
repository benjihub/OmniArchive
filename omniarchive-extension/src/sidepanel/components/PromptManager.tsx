import { Plus } from "lucide-react";

export function PromptManager() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Prompt library</h2>
          <p className="mt-1 text-xs text-slate-500">Save reusable prompts locally.</p>
        </div>
        <button className="rounded-lg bg-indigo-500 p-2 text-white hover:bg-indigo-400" aria-label="Add prompt">
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
