import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";
export const metadata: Metadata = {
  title: "Trace Diff · find where agent runs diverge",
  description:
    "Find where an AI agent run diverged. Compare traces, inspect the first change, and turn it into a regression eval.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
