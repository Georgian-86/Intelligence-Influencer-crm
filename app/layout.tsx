import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigor Talent Network",
  description: "India's talent network for influencer campaigns, events and experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
