import { jsPDF } from "jspdf";
import type { MessageNode, RichContentBlock, Thread } from "../../db/types";
import { textToContentBlocks } from "../../utils/contentBlocks";

const PAGE_MARGIN = 42;
const LINE_HEIGHT = 15;

export function exportThreadToPdf(thread: Thread, messages: MessageNode[]) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - PAGE_MARGIN) return;
    pdf.addPage();
    y = PAGE_MARGIN;
  };

  const writeParagraph = (text: string, size = 10, color: [number, number, number] = [51, 65, 85]) => {
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, contentWidth) as string[];
    ensureSpace(lines.length * LINE_HEIGHT + 6);
    pdf.text(lines, PAGE_MARGIN, y);
    y += lines.length * LINE_HEIGHT + 6;
  };

  const writeFormattedText = (
    text: string,
    options: { size?: number; color?: [number, number, number]; font?: "helvetica" | "courier"; style?: "normal" | "bold" | "italic"; indent?: number; shaded?: boolean } = {},
  ) => {
    const { size = 10, color = [51, 65, 85], font = "helvetica", style = "normal", indent = 0, shaded = false } = options;
    for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
      if (!line.trim()) {
        ensureSpace(LINE_HEIGHT * 0.7);
        y += LINE_HEIGHT * 0.7;
        continue;
      }
      const wrappedLines = pdf.splitTextToSize(line, contentWidth - indent - (shaded ? 12 : 0)) as string[];
      const blockHeight = wrappedLines.length * LINE_HEIGHT;
      ensureSpace(blockHeight + 3);
      if (shaded) {
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(PAGE_MARGIN + indent, y - 10, contentWidth - indent, blockHeight + 5, 3, 3, "F");
      }
      pdf.setFont(font, style);
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      pdf.text(wrappedLines, PAGE_MARGIN + indent + (shaded ? 6 : 0), y);
      y += blockHeight;
    }
  };

  const writeCodeBlock = (text: string) => {
    y += 3;
    for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
      const wrappedLines = pdf.splitTextToSize(line || " ", contentWidth - 20) as string[];
      const blockHeight = wrappedLines.length * LINE_HEIGHT;
      ensureSpace(blockHeight + 4);
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(PAGE_MARGIN, y - 10, contentWidth, blockHeight + 5, 3, 3, "F");
      pdf.setFont("courier", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);
      pdf.text(wrappedLines, PAGE_MARGIN + 7, y);
      y += blockHeight;
    }
    y += 5;
  };

  const writeTable = (block: Extract<RichContentBlock, { type: "table" }>) => {
    const rows = [block.headers, ...block.rows];
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    const columnWidth = contentWidth / columnCount;
    for (const [index, row] of rows.entries()) {
      const cellLines = Array.from({ length: columnCount }, (_, cellIndex) =>
        pdf.splitTextToSize(row[cellIndex] ?? "", columnWidth - 10) as string[],
      );
      const rowHeight = Math.max(22, ...cellLines.map((lines) => lines.length * 12 + 8));
      ensureSpace(rowHeight + 2);
      cellLines.forEach((lines, cellIndex) => {
        const x = PAGE_MARGIN + cellIndex * columnWidth;
        pdf.setDrawColor(203, 213, 225);
        if (index === 0) {
          pdf.setFillColor(226, 232, 240);
          pdf.rect(x, y - 12, columnWidth, rowHeight, "FD");
        } else {
          pdf.rect(x, y - 12, columnWidth, rowHeight, "S");
        }
        pdf.setFont("helvetica", index === 0 ? "bold" : "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);
        pdf.text(lines, x + 5, y + 1);
      });
      y += rowHeight;
    }
    y += 4;
  };

  const writeMessageBody = (message: MessageNode) => {
    const blocks = message.blocks?.length ? message.blocks : textToContentBlocks(message.content);
    for (const block of blocks) {
      switch (block.type) {
        case "heading":
          writeFormattedText(block.text, { size: Math.max(11, 18 - block.level), color: [15, 23, 42], style: "bold" });
          y += 2;
          break;
        case "code":
          writeCodeBlock(block.text);
          break;
        case "math":
          writeFormattedText(`$${block.text}$`, { size: 9, color: [79, 70, 229], font: "courier" });
          y += 4;
          break;
        case "blockquote":
          writeFormattedText(block.text.split("\n").map((line) => `› ${line}`).join("\n"), { color: [100, 116, 139], style: "italic", indent: 8 });
          y += 4;
          break;
        case "list":
          block.items.forEach((item, index) => writeFormattedText(`${block.ordered ? `${index + 1}.` : "•"} ${item}`, { indent: 8 }));
          y += 4;
          break;
        case "table":
          writeTable(block);
          break;
        case "image":
          writeFormattedText(`[Image: ${block.alt}]`, { size: 9, color: [100, 116, 139], style: "italic" });
          break;
        default:
          writeFormattedText(block.text);
      }
    }
    y += 5;
  };

  pdf.setProperties({
    title: thread.title,
    subject: `OmniArchive export from ${thread.platform}`,
    creator: "OmniArchive",
  });
  writeParagraph("OmniArchive", 11, [99, 102, 241]);
  writeParagraph(thread.title, 20, [15, 23, 42]);
  writeParagraph(`${thread.platform.toUpperCase()}  •  Archived ${new Date(thread.updatedAt).toLocaleString()}`, 9, [100, 116, 139]);
  y += 8;

  messages.forEach((message) => {
    const role = message.role === "user" ? "You" : message.role === "assistant" ? "Assistant" : "System";
    ensureSpace(34);
    pdf.setFillColor(...(message.role === "user" ? [79, 70, 229] : [124, 58, 237]));
    pdf.roundedRect(PAGE_MARGIN, y - 11, 76, 18, 4, 4, "F");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(role, PAGE_MARGIN + 10, y + 1);
    y += 26;
    writeMessageBody(message);
    y += 8;
  });

  const safeTitle = thread.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  pdf.save(`${safeTitle || "omniarchive-thread"}.pdf`);
}
