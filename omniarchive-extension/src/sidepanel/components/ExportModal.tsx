export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-surface p-5 shadow-2xl">
        <h2 className="font-semibold text-white">Export conversation</h2>
        <p className="mt-2 text-sm text-slate-400">Choose an export format from the conversation toolbar.</p>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400">Close</button>
      </div>
    </div>
  );
}
