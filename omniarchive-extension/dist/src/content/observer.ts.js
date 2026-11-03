export function startConversationObserver(extractor) {
  let timeout;
  const reportStatus = (status) => {
    try {
      void chrome.runtime.sendMessage({
        type: "CAPTURE_STATUS",
        payload: {
          ...status,
          platform: extractor.platform,
          updatedAt: Date.now(),
          url: window.location.href
        }
      }).catch(() => void 0);
    } catch {
    }
  };
  const saveCurrentThread = () => {
    if (timeout !== void 0) window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      const extracted = extractor.extract();
      if (!extracted) {
        reportStatus({ state: "waiting", detail: "No conversation messages found yet." });
        console.debug(`[OmniArchive] No ${extractor.platform} messages found yet.`);
        return;
      }
      reportStatus({ state: "saving", messageCount: extracted.messages.length, detail: "Saving conversation locally..." });
      try {
        void chrome.runtime.sendMessage({ type: "SAVE_THREAD_DATA", payload: extracted }).then((response) => {
          if (!response?.success) {
            reportStatus({ state: "error", detail: response?.error ?? "The background service did not save this conversation." });
            console.warn("[OmniArchive] Thread was not saved", response?.error ?? "Unknown background error");
            return;
          }
          reportStatus({ state: "saved", messageCount: extracted.messages.length, detail: "Conversation saved locally." });
        }).catch((error) => {
          if (isContextInvalidated(error)) return;
          reportStatus({ state: "error", detail: error instanceof Error ? error.message : "Unable to reach the background service." });
          console.warn("[OmniArchive] Unable to send captured thread", error);
        });
      } catch (error) {
        if (isContextInvalidated(error)) return;
        reportStatus({ state: "error", detail: "Extension context was reloaded. Refresh this tab." });
        console.warn("[OmniArchive] Extension context is unavailable; refresh this tab after reloading the extension.", error);
      }
    }, 2e3);
  };
  if (!document.body) return () => {
  };
  reportStatus({ state: "scanning", detail: "Watching this conversation for messages..." });
  const observer = new MutationObserver(saveCurrentThread);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  saveCurrentThread();
  return () => {
    observer.disconnect();
    if (timeout !== void 0) window.clearTimeout(timeout);
  };
}
function isContextInvalidated(error) {
  return error instanceof Error && /extension context invalidated/i.test(error.message);
}
