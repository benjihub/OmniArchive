import { Index } from "flexsearch";
import type { Thread } from "../../db/types";

export function createThreadSearchIndex(threads: Thread[]) {
  const index = new Index({ tokenize: "forward" });
  threads.forEach((thread) => {
    index.add(thread.id, `${thread.title} ${thread.platform} ${thread.externalThreadId} ${thread.tags.join(" ")}`);
  });
  return index;
}
