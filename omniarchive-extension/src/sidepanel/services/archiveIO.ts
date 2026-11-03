import JSZip from "jszip";
import { db } from "../../db";
import type { AIPlatform, MessageNode, PromptTemplate, RichContentBlock, Thread, VaultFolder } from "../../db/types";
import { richBlocksFromElement } from "../../content/extractors/baseExtractor";
import { textToContentBlocks } from "../../utils/contentBlocks";

const ARCHIVE_FORMAT = "omniarchive-local-archive";
const ARCHIVE_VERSION = 1;
const MAX_IMPORT_BYTES = 300 * 1024 * 1024;

export interface ParsedImport {
  fileName: string;
  source: string;
  isBackup: boolean;
  threads: Thread[];
  messages: MessageNode[];
  folders: VaultFolder[];
  prompts: PromptTemplate[];
  warnings: string[];
}

interface PortableManifest {
  format: typeof ARCHIVE_FORMAT;
  version: number;
  createdAt: string;
  counts: { threads: number; messages: number; folders: number; prompts: number };
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function toTimestamp(value: unknown, fallback = Date.now()): number {
  if (typeof value === "number" && Number.isFinite(value)) return value < 10_000_000_000 ? value * 1000 : value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }
  return fallback;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of ["text", "content", "value", "html"]) {
    if (record[key] !== undefined) {
      const found = textValue(record[key]);
      if (found) return found;
    }
  }
  return "";
}

function normalizeRole(value: unknown): "user" | "assistant" | null {
  const role = String(value ?? "").toLowerCase();
  if (["user", "human", "prompt", "you"].includes(role)) return "user";
  if (["assistant", "model", "claude", "chatgpt", "gemini"].includes(role)) return "assistant";
  return null;
}

function htmlContent(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script, style, svg, button").forEach((node) => node.remove());
  const content = parsed.body.innerText?.trim() || parsed.body.textContent?.trim() || "";
  return { content, blocks: richBlocksFromElement(parsed.body, content) };
}

function makeImportedThread(
  platform: AIPlatform,
  sourceId: string,
  title: string,
  createdAt: number,
  url: string,
  rawMessages: Array<{ role: "user" | "assistant"; content: string; sourceId?: string; timestamp?: number; blocks?: RichContentBlock[] }>,
): { thread: Thread; messages: MessageNode[] } | null {
  const cleanMessages = rawMessages.filter((message) => message.content.trim());
  if (!cleanMessages.length) return null;
  const externalThreadId = sourceId || `import-${hash(`${platform}:${title}:${createdAt}`)}`;
  const id = `${platform}_${externalThreadId}`;
  const used = new Map<string, number>();
  const messages: MessageNode[] = cleanMessages.map((message, sequence) => {
    const fingerprint = `${message.role}:${message.content}`;
    const occurrence = used.get(fingerprint) ?? 0;
    used.set(fingerprint, occurrence + 1);
    const externalMessageId = message.sourceId;
    const identity = externalMessageId ?? `${fingerprint}:${occurrence}`;
    return {
      id: `${id}_msg_${hash(identity)}`,
      threadId: id,
      role: message.role,
      content: message.content,
      blocks: message.blocks?.length ? message.blocks : textToContentBlocks(message.content),
      externalMessageId,
      sequence,
      timestamp: message.timestamp ?? createdAt,
    };
  });
  const updatedAt = Math.max(createdAt, ...messages.map((message) => message.timestamp));
  return {
    thread: {
      id,
      platform,
      externalThreadId,
      title: title.trim() || `Imported ${platform} conversation`,
      url,
      createdAt,
      updatedAt,
      messageCount: messages.length,
      tags: [platform, "imported"],
      isPinned: false,
      isFavorite: false,
      origin: "import",
    },
    messages,
  };
}

function flattenContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenContent).filter(Boolean).join("\n");
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.parts)) return record.parts.map(flattenContent).filter(Boolean).join("\n");
  if (record.text !== undefined) return flattenContent(record.text);
  if (record.content !== undefined) return flattenContent(record.content);
  return "";
}

function conversationCandidates(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["conversations", "chats", "items", "activity", "data"]) {
    if (Array.isArray(record[key])) return conversationCandidates(record[key]);
  }
  return [record];
}

function parseChatGPT(value: unknown) {
  const imported: Array<{ thread: Thread; messages: MessageNode[] }> = [];
  for (const conversation of conversationCandidates(value)) {
    const mapping = conversation.mapping as Record<string, Record<string, unknown>> | undefined;
    const rawMessages: Array<{ role: "user" | "assistant"; content: string; sourceId?: string; timestamp?: number }> = [];
    if (mapping) {
      const nodes = Object.values(mapping).filter((node) => node.message && typeof node.message === "object");
      nodes.sort((a, b) => toTimestamp((a.message as Record<string, unknown>).create_time, 0) - toTimestamp((b.message as Record<string, unknown>).create_time, 0));
      for (const node of nodes) {
        const message = node.message as Record<string, unknown>;
        const author = message.author as Record<string, unknown> | undefined;
        const role = normalizeRole(author?.role);
        const content = flattenContent(message.content);
        if (!role || !content.trim()) continue;
        rawMessages.push({ role, content, sourceId: String(message.id ?? node.id ?? "") || undefined, timestamp: toTimestamp(message.create_time) });
      }
    } else if (Array.isArray(conversation.messages)) {
      for (const messageValue of conversation.messages) {
        if (!messageValue || typeof messageValue !== "object") continue;
        const message = messageValue as Record<string, unknown>;
        const role = normalizeRole(message.role ?? (message.author as Record<string, unknown> | undefined)?.role);
        const content = flattenContent(message.content ?? message.message);
        if (role && content.trim()) rawMessages.push({ role, content, sourceId: String(message.id ?? "") || undefined, timestamp: toTimestamp(message.timestamp ?? message.create_time) });
      }
    }
    const createdAt = toTimestamp(conversation.create_time ?? conversation.created_at);
    const sourceId = String(conversation.id ?? conversation.conversation_id ?? "");
    const item = makeImportedThread("chatgpt", sourceId, String(conversation.title ?? "Imported ChatGPT chat"), createdAt, sourceId ? `https://chatgpt.com/c/${sourceId}` : "", rawMessages);
    if (item) imported.push(item);
  }
  return imported;
}

function parseClaude(value: unknown) {
  const imported: Array<{ thread: Thread; messages: MessageNode[] }> = [];
  for (const conversation of conversationCandidates(value)) {
    const entries = conversation.chat_messages ?? conversation.messages ?? conversation.turns;
    if (!Array.isArray(entries)) continue;
    const rawMessages: Array<{ role: "user" | "assistant"; content: string; sourceId?: string; timestamp?: number; blocks?: RichContentBlock[] }> = [];
    for (const entryValue of entries) {
      if (!entryValue || typeof entryValue !== "object") continue;
      const entry = entryValue as Record<string, unknown>;
      const role = normalizeRole(entry.sender ?? entry.role ?? entry.type);
      const rawContent = entry.text ?? entry.content ?? entry.message;
      const content = flattenContent(rawContent);
      if (!role || !content.trim()) continue;
      rawMessages.push({ role, content, sourceId: String(entry.uuid ?? entry.id ?? "") || undefined, timestamp: toTimestamp(entry.created_at ?? entry.timestamp) });
    }
    const createdAt = toTimestamp(conversation.created_at ?? conversation.createdAt);
    const sourceId = String(conversation.uuid ?? conversation.id ?? "");
    const item = makeImportedThread("claude", sourceId, String(conversation.name ?? conversation.title ?? "Imported Claude chat"), createdAt, sourceId ? `https://claude.ai/chat/${sourceId}` : "", rawMessages);
    if (item) imported.push(item);
  }
  return imported;
}

function geminiActivityRecords(value: unknown): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  const visit = (item: unknown, depth = 0) => {
    if (depth > 12 || !item || typeof item !== "object") return;
    if (Array.isArray(item)) {
      item.forEach((child) => visit(child, depth + 1));
      return;
    }
    const record = item as Record<string, unknown>;
    const looksLikeActivity = (typeof record.title === "string" || typeof record.name === "string")
      && (record.safeHtmlItem !== undefined || record.time !== undefined || record.timestamp !== undefined || record.products !== undefined);
    if (looksLikeActivity) found.push(record);
    else Object.values(record).forEach((child) => visit(child, depth + 1));
  };
  visit(value);
  return found;
}

function parseGemini(value: unknown) {
  const imported: Array<{ thread: Thread; messages: MessageNode[] }> = [];
  for (const activity of geminiActivityRecords(value)) {
    const title = String(activity.title ?? activity.name ?? "Gemini activity");
    const promptText = title.replace(/^Prompted\s*:?[\s]*/i, "").trim();
    const safeContent = activity.safeHtmlItem ?? activity.content ?? activity.response ?? "";
    const html = textValue(safeContent);
    const response = /<[^>]+>/.test(html) ? htmlContent(html) : { content: html.trim(), blocks: textToContentBlocks(html) };
    const timestamp = toTimestamp(activity.time ?? activity.timestamp ?? activity.date);
    const sourceId = String(activity.id ?? activity.activityId ?? `activity-${hash(`${timestamp}:${title}:${response.content}`)}`);
    const rawMessages: Array<{ role: "user" | "assistant"; content: string; sourceId?: string; timestamp?: number; blocks?: RichContentBlock[] }> = [];
    if (promptText) rawMessages.push({ role: "user", content: promptText, sourceId: `${sourceId}:prompt`, timestamp });
    if (response.content) rawMessages.push({ role: "assistant", content: response.content, sourceId: `${sourceId}:response`, timestamp, blocks: response.blocks });
    const item = makeImportedThread("gemini", sourceId, `Gemini · ${promptText.slice(0, 72) || "Imported activity"}`, timestamp, "", rawMessages);
    if (item) imported.push(item);
  }
  return imported;
}

function parseGeminiHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const outerCards = Array.from(parsed.querySelectorAll<HTMLElement>(".outer-cell"));
  const cards = outerCards.length ? outerCards : Array.from(parsed.querySelectorAll<HTMLElement>(".content-cell"));
  const elements = cards.length ? cards : Array.from(parsed.body.children).filter((node): node is HTMLElement => node instanceof HTMLElement);
  const activities = elements.map((element, index) => {
    const text = element.innerText?.trim() || element.textContent?.trim() || "";
    const prompt = text.match(/Prompted\s*:?[\s]*([^\n]+)/i)?.[1]?.trim() ?? "";
    const title = prompt || text.split("\n").find(Boolean) || `Imported Gemini activity ${index + 1}`;
    const timestampText = element.querySelector("time")?.getAttribute("datetime") ?? element.querySelector("time")?.textContent ?? "";
    const timestamp = toTimestamp(timestampText);
    const activityId = `html-${hash(`${timestamp}:${text}`)}`;
    const rawMessages: Array<{ role: "user" | "assistant"; content: string; sourceId?: string; timestamp?: number }> = [];
    if (prompt) rawMessages.push({ role: "user", content: prompt, sourceId: `${activityId}:prompt`, timestamp });
    const remainder = text.replace(prompt, "").trim();
    if (remainder) rawMessages.push({ role: "assistant", content: remainder, sourceId: `${activityId}:entry`, timestamp });
    return makeImportedThread("gemini", activityId, `Gemini · ${title.slice(0, 72)}`, timestamp, "", rawMessages);
  }).filter((item): item is { thread: Thread; messages: MessageNode[] } => item !== null);
  return activities;
}

function asArrays(items: Array<{ thread: Thread; messages: MessageNode[] }>) {
  return { threads: items.map((item) => item.thread), messages: items.flatMap((item) => item.messages) };
}

function identifyAndParse(value: unknown, fileName: string): Omit<ParsedImport, "fileName"> | null {
  const conversations = conversationCandidates(value);
  const first = conversations[0];
  let entries: Array<{ thread: Thread; messages: MessageNode[] }> = [];
  let source = "";
  const warnings: string[] = [];

  if (first?.mapping) {
    entries = parseChatGPT(value);
    source = "ChatGPT export";
  }
  if (!entries.length && first && (first.chat_messages || first.turns || (Array.isArray(first.messages) && (first.name || first.uuid)))) {
    entries = parseClaude(value);
    source = "Claude export";
  }
  if (!entries.length && first?.messages) {
    entries = parseChatGPT(value);
    source = "ChatGPT export";
  }
  if (!entries.length && geminiActivityRecords(value).length) {
    entries = parseGemini(value);
    source = "Gemini Takeout activity";
    warnings.push("Takeout activity may not include reliable conversation IDs. Entries without a thread ID are preserved as separate imported items.");
  }
  if (!entries.length) return null;
  const arrays = asArrays(entries);
  return { source, isBackup: false, ...arrays, folders: [], prompts: [], warnings };
}

function parsePortableBackup(manifestText: string, fileTexts: Map<string, string>, fileName: string): ParsedImport {
  const manifest = JSON.parse(manifestText) as PortableManifest;
  if (manifest.format !== ARCHIVE_FORMAT) throw new Error("This ZIP is not an OmniArchive backup.");
  if (manifest.version > ARCHIVE_VERSION) throw new Error(`This backup uses a newer format version (${manifest.version}). Update OmniArchive before restoring it.`);
  const parseArray = <T,>(name: string): T[] => {
    const text = fileTexts.get(name);
    return text ? JSON.parse(text) as T[] : [];
  };
  const threads = parseArray<Thread>("threads.json");
  const messages = parseArray<MessageNode>("messages.json");
  const folders = parseArray<VaultFolder>("folders.json");
  const prompts = parseArray<PromptTemplate>("prompts.json");
  if (!threads.every((thread) => thread && typeof thread.id === "string" && ["chatgpt", "claude", "gemini"].includes(thread.platform))) {
    throw new Error("The backup contains invalid thread records.");
  }
  if (!messages.every((message) => message && typeof message.id === "string" && typeof message.threadId === "string" && typeof message.content === "string")) {
    throw new Error("The backup contains invalid message records.");
  }
  return { fileName, source: "OmniArchive backup", isBackup: true, threads, messages, folders, prompts, warnings: [] };
}

export async function exportPortableBackup() {
  const [threads, messages, folders, prompts] = await Promise.all([
    db.threads.toArray(), db.messages.toArray(), db.folders.toArray(), db.prompts.toArray(),
  ]);
  const zip = new JSZip();
  const manifest: PortableManifest = {
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_VERSION,
    createdAt: new Date().toISOString(),
    counts: { threads: threads.length, messages: messages.length, folders: folders.length, prompts: prompts.length },
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("threads.json", JSON.stringify(threads));
  zip.file("messages.json", JSON.stringify(messages));
  zip.file("folders.json", JSON.stringify(folders));
  zip.file("prompts.json", JSON.stringify(prompts));
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  downloadBlob(blob, `omniarchive-backup-${new Date().toISOString().slice(0, 10)}.oav`);
}

export async function parseImportFile(file: File): Promise<ParsedImport> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("This file is over the 300 MB import limit. Split the archive or export fewer platform records.");
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".zip") || lowerName.endsWith(".oav")) {
    const zip = await JSZip.loadAsync(file);
    const textFiles = Object.values(zip.files).filter((entry) => !entry.dir && /\.(json|html?)$/i.test(entry.name));
    const textByName = new Map<string, string>();
    const manifestFile = textFiles.find((entry) => entry.name.toLowerCase().endsWith("manifest.json"));
    if (manifestFile) {
      const manifestText = await manifestFile.async("string");
      const manifest = JSON.parse(manifestText) as PortableManifest;
      if (manifest.format === ARCHIVE_FORMAT) {
        for (const name of ["threads.json", "messages.json", "folders.json", "prompts.json"]) {
          const entry = zip.file(name);
          if (entry) textByName.set(name, await entry.async("string"));
        }
        return parsePortableBackup(manifestText, textByName, file.name);
      }
    }

    const jsonCandidates = textFiles.filter((entry) => entry.name.toLowerCase().endsWith(".json"));
    const priority = (name: string) => /my.?activity/i.test(name) ? 0 : /conversation/i.test(name) ? 1 : 2;
    jsonCandidates.sort((a, b) => priority(a.name) - priority(b.name));
    for (const entry of jsonCandidates) {
      try {
        const parsed = JSON.parse(await entry.async("string")) as unknown;
        const result = identifyAndParse(parsed, entry.name);
        if (result) return { ...result, fileName: file.name };
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }

    const htmlEntry = textFiles.find((entry) => /my.?activity.*\.html?$/i.test(entry.name) || /gemini.*\.html?$/i.test(entry.name));
    if (htmlEntry) {
      const activities = parseGeminiHtml(await htmlEntry.async("string"));
      if (activities.length) {
        const arrays = asArrays(activities);
        return { fileName: file.name, source: "Gemini Takeout HTML", isBackup: false, ...arrays, folders: [], prompts: [], warnings: ["The HTML activity export does not provide dependable conversation boundaries; each activity entry is kept as its own item."] };
      }
    }
    throw new Error("Could not identify a ChatGPT, Claude, Gemini, or OmniArchive archive inside this ZIP.");
  }

  const content = await file.text();
  if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
    const activities = parseGeminiHtml(content);
    if (!activities.length) throw new Error("No Gemini activity entries were found in this HTML file.");
    const arrays = asArrays(activities);
    return { fileName: file.name, source: "Gemini Takeout HTML", isBackup: false, ...arrays, folders: [], prompts: [], warnings: ["The HTML activity export does not provide dependable conversation boundaries; each activity entry is kept as its own item."] };
  }
  if (lowerName.endsWith(".json")) {
    const parsed = identifyAndParse(JSON.parse(content) as unknown, file.name);
    if (parsed) return { ...parsed, fileName: file.name };
  }
  throw new Error("Choose an OmniArchive backup, or a ChatGPT, Claude, or Gemini JSON/ZIP export.");
}

export async function commitImport(data: ParsedImport) {
  let addedThreads = 0;
  let addedMessages = 0;
  await db.transaction("rw", db.threads, db.messages, db.folders, db.prompts, async () => {
    for (const folder of data.folders) await db.folders.put(folder);
    for (const prompt of data.prompts) await db.prompts.put(prompt);

    const byThread = new Map<string, MessageNode[]>();
    for (const message of data.messages) {
      byThread.set(message.threadId, [...(byThread.get(message.threadId) ?? []), message]);
    }
    for (const importedThread of data.threads) {
      const incomingMessages = byThread.get(importedThread.id) ?? [];
      const existingThread = await db.threads.get(importedThread.id);
      const existingMessages = await db.messages.where("threadId").equals(importedThread.id).toArray();
      const matched = new Set<string>();
      const incomingMerged = incomingMessages.map((message) => {
        const existing = existingMessages.find((old) => !matched.has(old.id) && (
          (message.externalMessageId && old.externalMessageId === message.externalMessageId)
          || (old.role === message.role && old.content.trim() === message.content.trim())
        ));
        if (!existing) return message;
        matched.add(existing.id);
        return { ...existing, ...message, id: existing.id };
      });
      const mergedMessages = [...existingMessages.filter((message) => !matched.has(message.id)), ...incomingMerged]
        .sort((a, b) => a.timestamp - b.timestamp);
      const mergedThread: Thread = {
        ...existingThread,
        ...importedThread,
        createdAt: existingThread?.createdAt ?? importedThread.createdAt,
        isPinned: existingThread?.isPinned ?? importedThread.isPinned,
        isFavorite: existingThread?.isFavorite ?? importedThread.isFavorite,
        folderId: existingThread?.folderId ?? importedThread.folderId,
        tags: [...new Set([...(existingThread?.tags ?? []), ...importedThread.tags])],
        messageCount: mergedMessages.length,
      };
      await db.threads.put(mergedThread);
      await db.messages.where("threadId").equals(importedThread.id).delete();
      if (mergedMessages.length) await db.messages.bulkPut(mergedMessages);
      if (!existingThread) addedThreads += 1;
      addedMessages += incomingMerged.filter((message) => !matched.has(message.id)).length;
    }
  });
  return { addedThreads, addedMessages };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
