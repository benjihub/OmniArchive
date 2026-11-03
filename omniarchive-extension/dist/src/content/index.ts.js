import { ChatGPTExtractor } from "/src/content/extractors/chatgpt.ts.js";
import { ClaudeExtractor } from "/src/content/extractors/claude.ts.js";
import { GeminiExtractor } from "/src/content/extractors/gemini.ts.js";
import { startConversationObserver } from "/src/content/observer.ts.js";
const extractors = [new ChatGPTExtractor(), new ClaudeExtractor(), new GeminiExtractor()];
const extractor = extractors.find((candidate) => candidate.matches(window.location.href));
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "prompt:insert") return;
  const composerSelectors = [
    "#prompt-textarea",
    '[data-testid="chat-input"]',
    'rich-textarea [contenteditable="true"]',
    '[contenteditable="true"][data-placeholder]',
    '[contenteditable="true"]',
    "textarea",
    '[role="textbox"]'
  ];
  const composer = composerSelectors.map((selector) => document.querySelector(selector)).find((element) => element && element.getClientRects().length > 0);
  if (!composer) {
    sendResponse({ ok: false, error: "Could not find the chat input. Click the message box and try again." });
    return;
  }
  composer.focus();
  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(composer), "value")?.set;
    setter?.call(composer, message.content);
    composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: message.content }));
  } else {
    composer.textContent = message.content;
    composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: message.content }));
  }
  sendResponse({ ok: true });
});
if (extractor) {
  startConversationObserver(extractor);
}
