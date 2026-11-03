import { textToContentBlocks } from "/src/utils/contentBlocks.ts.js";
export class BaseExtractor {
  createThread(title, messages) {
    const now = Date.now();
    const externalThreadId = location.pathname.split("/").filter(Boolean).pop() || "default-thread";
    const threadId = `${this.platform}_${externalThreadId}`;
    const occurrences = /* @__PURE__ */ new Map();
    const messageNodes = messages.map((message, index) => {
      const fingerprint = `${message.role}:${message.content}`;
      const occurrence = occurrences.get(fingerprint) ?? 0;
      occurrences.set(fingerprint, occurrence + 1);
      const identity = message.externalMessageId ?? `${fingerprint}:${occurrence}`;
      return {
        id: `${threadId}_msg_${stableHash(identity)}`,
        threadId,
        role: message.role,
        content: message.content,
        blocks: message.blocks?.length ? message.blocks : textToContentBlocks(message.content),
        externalMessageId: message.externalMessageId,
        sequence: index,
        timestamp: message.timestamp ?? now
      };
    });
    return {
      thread: {
        id: threadId,
        platform: this.platform,
        externalThreadId,
        title: title || `${this.platform} conversation`,
        url: location.href,
        createdAt: now,
        updatedAt: now,
        messageCount: messageNodes.length,
        tags: [this.platform, "auto-saved"],
        isPinned: false,
        isFavorite: false,
        origin: "capture"
      },
      messages: messageNodes
    };
  }
}
export function timestampFromElement(element) {
  const value = element.getAttribute("data-timestamp") ?? element.querySelector("time[datetime]")?.getAttribute("datetime") ?? element.querySelector("time")?.textContent?.trim();
  if (!value) return void 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric < 1e10 ? numeric * 1e3 : numeric;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
const RICH_BLOCK_SELECTOR = "pre, table, blockquote, h1, h2, h3, h4, h5, h6, p, ul, ol, math, [data-latex], .katex, img";
export function richBlocksFromElement(element, plainText) {
  if (!element) return textToContentBlocks(plainText);
  const candidates = Array.from(element.querySelectorAll(RICH_BLOCK_SELECTOR)).filter((candidate) => {
    const parentBlock = candidate.parentElement?.closest(RICH_BLOCK_SELECTOR);
    return !parentBlock || parentBlock === element;
  });
  if (!candidates.length) return textToContentBlocks(plainText);
  const blocks = [];
  for (const candidate of candidates) {
    const tag = candidate.tagName.toLowerCase();
    if (tag === "pre") {
      const code = candidate.querySelector("code");
      const language = code?.className.match(/(?:language|lang)-([\w+-]+)/)?.[1];
      blocks.push({ type: "code", text: textFromElement(candidate), language });
    } else if (tag === "table") {
      const rows = Array.from(candidate.querySelectorAll("tr")).map(
        (row) => Array.from(row.querySelectorAll("th, td")).map((cell) => textFromElement(cell))
      );
      if (rows.length) blocks.push({ type: "table", headers: rows[0], rows: rows.slice(1) });
    } else if (candidate.hasAttribute("data-latex") || tag === "math" || candidate.classList.contains("katex")) {
      const annotation = candidate.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
      const latex = candidate.getAttribute("data-latex") ?? annotation ?? textFromElement(candidate);
      if (latex) blocks.push({ type: "math", text: latex });
    } else if (tag === "img") {
      const image = candidate;
      blocks.push({ type: "image", alt: image.alt || "Conversation image", src: image.currentSrc || image.src });
    } else if (tag === "ul" || tag === "ol") {
      const items = Array.from(candidate.querySelectorAll(":scope > li")).map((item) => textFromElement(item));
      if (items.length) blocks.push({ type: "list", ordered: tag === "ol", items });
    } else if (tag === "blockquote") {
      blocks.push({ type: "blockquote", text: textFromElement(candidate) });
    } else if (/^h[1-6]$/.test(tag)) {
      blocks.push({ type: "heading", level: Number(tag[1]), text: textFromElement(candidate) });
    } else if (tag === "p") {
      appendInlineBlocks(candidate, blocks);
    }
  }
  return blocks.length ? blocks : textToContentBlocks(plainText);
}
function appendInlineBlocks(element, blocks) {
  let paragraph = "";
  const flushParagraph = () => {
    const text = paragraph.replace(/\s+/g, " ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = "";
  };
  const visit = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      paragraph += node.textContent ?? "";
      return;
    }
    if (!(node instanceof Element) || ["BUTTON", "SVG", "SCRIPT", "STYLE"].includes(node.tagName)) return;
    if (node.getAttribute("aria-hidden") === "true" || node instanceof HTMLElement && node.hidden) return;
    const isMath = node.matches("[data-latex], math, .katex");
    if (isMath) {
      flushParagraph();
      const annotation = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
      const latex = node.getAttribute("data-latex") ?? annotation ?? textFromElement(node);
      if (latex) blocks.push({ type: "math", text: latex });
      return;
    }
    if (node.tagName === "IMG") {
      flushParagraph();
      const image = node;
      blocks.push({ type: "image", alt: image.alt || "Conversation image", src: image.currentSrc || image.src });
      return;
    }
    node.childNodes.forEach(visit);
  };
  element.childNodes.forEach(visit);
  flushParagraph();
}
export function textFromElement(element) {
  if (!element) return "";
  const blockTags = /* @__PURE__ */ new Set([
    "ADDRESS",
    "ARTICLE",
    "BLOCKQUOTE",
    "DIV",
    "DL",
    "DT",
    "DD",
    "FIGCAPTION",
    "FIGURE",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "LI",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TR",
    "UL"
  ]);
  const ignoredTags = /* @__PURE__ */ new Set(["BUTTON", "SCRIPT", "STYLE", "SVG"]);
  let output = "";
  const addLineBreak = () => {
    if (output && !output.endsWith("\n")) output += "\n";
  };
  const addBlockBreak = () => {
    if (!output) return;
    const trailingNewlines = output.match(/\n*$/)?.[0].length ?? 0;
    if (trailingNewlines < 2) output += "\n".repeat(2 - trailingNewlines);
  };
  const visit = (node, insidePreformattedBlock = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent ?? "";
      if (!insidePreformattedBlock) {
        text = text.replace(/[\t\f\v ]+/g, " ");
        if (/^\s+$/.test(text) && text.includes("\n") && node.parentElement?.children.length) return;
      }
      output += text;
      return;
    }
    if (!(node instanceof Element)) return;
    if (ignoredTags.has(node.tagName) || node.getAttribute("aria-hidden") === "true") return;
    if (node instanceof HTMLElement && node.hidden) return;
    const tagName = node.tagName;
    if (tagName === "BR") {
      addLineBreak();
      return;
    }
    if (tagName === "TD" || tagName === "TH") {
      if (node.previousElementSibling) output += " | ";
      node.childNodes.forEach((child) => visit(child, insidePreformattedBlock));
      return;
    }
    const isBlock = blockTags.has(tagName);
    const preserveText = insidePreformattedBlock || tagName === "PRE";
    if (isBlock) addBlockBreak();
    node.childNodes.forEach((child) => visit(child, preserveText));
    if (isBlock) addBlockBreak();
  };
  visit(element);
  return output.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
export function messageRole(role) {
  return role === "user" ? "user" : "assistant";
}
