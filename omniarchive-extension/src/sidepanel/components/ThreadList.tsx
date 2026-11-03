import { MessageSquare } from "lucide-react";
import type { Thread } from "../../db/types";

export function ThreadList({ threads, selectedId, onSelect }: { threads: Thread[]; selectedId?: string; onSelect: (thread: Thread) => void }) {
  if (!threads.length) {
    return <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">Saved conversations will appear here.</div>;
  }

  return (
    <div className="space-y-1">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelect(thread)}
          className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${selectedId === thread.id ? "bg-indigo-500/15 text-white" : "text-slate-300 hover:bg-slate-800/70"}`}
        >
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{thread.title}</span>
            <span className="mt-1 block text-xs capitalize text-slate-500">{thread.platform}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
