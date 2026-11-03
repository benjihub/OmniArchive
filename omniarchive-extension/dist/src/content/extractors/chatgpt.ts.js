import { BaseExtractor, richBlocksFromElement, textFromElement, timestampFromElement } from "/src/content/extractors/baseExtractor.ts.js";
function getChatTitle() {
  const documentTitle = document.title.replace(/\s*\|\s*ChatGPT\s*$/i, "").trim();
  if (documentTitle && documentTitle.toLowerCase() !== "chatgpt") return documentTitle;
  const titleElement = document.querySelector(
    '[data-testid="conversation-title"], nav h1, nav span[title], h1'
  );
  return textFromElement(titleElement) || "Untitled ChatGPT Chat";
}
function extractMessageNodes() {
  const turnElements = Array.from(
    document.querySelectorAll(
      [
        "[data-message-author-role]",
        '[data-testid^="conversation-turn-"]',
        '[data-testid="conversation-turn"]',
        'div[class*="group/conversation-turn"]',
        "article"
      ].join(", ")
    )
  );
  const messages = [];
  turnElements.forEach((element) => {
    const roleAttr = element.getAttribute("data-message-author-role");
    const userMarker = element.querySelector('[data-message-author-role="user"]');
    const assistantMarker = element.querySelector('[data-message-author-role="assistant"]');
    const className = typeof element.className === "string" ? element.className : "";
    let role = null;
    if (roleAttr === "user" || userMarker || className.includes("user")) {
      role = "user";
    } else if (roleAttr === "assistant" || assistantMarker || className.includes("assistant")) {
      role = "assistant";
    }
    if (!role) return;
    const roleElement = userMarker ?? assistantMarker;
    const contentElement = element.querySelector(
      ".markdown, .prose, .whitespace-pre-wrap, [data-message-content], .overflow-y-auto"
    ) ?? roleElement ?? element;
    const content = textFromElement(contentElement);
    const sourceNode = element.matches("[data-message-id]") ? element : element.querySelector("[data-message-id]") ?? roleElement ?? element;
    const externalMessageId = sourceNode.getAttribute("data-message-id") ?? void 0;
    if (content && !messages.some((message) => message.role === role && message.content === content)) {
      messages.push({ role, content, blocks: richBlocksFromElement(contentElement, content), externalMessageId, timestamp: timestampFromElement(element) });
    }
  });
  if (messages.length) return messages;
  const fallbackElements = Array.from(
    document.querySelectorAll(
      [
        "main .markdown",
        "main .prose",
        'main [class*="markdown"]',
        'main [class*="prose"]',
        'main [data-testid*="message"]'
      ].join(", ")
    )
  );
  const fallbackMessages = [];
  fallbackElements.forEach((element) => {
    const content = textFromElement(element);
    if (!content || fallbackMessages.some((message) => message.content === content)) return;
    fallbackMessages.push({ role: "assistant", content, blocks: richBlocksFromElement(element, content) });
  });
  if (!fallbackMessages.length) {
    console.debug(`[OmniArchive] ChatGPT extractor found no message containers across ${turnElements.length} candidates.`);
  }
  return fallbackMessages;
}
export function extractChatGPTThread() {
  return {
    title: getChatTitle(),
    messages: extractMessageNodes()
  };
}
export class ChatGPTExtractor extends BaseExtractor {
  platform = "chatgpt";
  matches(url) {
    return url.includes("chatgpt.com") || url.includes("chat.openai.com");
  }
  extract() {
    const extracted = extractChatGPTThread();
    return extracted.messages.length ? this.createThread(extracted.title, extracted.messages) : null;
  }
}
