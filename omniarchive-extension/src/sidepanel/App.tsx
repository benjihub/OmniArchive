import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft, Bookmark, Calendar, Check, ChevronDown, Download, FileArchive, Filter, Folder, FolderPlus, Layers, Lock,
  MessageSquare, Pin, Plus, Search, Send, ShieldCheck, Star, Tag, Trash2, Upload,
} from "lucide-react";
import { db } from "../db";
import type { AIPlatform, CaptureStatus, MessageNode, PromptTemplate, RichContentBlock, Thread, VaultFolder } from "../db/types";
import { exportFolderToMarkdown, exportThreadToMarkdown } from "./services/exportEngine";
import { exportThreadToPdf } from "./services/pdfExportEngine";
import { commitImport, exportPortableBackup, parseImportFile, type ParsedImport } from "./services/archiveIO";
import { textToContentBlocks } from "../utils/contentBlocks";

type PlatformFilter = "all" | AIPlatform;
type RoleFilter = "all" | "user" | "assistant";
type AppView = "vault" | "prompts" | "backup";
const cardClass = "rounded-xl border border-slate-800 bg-[#131B2E]/75";
const inputClass = "min-w-0 rounded-lg border border-slate-800 bg-[#090D16] px-2.5 py-2 text-[11px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-purple-500/60";
const actionClass = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-[#131B2E] px-2.5 py-2 text-[10px] font-semibold text-slate-300 transition hover:border-purple-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

function MessageBody({ message }: { message: MessageNode }) {
  const blocks = message.blocks?.length ? message.blocks : textToContentBlocks(message.content);
  return <div className="space-y-2 break-words pt-1 text-[11px] leading-relaxed text-slate-300">
    {blocks.map((block, index) => <MessageBlockView key={`${message.id}-block-${index}`} block={block} />)}
  </div>;
}

function MessageBlockView({ block }: { block: RichContentBlock }) {
  switch (block.type) {
    case "heading": return <h4 className="font-semibold text-slate-100" style={{ fontSize: `${Math.max(11, 15 - block.level)}px` }}>{block.text}</h4>;
    case "code": return <pre className="max-w-full overflow-x-auto rounded-lg border border-slate-700/70 bg-[#090D16] p-2.5 font-mono text-[10px] leading-relaxed text-indigo-100"><code>{block.text}</code></pre>;
    case "math": return <div className="overflow-x-auto rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-2 font-mono text-[10px] text-indigo-200">{block.text}</div>;
    case "blockquote": return <blockquote className="border-l-2 border-purple-500/50 pl-3 text-slate-400">{block.text}</blockquote>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</List>;
    }
    case "table": return <div className="max-w-full overflow-x-auto rounded-lg border border-slate-800"><table className="w-full border-collapse text-left text-[10px]"><thead className="bg-slate-800/70"><tr>{block.headers.map((cell, cellIndex) => <th key={cellIndex} className="border-b border-slate-700 px-2 py-1.5 font-semibold text-slate-200">{cell}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-slate-800 px-2 py-1.5 align-top text-slate-400">{cell}</td>)}</tr>)}</tbody></table></div>;
    case "image": return <div className="rounded-lg border border-slate-800 bg-[#090D16] px-2.5 py-2 text-[10px] text-slate-500">Image: {block.alt}{block.src ? " · external image reference" : ""}</div>;
    default: return <p className="whitespace-pre-wrap">{block.text}</p>;
  }
}

function folderDepth(folderId: string | undefined, folders: VaultFolder[]): number {
  if (!folderId) return 0;
  const folder = folders.find((item) => item.id === folderId);
  return folder ? 1 + folderDepth(folder.parentId, folders) : 0;
}

function folderAndDescendantIds(folderId: string, folders: VaultFolder[]): Set<string> {
  const ids = new Set([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    }
  }
  return ids;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("vault");
  const [showFolders, setShowFolders] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [pinFilter, setPinFilter] = useState<"all" | "pinned" | "unpinned">("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [promptSearch, setPromptSearch] = useState("");
  const [promptCategory, setPromptCategory] = useState("all");
  const [promptFavoritesOnly, setPromptFavoritesOnly] = useState(false);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [promptCategoryInput, setPromptCategoryInput] = useState("");
  const [promptTagsInput, setPromptTagsInput] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState("");
  const [notice, setNotice] = useState("");
  const [importPreview, setImportPreview] = useState<ParsedImport | null>(null);
  const [importError, setImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [licenseTransactionId, setLicenseTransactionId] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  const threads = useLiveQuery<Thread[]>(() => db.threads.orderBy("updatedAt").reverse().toArray(), []) ?? [];
  const allMessages = useLiveQuery<MessageNode[]>(() => db.messages.toArray(), []) ?? [];
  const folders = useLiveQuery<VaultFolder[]>(() => db.folders.orderBy("createdAt").toArray(), []) ?? [];
  const prompts = useLiveQuery<PromptTemplate[]>(() => db.prompts.orderBy("updatedAt").reverse().toArray(), []) ?? [];
  const messagesByThread = useMemo(() => {
    const grouped = new Map<string, MessageNode[]>();
    for (const message of allMessages) {
      const group = grouped.get(message.threadId);
      if (group) group.push(message);
      else grouped.set(message.threadId, [message]);
    }
    return grouped;
  }, [allMessages]);
  const messages = useMemo(
    () => [...(selectedThreadId ? messagesByThread.get(selectedThreadId) ?? [] : [])].sort((a, b) => a.timestamp - b.timestamp || (a.sequence ?? 0) - (b.sequence ?? 0)),
    [messagesByThread, selectedThreadId],
  );
  const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);
  const allTags = useMemo(() => [...new Set(threads.flatMap((thread) => thread.tags))].sort(), [threads]);
  const threadById = useMemo(() => new Map(threads.map((thread) => [thread.id, thread])), [threads]);

  const filteredThreads = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    const matchingFolderIds = folderFilter !== "all" && folderFilter !== ""
      ? folderAndDescendantIds(folderFilter, folders)
      : undefined;
    return threads.filter((thread) => {
      if (platformFilter !== "all" && thread.platform !== platformFilter) return false;
      if (folderFilter === "" && thread.folderId) return false;
      if (matchingFolderIds && (!thread.folderId || !matchingFolderIds.has(thread.folderId))) return false;
      if (tagFilter !== "all" && !thread.tags.includes(tagFilter)) return false;
      if (pinFilter === "pinned" && !thread.isPinned) return false;
      if (pinFilter === "unpinned" && thread.isPinned) return false;
      if (thread.updatedAt < from || thread.updatedAt > to) return false;

      const threadMessages = messagesByThread.get(thread.id) ?? [];
      const roleMessages = roleFilter === "all" ? threadMessages : threadMessages.filter((message) => message.role === roleFilter);
      if (roleFilter !== "all" && roleMessages.length === 0) return false;
      if (!query) return true;

      const searchableThreadText = `${thread.title} ${thread.platform} ${thread.url} ${thread.tags.join(" ")}`.toLocaleLowerCase();
      return searchableThreadText.includes(query) || roleMessages.some((message) => message.content.toLocaleLowerCase().includes(query));
    }).sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || b.updatedAt - a.updatedAt);
  }, [threads, messagesByThread, folders, searchTerm, platformFilter, pinFilter, roleFilter, folderFilter, tagFilter, dateFrom, dateTo]);

  const filteredPrompts = useMemo(() => {
    const query = promptSearch.trim().toLocaleLowerCase();
    return prompts.filter((prompt) => {
      if (promptCategory !== "all" && prompt.category !== promptCategory) return false;
      if (promptFavoritesOnly && !prompt.isFavorite) return false;
      return !query || `${prompt.title} ${prompt.content} ${prompt.category} ${prompt.tags.join(" ")}`.toLocaleLowerCase().includes(query);
    });
  }, [prompts, promptSearch, promptCategory, promptFavoritesOnly]);

  const captureStateLabel = captureStatus
    ? { scanning: "Capture monitor active", waiting: "Waiting for messages", saving: "Saving locally", saved: "Saved locally", error: "Capture needs attention" }[captureStatus.state]
    : "Capture monitor not connected";
  const captureStateColor = captureStatus?.state === "saved" ? "bg-emerald-400" : captureStatus?.state === "error" ? "bg-rose-400" : captureStatus?.state === "waiting" ? "bg-amber-400" : "bg-purple-400";
  const activeFilterCount = [
    platformFilter !== "all", pinFilter !== "all", roleFilter !== "all", folderFilter !== "all",
    tagFilter !== "all", Boolean(dateFrom), Boolean(dateTo),
  ].filter(Boolean).length;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Keep capture health visible and current in the side panel.
  useEffect(() => {
    void chrome.storage.local.get("captureStatus").then(({ captureStatus: savedStatus }) => {
      setCaptureStatus((savedStatus as CaptureStatus | undefined) ?? null);
    }).catch(() => undefined);
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === "local" && changes.captureStatus) setCaptureStatus((changes.captureStatus.newValue as CaptureStatus | undefined) ?? null);
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  });

  useEffect(() => {
    let active = true;
    const verify = async (transactionId: string) => {
      const endpoint = import.meta.env.VITE_LICENSE_API_URL as string | undefined;
      if (!endpoint || !transactionId) return false;
      try {
        const origin = new URL(endpoint).origin;
        const hasPermission = await chrome.permissions.contains({ origins: [`${origin}/*`] });
        if (!hasPermission) return false;
        const response = await fetch(endpoint, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId }),
        });
        return response.ok && Boolean((await response.json()).valid);
      } catch { return false; }
    };
    void chrome.storage.local.get("paddleTransactionId").then(async ({ paddleTransactionId }) => {
      const transactionId = typeof paddleTransactionId === "string" ? paddleTransactionId : "";
      const valid = await verify(transactionId);
      if (!active) return;
      setIsPro(valid);
      if (!valid && transactionId) void chrome.storage.local.remove("paddleTransactionId");
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleDeleteThread = async (id: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!confirm("Delete this archived thread and its messages?")) return;
    await db.transaction("rw", db.threads, db.messages, async () => {
      await db.threads.delete(id);
      await db.messages.where("threadId").equals(id).delete();
    });
    if (selectedThreadId === id) setSelectedThreadId(null);
  };

  const patchThread = async (thread: Thread, patch: Partial<Thread>) => {
    await db.threads.put({ ...thread, ...patch, updatedAt: Date.now() });
  };

  const addThreadTag = async (thread: Thread) => {
    const entered = prompt("Add a tag (for example Research, Code, Client, or Writing):")?.trim();
    if (!entered) return;
    const tag = entered.replace(/^#/, "");
    await patchThread(thread, { tags: [...new Set([...thread.tags, tag])] });
  };

  const createFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    const parentId = newFolderParent || undefined;
    if (parentId && !isPro) {
      setShowUpgrade(true);
      return;
    }
    if (parentId && folderDepth(parentId, folders) >= 3) {
      setNotice("Folders can be nested up to three levels.");
      return;
    }
    const now = Date.now();
    const folder: VaultFolder = {
      id: crypto.randomUUID(), name, parentId, color: "#8B5CF6", createdAt: now, updatedAt: now,
    };
    await db.folders.add(folder);
    setNewFolderName("");
    setNewFolderParent("");
    setNotice(`Created “${name}”.`);
  };

  const deleteFolder = async (folder: VaultFolder) => {
    if (!confirm(`Delete the “${folder.name}” folder? Threads will move to its parent or the main vault.`)) return;
    const childFolders = folders.filter((item) => item.parentId === folder.id);
    await db.transaction("rw", db.folders, db.threads, async () => {
      await Promise.all(childFolders.map((child) => db.folders.put({ ...child, parentId: folder.parentId, updatedAt: Date.now() })));
      const assigned = await db.threads.where("folderId").equals(folder.id).toArray();
      await Promise.all(assigned.map((thread) => db.threads.put({ ...thread, folderId: folder.parentId, updatedAt: Date.now() })));
      await db.folders.delete(folder.id);
    });
    if (folderFilter === folder.id) setFolderFilter("all");
  };

  const addPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!promptTitle.trim() || !promptContent.trim()) return;
    const promptTemplate: PromptTemplate = {
      id: crypto.randomUUID(), title: promptTitle.trim(), content: promptContent.trim(),
      category: isPro ? promptCategoryInput.trim() || "General" : "General",
      tags: isPro ? [...new Set(promptTagsInput.split(",").map((tag) => tag.trim()).filter(Boolean))] : [],
      usageCount: 0, updatedAt: Date.now(), isFavorite: false,
    };
    await db.prompts.add(promptTemplate);
    setPromptTitle("");
    setPromptContent("");
    setPromptCategoryInput("");
    setPromptTagsInput("");
    setNotice("Prompt saved to your local library.");
  };

  const insertPrompt = async (promptTemplate: PromptTemplate) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id === undefined) throw new Error("No active AI chat tab was found.");
      const response = await chrome.tabs.sendMessage(tab.id, { type: "prompt:insert", content: promptTemplate.content });
      if (!response?.ok) throw new Error(response?.error ?? "The prompt could not be inserted into this page.");
      await db.prompts.put({ ...promptTemplate, usageCount: promptTemplate.usageCount + 1, updatedAt: Date.now() });
      setNotice("Prompt added to the chat box. Review it, then send when ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not insert this prompt.");
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportError("");
    setImportPreview(null);
    setIsImporting(true);
    try {
      setImportPreview(await parseImportFile(file));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not read this archive.");
    } finally {
      setIsImporting(false);
    }
  };

  const applyImport = async () => {
    if (!importPreview) return;
    if (!importPreview.isBackup && !isPro) {
      setShowUpgrade(true);
      return;
    }
    setIsImporting(true);
    try {
      const counts = await commitImport(importPreview);
      setNotice(`Imported ${counts.addedThreads} new conversations and ${counts.addedMessages} new messages. Existing items were merged safely.`);
      setImportPreview(null);
      setActiveView("vault");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed. Your current archive was left unchanged.");
    } finally {
      setIsImporting(false);
    }
  };

  const exportFolder = async (folder: VaultFolder) => {
    if (!isPro) { setShowUpgrade(true); return; }
    const ids = folderAndDescendantIds(folder.id, folders);
    const assignedThreads = threads.filter((thread) => thread.folderId && ids.has(thread.folderId));
    await exportFolderToMarkdown(folder, assignedThreads);
  };

  const activatePro = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const endpoint = import.meta.env.VITE_LICENSE_API_URL as string | undefined;
    const transactionId = licenseTransactionId.trim();
    if (!endpoint) { setLicenseError("License verification is not configured yet."); return; }
    if (!/^txn_[a-z0-9]{26}$/i.test(transactionId)) { setLicenseError("Enter the Paddle transaction ID from your receipt (starts with txn_)."); return; }
    setIsActivating(true);
    setLicenseError("");
    try {
      const origin = new URL(endpoint).origin;
      const granted = await chrome.permissions.contains({ origins: [`${origin}/*`] })
        || await chrome.permissions.request({ origins: [`${origin}/*`] });
      if (!granted) throw new Error("Allow OmniArchive to contact the license verification service to activate Pro.");
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.valid) throw new Error(result.error || "This transaction could not be verified as an OmniArchive Pro purchase.");
      await chrome.storage.local.set({ paddleTransactionId: transactionId });
      setIsPro(true);
      setLicenseTransactionId("");
      setShowUpgrade(false);
      setNotice("OmniArchive Pro is active on this browser.");
    } catch (error) {
      setLicenseError(error instanceof Error ? error.message : "Could not verify this purchase.");
    } finally { setIsActivating(false); }
  };

  const openPaddleCheckout = async () => {
    const checkoutUrl = import.meta.env.VITE_PADDLE_CHECKOUT_URL as string | undefined;
    if (!checkoutUrl) { setLicenseError("Checkout is not configured yet."); return; }
    await chrome.tabs.create({ url: checkoutUrl });
  };

  const folderRows = (parentId?: string, depth = 0): ReactNode[] => folders
    .filter((folder) => folder.parentId === parentId)
    .map((folder) => {
      const subtreeIds = folderAndDescendantIds(folder.id, folders);
      const count = threads.filter((thread) => thread.folderId && subtreeIds.has(thread.folderId)).length;
      const canNest = depth < 2;
      return (
        <div key={folder.id} className="space-y-1">
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-white/[0.04] ${folderFilter === folder.id ? "bg-purple-500/10" : ""}`} style={{ marginLeft: depth * 12 }}>
            <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => { setFolderFilter(folderFilter === folder.id ? "all" : folder.id); setSelectedThreadId(null); }}>
              <Folder className="h-3.5 w-3.5 shrink-0 text-purple-300" />
              <span className="truncate text-[11px] text-slate-300">{folder.name}</span>
              <span className="ml-auto text-[9px] text-slate-600">{count}</span>
            </button>
            <button className="rounded px-1 text-[9px] text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-30" title="Export folder (Pro)" onClick={() => void exportFolder(folder)} disabled={count === 0}>MD{!isPro && " · Pro"}</button>
            {canNest && <button className="rounded p-1 text-slate-500 hover:text-white" title="Create a subfolder" onClick={() => { if (!isPro) { setShowUpgrade(true); return; } setNewFolderParent(folder.id); document.getElementById("new-folder-name")?.focus(); }}><FolderPlus className="h-3 w-3" /></button>}
            <button className="rounded p-1 text-slate-600 hover:text-rose-400" title="Delete folder" onClick={() => void deleteFolder(folder)}><Trash2 className="h-3 w-3" /></button>
          </div>
          {folderRows(folder.id, depth + 1)}
        </div>
      );
    });

  const selectClass = `${inputClass} w-full`;
  const currentThread = selectedThreadId ? threadById.get(selectedThreadId) : undefined;

  return (
    <div className="flex h-screen min-h-[520px] w-full flex-col bg-[#090D16] p-3 font-sans text-[#F8FAFC]">
      <header className="mb-3 flex shrink-0 items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-500/20"><Lock className="h-4 w-4 text-white" /></div>
        <div><p className="text-sm font-bold tracking-tight">OmniArchive</p><p className="text-[9px] text-slate-500">Your private AI memory</p></div>
        </div>
        <div className="flex items-center gap-1.5">
        <button onClick={() => setShowUpgrade(true)} className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${isPro ? "border-purple-500/30 bg-purple-500/10 text-purple-200" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}>{isPro ? "Pro active" : "Free plan · Pro $19"}</button>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1" title="Conversation data is saved in this browser's local IndexedDB database">
          <ShieldCheck className="h-3 w-3 text-emerald-400" /><span className="text-[9px] font-semibold text-emerald-300">Local only</span>
        </div>
        </div>
      </header>

      <section className={`${cardClass} mb-2 shrink-0 px-3 py-1.5`} title={captureStatus?.detail ?? "Open and refresh an AI conversation to connect capture."}>
        <div className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${captureStateColor}`} aria-hidden /><p className="truncate text-[10px] font-semibold text-slate-300">{captureStateLabel}{captureStatus ? ` · ${captureStatus.platform} · ${captureStatus.messageCount ?? 0} msgs` : ""}</p></div>
      </section>

      <nav className="mb-2 grid shrink-0 grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-[#0D1423] p-1">
        <button className={`rounded-lg px-1.5 py-2 text-[10px] font-semibold transition ${activeView === "vault" ? "bg-purple-500/15 text-purple-200" : "text-slate-500 hover:text-slate-200"}`} onClick={() => { setActiveView("vault"); setSelectedThreadId(null); }}><Layers className="mr-1 inline h-3.5 w-3.5" />Vault <span className="ml-0.5 text-[9px] opacity-60">{threads.length}</span></button>
        <button className={`rounded-lg px-1.5 py-2 text-[10px] font-semibold transition ${activeView === "prompts" ? "bg-purple-500/15 text-purple-200" : "text-slate-500 hover:text-slate-200"}`} onClick={() => { setActiveView("prompts"); setSelectedThreadId(null); }}><Bookmark className="mr-1 inline h-3.5 w-3.5" />Prompts <span className="ml-0.5 text-[9px] opacity-60">{prompts.length}</span></button>
        <button className={`rounded-lg px-1.5 py-2 text-[10px] font-semibold transition ${activeView === "backup" ? "bg-purple-500/15 text-purple-200" : "text-slate-500 hover:text-slate-200"}`} onClick={() => { setActiveView("backup"); setSelectedThreadId(null); }}><FileArchive className="mr-1 inline h-3.5 w-3.5" />Backup</button>
      </nav>

      {activeView === "vault" && selectedThreadId && currentThread ? (
        <section className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <button onClick={() => setSelectedThreadId(null)} className={actionClass}><ArrowLeft className="h-3 w-3" />Vault</button>
            <span className="max-w-[35%] truncate text-[10px] font-medium text-slate-300">{currentThread.title}</span>
            <div className="flex items-center gap-1"><button className={actionClass} onClick={() => exportThreadToMarkdown(currentThread, messages)}><Download className="h-3 w-3" />MD</button><button className={actionClass} onClick={() => exportThreadToPdf(currentThread, messages)}>PDF</button></div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-purple-500/10 px-2 py-1 text-[9px] capitalize text-purple-300">{currentThread.platform}</span>
            <button className={`${actionClass} ${currentThread.isPinned ? "border-amber-500/30 text-amber-300" : ""}`} onClick={() => void patchThread(currentThread, { isPinned: !currentThread.isPinned })}><Pin className="h-3 w-3" />{currentThread.isPinned ? "Pinned" : "Pin"}</button>
            <select aria-label="Move to folder" className={`${inputClass} max-w-[145px] py-1.5`} value={currentThread.folderId ?? ""} onChange={(event) => void patchThread(currentThread, { folderId: event.target.value || undefined })}><option value="">No folder</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{"· ".repeat(Math.max(0, folderDepth(folder.id, folders) - 1))}{folder.name}</option>)}</select>
            <button className={actionClass} onClick={() => void addThreadTag(currentThread)}><Tag className="h-3 w-3" />Add tag</button>
            <span className="text-[9px] text-slate-500">{messages.length} messages</span>
          </div>
          {currentThread.tags.length > 0 && <div className="flex shrink-0 flex-wrap gap-1">{currentThread.tags.map((tag) => <button key={tag} className="rounded-full border border-slate-800 bg-[#131B2E] px-2 py-0.5 text-[9px] text-slate-400 hover:border-rose-500/40 hover:text-rose-300" title="Click to remove tag" onClick={() => void patchThread(currentThread, { tags: currentThread.tags.filter((item) => item !== tag) })}>#{tag} ×</button>)}</div>}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => <article key={message.id} className={`flex flex-col gap-1.5 rounded-2xl border p-3.5 text-xs leading-relaxed shadow-sm ${message.role === "user" ? "ml-4 border-slate-800 bg-[#131B2E]" : "mr-4 border-purple-500/20 bg-[#0E1526]"}`}>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 text-[10px] font-medium"><span className={`rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wider ${message.role === "user" ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-400" : "border-purple-500/20 bg-purple-500/10 text-purple-400"}`}>{message.role === "user" ? "You" : "AI Assistant"}</span><span className="text-slate-500">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
              <MessageBody message={message} />
            </article>)}
            {messages.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No messages were saved for this thread.</p>}
          </div>
        </section>
      ) : activeView === "vault" ? (
        <main className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex shrink-0 gap-1.5">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input aria-label="Search all conversations and messages" className={`${inputClass} w-full py-2.5 pl-9 pr-3`} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search chats and messages…" /></div>
            <button className={`${actionClass} ${showFilters ? "border-purple-500/40 text-purple-200" : ""}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><Filter className="h-3.5 w-3.5" />Filters{activeFilterCount > 0 && <span className="rounded-full bg-purple-500/20 px-1.5 text-[9px] text-purple-200">{activeFilterCount}</span>}</button>
          </div>

          <section className={`${cardClass} shrink-0 px-2.5 py-1.5`}>
            <div className="flex items-center justify-between gap-2">
              <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setShowFolders(!showFolders)} aria-expanded={showFolders}>
                <Folder className="h-3.5 w-3.5 shrink-0 text-purple-300" /><span className="truncate text-[10px] font-semibold text-slate-300">Projects & folders</span><span className="text-[9px] text-slate-600">{folders.length}</span>{folderFilter !== "all" && <span className="truncate rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] text-purple-300">{folderFilter ? folderById.get(folderFilter)?.name : "Unfiled"}</span>}<ChevronDown className={`ml-auto h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${showFolders ? "rotate-180" : ""}`} />
              </button>
              <button className="rounded-md px-2 py-1 text-[9px] font-semibold text-purple-300 hover:bg-purple-500/10" onClick={() => { setShowFolders(true); window.setTimeout(() => document.getElementById("new-folder-name")?.focus(), 0); }}><Plus className="mr-1 inline h-3 w-3" />New</button>
            </div>
            {showFolders && <div className="mt-2 border-t border-slate-800 pt-2">
              <div className="mb-2 max-h-32 space-y-0.5 overflow-y-auto">{folders.length ? folderRows() : <p className="px-1 py-1 text-[10px] text-slate-600">Group chats from different AI platforms into a project.</p>}</div>
              <form className="grid grid-cols-[1fr_0.9fr_auto] gap-1.5" onSubmit={(event) => void createFolder(event)}>
                <input id="new-folder-name" className={`${inputClass} py-1.5`} value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Folder name" />
                <select className={`${inputClass} py-1.5`} value={newFolderParent} onChange={(event) => { if (event.target.value && !isPro) { setShowUpgrade(true); return; } setNewFolderParent(event.target.value); }}><option value="">Top level</option>{isPro && folders.filter((folder) => folderDepth(folder.id, folders) < 3).map((folder) => <option key={folder.id} value={folder.id}>{"· ".repeat(Math.max(0, folderDepth(folder.id, folders) - 1))}{folder.name}</option>)}</select>
                <button className={`${actionClass} px-2`} title="Create folder"><Plus className="h-3 w-3" /></button>
              </form>
            </div>}
          </section>

          {showFilters && <section className={`${cardClass} grid shrink-0 grid-cols-2 gap-1.5 p-2`}>
            <select aria-label="Filter platform" className={selectClass} value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value as PlatformFilter)}><option value="all">All platforms</option><option value="chatgpt">ChatGPT</option><option value="claude">Claude</option><option value="gemini">Gemini</option></select>
            <select aria-label="Filter folder" className={selectClass} value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}><option value="all">All folders</option><option value="">Unfiled</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
            <select aria-label="Filter tag" className={selectClass} value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option value="all">All tags</option>{allTags.map((tag) => <option key={tag} value={tag}>#{tag}</option>)}</select>
            <select aria-label="Filter pinned conversations" className={selectClass} value={pinFilter} onChange={(event) => setPinFilter(event.target.value as typeof pinFilter)}><option value="all">Pinned + unpinned</option><option value="pinned">Pinned only</option><option value="unpinned">Unpinned only</option></select>
            <select aria-label="Filter speaker" className={selectClass} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}><option value="all">Any speaker</option><option value="user">My messages</option><option value="assistant">AI messages</option></select>
            <input aria-label="Updated from date" type="date" className={inputClass} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} title="Updated from" />
            <input aria-label="Updated through date" type="date" className={inputClass} value={dateTo} onChange={(event) => setDateTo(event.target.value)} title="Updated through" />
          </section>}

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-0.5"><span className="text-[10px] text-slate-500">{filteredThreads.length} conversations</span><button className="text-[9px] text-slate-500 hover:text-purple-300" onClick={() => { setSearchTerm(""); setPlatformFilter("all"); setPinFilter("all"); setRoleFilter("all"); setFolderFilter("all"); setTagFilter("all"); setDateFrom(""); setDateTo(""); }}>Clear filters</button></div>
            {filteredThreads.length === 0 ? <div className={`${cardClass} flex flex-1 flex-col items-center justify-center p-8 text-center`}><Layers className="mb-3 h-9 w-9 text-purple-400/50" /><p className="text-xs font-semibold text-slate-200">{threads.length ? "No matching conversations" : "Your vault is ready"}</p><p className="mt-1 max-w-[230px] text-[10px] leading-relaxed text-slate-500">{threads.length ? "Try a broader search or clear one of the filters." : "Open a ChatGPT, Claude, or Gemini conversation to archive it here."}</p></div> : filteredThreads.map((thread) => <article key={thread.id} onClick={() => setSelectedThreadId(thread.id)} className={`${cardClass} group cursor-pointer p-3 transition hover:border-purple-500/40 hover:bg-[#131B2E]`}>
              <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-[11px] font-semibold text-slate-100 group-hover:text-purple-200">{thread.title}</h3><p className="mt-1 line-clamp-1 text-[9px] text-slate-600">{folderById.get(thread.folderId ?? "")?.name ?? "Unfiled"}</p></div>
                <button className={`rounded p-1 transition ${thread.isPinned ? "text-amber-300" : "text-slate-600 hover:text-amber-300"}`} title={thread.isPinned ? "Unpin thread" : "Pin thread"} onClick={(event) => { event.stopPropagation(); void patchThread(thread, { isPinned: !thread.isPinned }); }}><Pin className="h-3.5 w-3.5" /></button>
                <button className="rounded p-1 text-slate-600 transition hover:text-indigo-300" title="Add a tag" onClick={(event) => { event.stopPropagation(); void addThreadTag(thread); }}><Tag className="h-3.5 w-3.5" /></button>
                <button className="rounded p-1 text-slate-700 transition hover:text-rose-400" title="Delete thread" onClick={(event) => void handleDeleteThread(thread.id, event)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 capitalize text-purple-300">{thread.platform}</span><span className="inline-flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{thread.messageCount}</span><span className="ml-auto inline-flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{new Date(thread.updatedAt).toLocaleDateString()}</span></div>
              {thread.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{thread.tags.map((tag) => <button key={tag} className="rounded-full border border-slate-800 px-1.5 py-0.5 text-[8px] text-slate-500 hover:border-purple-500/30 hover:text-purple-300" onClick={(event) => { event.stopPropagation(); setTagFilter(tag); }}>{tag}</button>)}</div>}
            </article>)}
          </div>
        </main>
      ) : activeView === "prompts" ? (
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          <div className="flex shrink-0 gap-1.5"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input aria-label="Search prompts" className={`${inputClass} w-full py-2.5 pl-9`} value={promptSearch} onChange={(event) => setPromptSearch(event.target.value)} placeholder="Search prompts…" /></div><button className={actionClass} onClick={() => setShowPromptForm(!showPromptForm)} aria-expanded={showPromptForm}><Plus className="h-3.5 w-3.5" />New</button></div>
          {showPromptForm && <form onSubmit={(event) => void addPrompt(event)} className={`${cardClass} shrink-0 space-y-2 p-3`}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200"><Plus className="h-3.5 w-3.5 text-purple-300" />Save a reusable prompt</p>
            <input required className={`${inputClass} w-full`} value={promptTitle} onChange={(event) => setPromptTitle(event.target.value)} placeholder="Prompt name" />
            <textarea required rows={4} className={`${inputClass} w-full resize-y`} value={promptContent} onChange={(event) => setPromptContent(event.target.value)} placeholder="Write the prompt. Variables such as {{topic}} are fine." />
            {isPro ? <div className="grid grid-cols-2 gap-1.5"><input className={inputClass} value={promptCategoryInput} onChange={(event) => setPromptCategoryInput(event.target.value)} placeholder="Category (e.g. Research)" /><input className={inputClass} value={promptTagsInput} onChange={(event) => setPromptTagsInput(event.target.value)} placeholder="Tags, comma separated" /></div> : <button type="button" className="w-full rounded-lg border border-purple-500/20 px-2 py-1.5 text-left text-[9px] text-purple-200" onClick={() => setShowUpgrade(true)}>Unlock prompt categories and tags with Pro</button>}
            <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 px-3 py-2 text-[10px] font-semibold text-white transition hover:brightness-110"><Bookmark className="h-3 w-3" />Save prompt locally</button>
          </form>}
          <div className="grid grid-cols-[1fr_0.9fr] gap-1.5"><select className={selectClass} value={promptCategory} onChange={(event) => setPromptCategory(event.target.value)} disabled={!isPro}><option value="all">{isPro ? "All categories" : "General category · Pro filters"}</option>{isPro && [...new Set(prompts.map((prompt) => prompt.category))].map((category) => <option key={category} value={category}>{category}</option>)}</select><button className={`${actionClass} ${promptFavoritesOnly ? "border-amber-500/30 text-amber-300" : ""}`} onClick={() => setPromptFavoritesOnly(!promptFavoritesOnly)}><Star className={`h-3 w-3 ${promptFavoritesOnly ? "fill-current" : ""}`} />{promptFavoritesOnly ? "Favorites" : "All prompts"}</button></div>
          {filteredPrompts.length === 0 ? <div className={`${cardClass} flex flex-1 flex-col items-center justify-center p-7 text-center`}><Bookmark className="mb-2 h-8 w-8 text-purple-400/50" /><p className="text-xs text-slate-400">No prompts match yet.</p></div> : filteredPrompts.map((promptTemplate) => <article key={promptTemplate.id} className={`${cardClass} shrink-0 p-3`}>
            <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><h3 className="text-[11px] font-semibold text-slate-100">{promptTemplate.title}</h3><p className="mt-0.5 text-[9px] text-purple-300">{promptTemplate.category} · used {promptTemplate.usageCount} times</p></div>
              <button className={`rounded p-1 ${promptTemplate.isFavorite ? "text-amber-300" : "text-slate-600 hover:text-amber-300"}`} title={promptTemplate.isFavorite ? "Remove favorite" : "Add favorite"} onClick={() => void db.prompts.put({ ...promptTemplate, isFavorite: !promptTemplate.isFavorite, updatedAt: Date.now() })}><Star className={`h-3.5 w-3.5 ${promptTemplate.isFavorite ? "fill-current" : ""}`} /></button>
              <button className="rounded p-1 text-slate-600 hover:text-rose-400" title="Delete prompt" onClick={() => void db.prompts.delete(promptTemplate.id)}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-[10px] leading-relaxed text-slate-400">{promptTemplate.content}</p>
            {promptTemplate.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{promptTemplate.tags.map((tag) => <button key={tag} className="rounded-full border border-slate-800 px-1.5 py-0.5 text-[8px] text-slate-500" onClick={() => setPromptSearch(tag)}>#{tag}</button>)}</div>}
            <button className={`${actionClass} mt-3 w-full border-purple-500/20 text-purple-200 hover:bg-purple-500/10`} onClick={() => void insertPrompt(promptTemplate)}><Send className="h-3 w-3" />Insert into active AI chat</button>
          </article>)}
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          <div><h2 className="text-sm font-semibold text-slate-100">Take your archive with you</h2><p className="mt-1 text-[10px] leading-relaxed text-slate-500">Create a complete local backup, restore it later, or import a platform data export. Files are processed in this browser.</p></div>
          <section className={`${cardClass} space-y-2.5 p-3`}>
            <div className="flex items-start gap-2"><div className="rounded-lg bg-indigo-500/10 p-2"><Download className="h-4 w-4 text-indigo-300" /></div><div><h3 className="text-[11px] font-semibold text-slate-200">OmniArchive backup</h3><p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">Includes conversations, rich message blocks, prompts, folders, tags, and pins in a versioned .oav file.</p></div></div>
            <button className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 px-3 py-2.5 text-[10px] font-semibold text-white transition hover:brightness-110" onClick={() => void exportPortableBackup()}>Download full backup</button>
          </section>

          <section className={`${cardClass} space-y-2.5 p-3`}>
            <div className="flex items-start gap-2"><div className="rounded-lg bg-emerald-500/10 p-2"><Upload className="h-4 w-4 text-emerald-300" /></div><div><h3 className="text-[11px] font-semibold text-slate-200">Import history or restore backup</h3><p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">Choose a ChatGPT, Claude, or Gemini Takeout export (.zip, .json, .html), or an OmniArchive .oav backup.</p></div></div>
            <input ref={importInputRef} className="hidden" type="file" accept=".oav,.zip,.json,.html,.htm" onChange={(event) => void handleImportFile(event)} />
            <button className={actionClass + " w-full justify-center py-2.5"} onClick={() => importInputRef.current?.click()} disabled={isImporting}><Upload className="h-3.5 w-3.5" />{isImporting ? "Reading file…" : "Choose an export file"}</button>
            {importError && <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-[10px] leading-relaxed text-rose-300">{importError}</p>}
            {importPreview && <div className="space-y-2 rounded-lg border border-purple-500/25 bg-purple-500/5 p-2.5">
              <div><p className="text-[10px] font-semibold text-purple-200">Ready to import · {importPreview.source}</p><p className="mt-0.5 break-all text-[9px] text-slate-500">{importPreview.fileName}</p></div>
              <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-400"><span>{importPreview.threads.length} conversations</span><span>{importPreview.messages.length} messages</span><span>{importPreview.folders.length} folders</span><span>{importPreview.prompts.length} prompts</span></div>
              {importPreview.warnings.map((warning) => <p key={warning} className="rounded bg-amber-500/5 p-2 text-[9px] leading-relaxed text-amber-200/80">{warning}</p>)}
              <p className="text-[9px] leading-relaxed text-slate-500">Import merges matching IDs and messages, preserving your existing folders, pins, and tags. It does not delete anything.</p>
              <div className="flex gap-1.5"><button className={actionClass + " flex-1 justify-center"} onClick={() => setImportPreview(null)}>Cancel</button><button className="flex-1 rounded-lg bg-purple-600 px-2 py-2 text-[10px] font-semibold text-white hover:bg-purple-500 disabled:opacity-50" onClick={() => void applyImport()} disabled={isImporting}>{isImporting ? "Importing…" : importPreview.isBackup || isPro ? "Import locally" : "Unlock full-history import · Pro"}</button></div>
            </div>}
          </section>
          <p className="flex items-start gap-2 rounded-lg border border-slate-800 bg-[#0D1423] p-2.5 text-[9px] leading-relaxed text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />The selected file is read and processed locally. OmniArchive does not upload your archive.</p>
        </main>
      )}

      {showUpgrade && <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="pro-title">
        <section className="w-full max-w-sm space-y-3 rounded-2xl border border-purple-500/40 bg-[#11192A] p-4 shadow-2xl shadow-purple-950/40">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-purple-300">OmniArchive Pro · Lifetime</p><h2 id="pro-title" className="mt-1 text-sm font-bold text-white">Unlock the full archive workflow</h2></div><button aria-label="Close" className="text-lg leading-none text-slate-500 hover:text-white" onClick={() => { setShowUpgrade(false); setLicenseError(""); }}>×</button></div>
          <p className="text-[10px] leading-relaxed text-slate-400">Nested folders, folder exports, full-history imports, and advanced prompt organization. Pay once: <strong className="text-white">$19 lifetime</strong>.</p>
          <button className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 px-3 py-2.5 text-[10px] font-semibold text-white hover:brightness-110" onClick={() => void openPaddleCheckout()}>Get Pro with Paddle</button>
          <form className="space-y-2 border-t border-slate-800 pt-3" onSubmit={(event) => void activatePro(event)}>
            <label htmlFor="paddle-transaction" className="block text-[10px] font-semibold text-slate-300">Already purchased? Activate Pro</label>
            <input id="paddle-transaction" className={`${inputClass} w-full`} value={licenseTransactionId} onChange={(event) => setLicenseTransactionId(event.target.value)} placeholder="Paddle transaction ID (txn_…)" autoComplete="off" />
            {licenseError && <p role="alert" className="text-[9px] leading-relaxed text-rose-300">{licenseError}</p>}
            <button className={`${actionClass} w-full`} disabled={isActivating}>{isActivating ? "Verifying purchase…" : "Verify and activate"}</button>
          </form>
          <p className="text-[8px] leading-relaxed text-slate-600">Only the transaction ID is sent to the configured license endpoint. Your archived chats and prompts stay on this device.</p>
        </section>
      </div>}
      {notice && <div role="status" className="fixed bottom-12 left-3 right-3 z-10 flex items-start gap-2 rounded-xl border border-purple-500/30 bg-[#131B2E] p-2.5 text-[10px] text-slate-200 shadow-xl"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />{notice}</div>}
      <footer className="mt-3 flex shrink-0 items-center justify-between border-t border-slate-800 pt-2 text-[9px] text-slate-600"><span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />Chats and prompts stay in this browser</span><span>{threads.length} threads · {folders.length} folders</span></footer>
    </div>
  );
}
