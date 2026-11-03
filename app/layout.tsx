import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniArchive — A private AI chat archive you can take with you",
  description: "Capture, search, back up, and export ChatGPT, Claude, and Gemini conversations in one local-first archive.",
  openGraph: {
    title: "OmniArchive — A private AI chat archive you can take with you",
    description: "Capture, search, back up, and export ChatGPT, Claude, and Gemini conversations in one local-first archive.",
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
    title: "OmniArchive — A private AI chat archive you can take with you",
    description: "Capture, search, back up, and export ChatGPT, Claude, and Gemini conversations in one local-first archive.",
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
