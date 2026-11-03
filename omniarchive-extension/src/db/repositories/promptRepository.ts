import { db } from "../index";
import type { PromptTemplate } from "../types";

export const promptRepository = {
  list: () => db.prompts.orderBy("updatedAt").reverse().toArray(),
  save: (prompt: PromptTemplate) => db.prompts.put(prompt),
  remove: (id: string) => db.prompts.delete(id),
};
