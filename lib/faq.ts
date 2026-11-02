export const FAQ = [
  {
    q: "Where is my chat history stored?",
    a: "Only on your device, in your browser's local IndexedDB storage. OmniArchive has no servers that receive your chats, no accounts, and no telemetry. If you uninstall the extension and clear its data, the data is gone.",
  },
  {
    q: "Will it slow down my browser or the AI sites?",
    a: "No. OmniArchive only runs on the chat pages it supports, saves conversations when you ask it to, and builds its search index in the background so the page stays responsive. Search runs against local data, so results appear instantly even with thousands of chats.",
  },
  {
    q: "Which platforms does it support?",
    a: "ChatGPT, Claude, and Gemini, all in one searchable library. You can search across platforms from a single box instead of remembering which tool you used.",
  },
  {
    q: "Is this really a one-time payment?",
    a: "Yes. Core local search and capture are free forever. The early access list locks in the $19 Pro Lifetime tier (regularly $39) with no recurring monthly subscriptions.",
  },
  {
    q: "What happens to my exports if I stop using OmniArchive?",
    a: "Your exports are plain Markdown, Notion-ready files, and PDFs. They belong to you and open anywhere, with no extension required.",
  },
] as const;
