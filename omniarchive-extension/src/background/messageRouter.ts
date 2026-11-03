import { promptRepository } from "../db/repositories/promptRepository";
import { threadRepository } from "../db/repositories/threadRepository";
import { db } from "../db";
import type { CaptureStatus, MessageNode, PromptTemplate, Thread } from "../db/types";

export type ExtensionMessage =
  | { type: "SAVE_THREAD_DATA"; payload: { thread: Thread; messages: MessageNode[] } }
  | { type: "thread:saveData"; payload: { thread: Thread; messages: MessageNode[] } }
  | { type: "thread:save"; payload: Thread }
  | { type: "CAPTURE_STATUS"; payload: CaptureStatus }
  | { type: "capture:status" }
  | { type: "threads:list" }
  | { type: "prompt:save"; payload: PromptTemplate }
  | { type: "prompts:list" };

async function handleMessage(message: ExtensionMessage) {
  switch (message.type) {
    case "SAVE_THREAD_DATA":
    case "thread:saveData":
      await db.transaction("rw", db.threads, db.messages, async () => {
        const incomingThread = message.payload.thread;
        const previousThread = await db.threads.get(incomingThread.id);
        const previousMessages = await db.messages.where("threadId").equals(incomingThread.id).toArray();
        const byExternalId = new Map(previousMessages.filter((item) => item.externalMessageId).map((item) => [item.externalMessageId!, item] as const));
        const byContent = new Map<string, MessageNode[]>();
        for (const previous of previousMessages) {
          const key = `${previous.role}:${previous.content.trim()}`;
          byContent.set(key, [...(byContent.get(key) ?? []), previous]);
        }

        const matched = new Set<string>();
        const mergedIncoming = message.payload.messages.map((incoming) => {
          const sameContent = byContent.get(`${incoming.role}:${incoming.content.trim()}`)?.find((item) => !matched.has(item.id));
          const previous = (incoming.externalMessageId && byExternalId.get(incoming.externalMessageId)) ?? sameContent;
          if (!previous) return incoming;
          matched.add(previous.id);
          return { ...previous, ...incoming, id: previous.id, timestamp: previous.timestamp };
        });
        const mergedMessages = [
          ...previousMessages.filter((previous) => !matched.has(previous.id)),
          ...mergedIncoming,
        ].sort((a, b) => a.timestamp - b.timestamp);

        await threadRepository.save({
          ...incomingThread,
          createdAt: previousThread?.createdAt ?? incomingThread.createdAt,
          isPinned: previousThread?.isPinned ?? incomingThread.isPinned,
          isFavorite: previousThread?.isFavorite ?? incomingThread.isFavorite,
          folderId: previousThread?.folderId ?? incomingThread.folderId,
          tags: [...new Set([...(previousThread?.tags ?? []), ...incomingThread.tags])],
          origin: previousThread?.origin ?? incomingThread.origin ?? "capture",
          messageCount: mergedMessages.length,
        });
        await threadRepository.replaceMessages(incomingThread.id, mergedMessages);
      });
      return { ok: true, success: true };
    case "thread:save":
      await threadRepository.save(message.payload);
      return { ok: true, success: true };
    case "CAPTURE_STATUS":
      await chrome.storage.local.set({ captureStatus: message.payload });
      return { ok: true, success: true };
    case "capture:status":
      return { ok: true, captureStatus: (await chrome.storage.local.get("captureStatus")).captureStatus ?? null };
    case "threads:list":
      return { ok: true, threads: await threadRepository.list() };
    case "prompt:save":
      await promptRepository.save(message.payload);
      return { ok: true, success: true };
    case "prompts:list":
      return { ok: true, prompts: await promptRepository.list() };
  }
}

export function registerMessageRouter() {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    void handleMessage(message)
      .then(sendResponse)
      .catch((error: unknown) => {
        console.error("[OmniArchive] Message handling failed", error);
        sendResponse({
          ok: false,
          success: false,
          error: error instanceof Error ? error.message : "Unknown message handling error",
        });
      });
    return true;
  });
}
