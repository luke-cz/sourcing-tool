import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sourcing Tool",
  description: "Search for candidates across GitHub, HackerNews, Stack Overflow, and LinkedIn",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
