import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["influencer marketing India", "college creators", "campus ambassadors", "event talent", "brand promoters", "Instagram influencers", "youth marketing", "Vigor Launchpad"],
  openGraph: { type: "website", siteName: SITE.name, title: SITE.name, description: SITE.description, url: SITE.url, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 btn-primary">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
