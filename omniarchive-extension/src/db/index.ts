import Dexie, { type Table } from "dexie";
import type { MessageNode, PromptTemplate, Thread, VaultFolder } from "./types";

export class OmniArchiveDB extends Dexie {
  threads!: Table<Thread, string>;
  messages!: Table<MessageNode, string>;
  prompts!: Table<PromptTemplate, string>;
  folders!: Table<VaultFolder, string>;

  constructor() {
    super('OmniArchiveDB');
    this.version(1).stores({
      threads: 'id, platform, externalThreadId, title, createdAt, updatedAt, *tags, isPinned, isFavorite',
      messages: 'id, threadId, role, timestamp',
      prompts: 'id, title, category, *tags, usageCount, updatedAt'
    });
    this.version(2).stores({
      threads: 'id, platform, externalThreadId, title, createdAt, updatedAt, *tags, isPinned, isFavorite, folderId',
      messages: 'id, threadId, role, timestamp',
      prompts: 'id, title, category, *tags, usageCount, updatedAt, isFavorite',
      folders: 'id, name, parentId, createdAt, updatedAt',
    });
    this.version(3).stores({
      threads: 'id, platform, externalThreadId, title, createdAt, updatedAt, *tags, isPinned, isFavorite, folderId, origin',
      messages: 'id, threadId, role, timestamp, externalMessageId',
      prompts: 'id, title, category, *tags, usageCount, updatedAt, isFavorite',
      folders: 'id, name, parentId, createdAt, updatedAt',
    });
  }
}

export const db = new OmniArchiveDB();
