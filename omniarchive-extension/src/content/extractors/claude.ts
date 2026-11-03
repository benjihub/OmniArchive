import type { MessageRole } from "../../db/types";
import { BaseExtractor, messageRole, richBlocksFromElement, textFromElement, timestampFromElement } from "./baseExtractor";

type CapturedRole = Exclude<MessageRole, "system">;

const MESSAGE_SELECTOR = [
  "[data-message-author-role]",
  '[data-testid*="user-message"]',
  '[data-testid*="assistant-message"]',
  '[data-testid*="message-content"]',
  '[class*="font-user"]',
  '[class*="font-claude"]',
].join(", ");

export class ClaudeExtractor extends BaseExtractor {
  readonly platform = "claude" as const;

  matches(url: string) {
    return url.includes("claude.ai");
  }

  extract() {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR)).filter(
      (element) => !element.parentElement?.closest(MESSAGE_SELECTOR),
    );
    const messages: Array<{ role: CapturedRole; content: string; blocks?: import("../../db/types").RichContentBlock[]; externalMessageId?: string; timestamp?: number }> = [];

    for (const element of candidates) {
      const role = this.getRole(element);
      if (!role) continue;

      const contentElement =
        element.querySelector<HTMLElement>(
          ".prose, .markdown, [data-testid*='message-content'], [data-testid*='content']",
        ) ?? element;
      const content = textFromElement(contentElement);
      if (!content) continue;
      const externalMessageId = element.getAttribute("data-message-id")
        ?? element.querySelector<HTMLElement>("[data-message-id]")?.getAttribute("data-message-id")
        ?? undefined;
      const blocks = richBlocksFromElement(contentElement, content);
      const timestamp = timestampFromElement(element);

      const matchingMessage = messages.findIndex((message) => message.role === role && message.content === content);
      if (matchingMessage >= 0) continue;

      // Ignore a nested fragment if its complete parent message is already captured.
      if (messages.some((message) => message.role === role && message.content.includes(content))) continue;

      // Prefer the full message if it replaces a previously captured nested fragment.
      const nestedFragmentIndex = messages.findIndex(
        (message) => message.role === role && content.includes(message.content),
      );
      if (nestedFragmentIndex >= 0) {
        messages[nestedFragmentIndex] = { role, content, blocks, externalMessageId, timestamp };
      } else {
        messages.push({ role, content, blocks, externalMessageId, timestamp });
      }
    }

    const title = document.title.replace(/\s*[-|]\s*Claude\s*$/i, "").trim() || "Untitled Claude conversation";
    return messages.length ? this.createThread(title, messages) : null;
  }

  private getRole(element: HTMLElement): CapturedRole | null {
    const roleAttr = element.getAttribute("data-message-author-role");
    if (roleAttr === "user" || roleAttr === "assistant") return messageRole(roleAttr) as CapturedRole;

    const testId = element.getAttribute("data-testid")?.toLowerCase() ?? "";
    const className = element.className.toLowerCase();
    if (testId.includes("user") || className.includes("font-user")) return "user";
    if (testId.includes("assistant") || className.includes("font-claude")) return "assistant";

    const nestedRole = element.querySelector<HTMLElement>("[data-message-author-role]")?.getAttribute("data-message-author-role");
    return nestedRole === "user" || nestedRole === "assistant" ? (messageRole(nestedRole) as CapturedRole) : null;
  }
}
