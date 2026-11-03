import type { MessageNode, Thread } from "../../db/types";
import { exportThreadToMarkdown } from "../services/exportEngine";
import { exportThreadToPdf } from "../services/pdfExportEngine";

export function ThreadDetail({ thread, messages = [] }: { thread?: Thread; messages?: MessageNode[] }) {
  if (!thread) {
    return <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500">Select a conversation to read it.</div>;
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-white">{thread.title}</h2>
          <p className="mt-1 text-xs capitalize text-slate-500">{thread.platform}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => exportThreadToMarkdown(thread, messages)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Markdown</button>
          <button onClick={() => exportThreadAsPdf(thread, messages)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800">PDF</button>
        </div>
      </div>
      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <div key={message.id}>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-300">{message.role}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{message.content}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
