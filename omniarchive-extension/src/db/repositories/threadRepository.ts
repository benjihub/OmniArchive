import { db } from "../index";
import type { AIPlatform, MessageNode, Thread } from "../types";

export const threadRepository = {
  list: () => db.threads.orderBy("updatedAt").reverse().toArray(),
  get: (id: string) => db.threads.get(id),
  save: (thread: Thread) => db.threads.put(thread),
  remove: (id: string) => db.threads.delete(id),
  byPlatform: (platform: AIPlatform) => db.threads.where("platform").equals(platform).reverse().sortBy("updatedAt"),
  replaceMessages: async (threadId: string, messages: MessageNode[]) => {
    await db.messages.where("threadId").equals(threadId).delete();
    if (messages.length) await db.messages.bulkPut(messages);
  },
};
