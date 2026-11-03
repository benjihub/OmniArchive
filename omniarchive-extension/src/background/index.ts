import { registerMessageRouter } from "./messageRouter";
import { syncPendingThreads } from "./storageSync";

registerMessageRouter();

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return;

  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error("[OmniArchive] Failed to open side panel", error);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void syncPendingThreads();
});

void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
  console.error("[OmniArchive] Failed to configure side panel", error);
});
