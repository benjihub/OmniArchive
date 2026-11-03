import type { MessageNode, Thread } from "../db/types";

export function threadToMarkdown(thread: Thread, messages: MessageNode[] = []) {
  const messageMarkdown = messages
    .map((message) => `## ${message.role === "user" ? "You" : "Assistant"}\n\n${message.content}`)
    .join("\n\n");

  return `# ${thread.title}\n\n_Platform: ${thread.platform}_\n\n${messageMarkdown}\n`;
}

export function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
