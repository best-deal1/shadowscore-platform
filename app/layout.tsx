import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Marketplace Trust Intelligence",
  description:
    "Independent marketplace trust assessments for sellers facing account reviews, payout holds, policy issues, verification gaps and restriction risk.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Marketplace Trust Intelligence",
    description:
      "Free marketplace risk scan and evidence-based trust assessment for digital sellers.",
    url: "https://shadowscore.io",
    siteName: "ShadowScore",
    images: [
      { url: "/marketplaces-monitor-v8.png", width: 1200, height: 630, alt: "ShadowScore Marketplace Trust Intelligence" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowScore | Marketplace Trust Intelligence",
    description: "Free marketplace risk scan before reviews, holds and restrictions escalate.",
    images: ["/marketplaces-monitor-v8.png"],
  },
  icons: {
    icon: "/shadowscore-shield-v8.png",
    shortcut: "/shadowscore-shield-v8.png",
    apple: "/shadowscore-shield-v8.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
