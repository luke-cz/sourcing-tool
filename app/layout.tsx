import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentScout — Elite Candidate Sourcing",
  description: "Find top engineering talent across GitHub, Stack Overflow, and LinkedIn using pedigree-first search",
};

// Injected before React hydrates — prevents flash of wrong theme
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
