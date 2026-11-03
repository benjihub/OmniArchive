import type { MessageNode, Thread, VaultFolder } from "../../db/types";
import { db } from "../../db";
import { contentBlocksToMarkdown } from "../../utils/contentBlocks";

function preserveMarkdownLineBreaks(content: string) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  let insideCodeFence = false;

  return lines.map((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      insideCodeFence = !insideCodeFence;
      return line;
    }
    if (insideCodeFence || !line.trim() || index === lines.length - 1) return line;
    return line.endsWith("  ") ? line : `${line}  `;
  }).join("\n");
}

export function buildThreadMarkdown(thread: Thread, messages: MessageNode[]) {
  const messageBlocks = messages
    .map((message) => {
      const roleLabel = message.role === "user" ? "👤 User" : message.role === "assistant" ? "🤖 Assistant" : "⚙️ System";
      const content = message.blocks?.length ? contentBlocksToMarkdown(message.blocks) : message.content;
      return `### ${roleLabel}\n\n${preserveMarkdownLineBreaks(content)}`;
    })
    .join("\n\n---\n\n");

  return [
    `# ${thread.title}`,
    `- **Platform:** ${thread.platform.toUpperCase()}`,
    `- **Archived:** ${new Date(thread.updatedAt).toLocaleString()}`,
    `- **Original URL:** ${thread.url}`,
    "",
    "---",
    "",
    messageBlocks,
    "",
  ].join("\n");
}

export function exportThreadToMarkdown(thread: Thread, messages: MessageNode[]): void {
  const markdown = buildThreadMarkdown(thread, messages);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeTitle = thread.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

  link.href = url;
  link.download = `${safeTitle || "omniarchive-thread"}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportFolderToMarkdown(folder: VaultFolder, threads: Thread[]): Promise<void> {
  const threadBlocks = await Promise.all(threads.map(async (thread) => {
    const messages = (await db.messages.where("threadId").equals(thread.id).toArray())
      .sort((a, b) => a.timestamp - b.timestamp || (a.sequence ?? 0) - (b.sequence ?? 0));
    return buildThreadMarkdown(thread, messages);
  }));
  const markdown = `# ${folder.name}\n\n${threadBlocks.join("\n\n---\n\n")}`;
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = folder.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  link.href = url;
  link.download = `${safeName || "omniarchive-folder"}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
