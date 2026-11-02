import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniArchive — Your AI conversations, yours to keep",
  description: "A local-first vault for searching, organizing, and exporting your AI conversations.",
  openGraph: {
    title: "OmniArchive — Your AI conversations, yours to keep",
    description: "A private, local-first vault for ChatGPT, Claude, and Gemini.",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "OmniArchive — Private, local-first AI chat and prompt vault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniArchive — Your AI conversations, yours to keep",
    description: "A private, local-first vault for ChatGPT, Claude, and Gemini.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
