import type { RichContentBlock } from "../db/types";

const isFence = (line: string) => /^\s*(```|~~~)/.test(line);
const isHeading = (line: string) => /^(#{1,6})\s+(.+)$/.test(line);
const isListItem = (line: string) => /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
const cellsFromRow = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
const markdownCell = (cell: string) => cell.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");

/** Converts plain extracted/imported text into safe, portable structural blocks. */
export function textToContentBlocks(content: string): RichContentBlock[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichContentBlock[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    const text = paragraph.join("\n").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };
  const flushQuote = () => {
    const text = quote.join("\n").trim();
    if (text) blocks.push({ type: "blockquote", text });
    quote = [];
  };
  const flushList = () => {
    if (listItems.length) blocks.push({ type: "list", ordered: listOrdered, items: listItems });
    listItems = [];
  };
  const flushTextGroups = () => {
    flushParagraph();
    flushQuote();
    flushList();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isFence(line)) {
      flushTextGroups();
      const language = line.trim().match(/^(?:```|~~~)\s*([\w+-]*)/)?.[1] || undefined;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !isFence(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", text: code.join("\n"), language });
      continue;
    }

    if (line.trim() === "$$") {
      flushTextGroups();
      const math: string[] = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== "$$") {
        math.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "math", text: math.join("\n").trim() });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushTextGroups();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isTableSeparator(lines[index + 1])) {
      flushTextGroups();
      const headers = cellsFromRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(cellsFromRow(lines[index]));
        index += 1;
      }
      index -= 1;
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const quoteLine = line.match(/^\s*>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph();
      flushList();
      quote.push(quoteLine[1]);
      continue;
    }

    if (isListItem(line)) {
      flushParagraph();
      flushQuote();
      const ordered = /^\s*\d+[.)]/.test(line);
      if (listItems.length && ordered !== listOrdered) flushList();
      listOrdered = ordered;
      listItems.push(line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, "").trim());
      continue;
    }

    if (!line.trim()) {
      flushTextGroups();
      continue;
    }
    flushQuote();
    flushList();
    paragraph.push(line);
  }

  flushTextGroups();
  return blocks;
}

export function contentBlocksToMarkdown(blocks: RichContentBlock[]) {
  return blocks.map((block) => {
    switch (block.type) {
      case "heading": return `${"#".repeat(Math.min(6, Math.max(1, block.level)))} ${block.text}`;
      case "code": return `\`\`\`${block.language ?? ""}\n${block.text}\n\`\`\``;
      case "math": return `$$\n${block.text}\n$$`;
      case "blockquote": return block.text.split("\n").map((line) => `> ${line}`).join("\n");
      case "list": return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${item}`).join("\n");
      case "table": return [
        `| ${block.headers.map(markdownCell).join(" | ")} |`,
        `| ${block.headers.map(() => "---").join(" | ")} |`,
        ...block.rows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`),
      ].join("\n");
      case "image": return `![${block.alt}](${block.src ?? ""})`;
      default: return block.text;
    }
  }).join("\n\n");
}
