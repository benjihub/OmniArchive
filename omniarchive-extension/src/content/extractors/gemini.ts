import type { MessageRole, RichContentBlock } from "../../db/types";
import { BaseExtractor, messageRole, richBlocksFromElement, textFromElement, timestampFromElement } from "./baseExtractor";

type CapturedRole = Exclude<MessageRole, "system">;

export class GeminiExtractor extends BaseExtractor {
  readonly platform = "gemini" as const;

  matches(url: string) {
    return url.includes("gemini.google.com");
  }

  extract() {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        [
          "user-query",
          "model-response",
          "message-content",
          "[data-message-author-role]",
          '[data-testid*="user-query"]',
          '[data-testid*="model-response"]',
          '[class*="user-query"]',
          '[class*="model-response"]',
        ].join(", "),
      ),
    );
    const seen = new Set<string>();
    const messages = candidates.flatMap((element) => {
      const role = this.getRole(element);
      if (!role) return [];

      const contentElement =
        element.querySelector<HTMLElement>(".markdown, .model-response-text, .message-content, .response-content") ?? element;
      const content = textFromElement(contentElement);
      const fingerprint = `${role}:${content}`;

      if (!content || seen.has(fingerprint)) return [];
      seen.add(fingerprint);
      const externalMessageId = element.getAttribute("data-message-id")
        ?? element.querySelector<HTMLElement>("[data-message-id]")?.getAttribute("data-message-id")
        ?? undefined;
      const blocks: RichContentBlock[] = richBlocksFromElement(contentElement, content);
      const timestamp = timestampFromElement(element);
      return [{ role, content, blocks, externalMessageId, timestamp }];
    });

    const title = document.title.replace(/\s*-\s*Gemini\s*$/i, "").trim() || "Untitled Gemini conversation";
    return messages.length ? this.createThread(title, messages) : null;
  }

  private getRole(element: HTMLElement): CapturedRole | null {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;
    const roleAttr = element.getAttribute("data-message-author-role");

    if (tagName === "user-query" || roleAttr === "user" || className.includes("user-query")) return "user";
    if (tagName === "model-response" || roleAttr === "assistant" || className.includes("model-response")) return "assistant";

    const nestedRole = element.querySelector<HTMLElement>("[data-message-author-role]")?.getAttribute("data-message-author-role");
    if (nestedRole) return messageRole(nestedRole) as CapturedRole;
    return null;
  }
}
