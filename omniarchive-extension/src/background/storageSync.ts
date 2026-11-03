import type { Thread } from "../db/types";
import { threadRepository } from "../db/repositories/threadRepository";

export async function saveThreadLocally(thread: Thread) {
  await threadRepository.save(thread);
  await chrome.storage.local.set({ lastThreadSyncAt: Date.now() });
}

export async function syncPendingThreads() {
  return chrome.storage.local.get("lastThreadSyncAt");
}
