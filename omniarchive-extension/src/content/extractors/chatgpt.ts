import type { MessageRole, RichContentBlock } from "../../db/types";
import { BaseExtractor, messageRole, richBlocksFromElement, textFromElement, timestampFromElement } from "./baseExtractor";

export interface ExtractedMessage {
  role: Exclude<MessageRole, "system">;
  content: string;
  blocks?: RichContentBlock[];
  externalMessageId?: string;
  timestamp?: number;
}

function getChatTitle() {
  const documentTitle = document.title.replace(/\s*\|\s*ChatGPT\s*$/i, "").trim();
  if (documentTitle && documentTitle.toLowerCase() !== "chatgpt") return documentTitle;

  const titleElement = document.querySelector<HTMLElement>(
    '[data-testid="conversation-title"], nav h1, nav span[title], h1',
  );
  return textFromElement(titleElement) || "Untitled ChatGPT Chat";
}

function extractMessageNodes(): ExtractedMessage[] {
  const turnElements = Array.from(
    document.querySelectorAll<HTMLElement>(
      [
        "[data-message-author-role]",
        '[data-testid^="conversation-turn-"]',
        '[data-testid="conversation-turn"]',
        'div[class*="group/conversation-turn"]',
        "article",
      ].join(", "),
    ),
  );
  const messages: ExtractedMessage[] = [];

  turnElements.forEach((element) => {
    const roleAttr = element.getAttribute("data-message-author-role");
    const userMarker = element.querySelector<HTMLElement>('[data-message-author-role="user"]');
    const assistantMarker = element.querySelector<HTMLElement>('[data-message-author-role="assistant"]');
    const className = typeof element.className === "string" ? element.className : "";

    let role: Exclude<MessageRole, "system"> | null = null;
    if (roleAttr === "user" || userMarker || className.includes("user")) {
      role = "user";
    } else if (roleAttr === "assistant" || assistantMarker || className.includes("assistant")) {
      role = "assistant";
    }

    if (!role) return;

    const roleElement = userMarker ?? assistantMarker;
    const contentElement =
      element.querySelector<HTMLElement>(
        ".markdown, .prose, .whitespace-pre-wrap, [data-message-content], .overflow-y-auto",
      ) ?? roleElement ?? element;
    const content = textFromElement(contentElement);
    const sourceNode = element.matches("[data-message-id]")
      ? element
      : element.querySelector<HTMLElement>("[data-message-id]") ?? roleElement ?? element;
    const externalMessageId = sourceNode.getAttribute("data-message-id") ?? undefined;

    if (content && !messages.some((message) => message.role === role && message.content === content)) {
      messages.push({ role, content, blocks: richBlocksFromElement(contentElement, content), externalMessageId, timestamp: timestampFromElement(element) });
    }
  });

  if (messages.length) return messages;

  // ChatGPT occasionally changes or removes role attributes during UI experiments.
  // Fall back to visible response containers so conversations still archive locally.
  const fallbackElements = Array.from(
    document.querySelectorAll<HTMLElement>(
      [
        "main .markdown",
        "main .prose",
        'main [class*="markdown"]',
        'main [class*="prose"]',
        'main [data-testid*="message"]',
      ].join(", "),
    ),
  );
  const fallbackMessages: ExtractedMessage[] = [];

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
    messages: extractMessageNodes(),
  };
}

export class ChatGPTExtractor extends BaseExtractor {
  readonly platform = "chatgpt" as const;

  matches(url: string) {
    return url.includes("chatgpt.com") || url.includes("chat.openai.com");
  }

  extract() {
    const extracted = extractChatGPTThread();
    return extracted.messages.length ? this.createThread(extracted.title, extracted.messages) : null;
  }
}
