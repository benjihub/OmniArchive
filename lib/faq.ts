export const FAQ = [
  {
    q: "Where is my chat history stored?",
    a: "Captured conversations are stored in the extension's local browser database on your device. OmniArchive does not upload your chat content. Export an .oav backup before clearing extension data or uninstalling, because local browser data can be removed with the extension.",
  },
  {
    q: "Which AI platforms does OmniArchive support?",
    a: "The extension currently supports ChatGPT, Claude, and Gemini. It captures conversations on supported chat pages and brings them into one local vault.",
  },
  {
    q: "Can I bring in my old chat history?",
    a: "OmniArchive Pro is planned to import supported ChatGPT, Claude, and Gemini history export files. Import support depends on the structure of each platform's export. Restoring an OmniArchive .oav backup remains free.",
  },
  {
    q: "What can I export for free?",
    a: "You can export an individual conversation to Markdown or PDF and download a portable .oav backup containing your local archive. Pro adds folder-level Markdown export.",
  },
  {
    q: "Is Pro a subscription, and can I buy it now?",
    a: "Pro is planned as a $19 one-time founding offer at beta launch, with a planned standard price of $39. Checkout is not open yet; join the waitlist and we'll email when the offer is available. There are no recurring subscriptions planned.",
  },
  {
    q: "What information leaves my device?",
    a: "Your archived conversation text stays local. If you join the waitlist, your email is sent to our email provider. Pro license activation sends a Paddle transaction ID to our verification endpoint; it does not send your chats.",
  },
] as const;
