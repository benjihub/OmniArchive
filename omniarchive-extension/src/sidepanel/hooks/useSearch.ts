import { useMemo } from "react";
import type { Thread } from "../../db/types";

export function useSearch(threads: Thread[], query: string) {
  return useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return threads;

    return threads.filter((thread) =>
      [thread.title, thread.platform, thread.externalThreadId, ...thread.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [threads, query]);
}
