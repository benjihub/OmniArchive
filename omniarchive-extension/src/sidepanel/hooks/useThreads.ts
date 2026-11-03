import { useEffect, useState } from "react";
import type { Thread } from "../../db/types";

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    void chrome.runtime.sendMessage({ type: "threads:list" }).then((response) => {
      if (response?.threads) setThreads(response.threads as Thread[]);
    });
  }, []);

  return { threads, setThreads };
}
