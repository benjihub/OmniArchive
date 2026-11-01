import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniArchive — Your AI conversations, yours to keep",
  description: "A local-first vault for searching, organizing, and exporting your AI conversations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
