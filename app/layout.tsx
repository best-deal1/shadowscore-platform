import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Auditable Business Trust Intelligence",
  description:
    "Evidence-backed business investigations with source provenance, recorded decisions, and clear next actions.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Auditable Business Trust Intelligence",
    description:
      "Evidence-backed investigations with a recorded source trail and decision context.",
    url: "https://shadowscore.io",
    siteName: "ShadowScore",
    images: [
      { url: "/marketplaces-monitor-enterprise-v5.png", width: 1200, height: 630, alt: "ShadowScore auditable business investigations" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowScore | Auditable Business Trust Intelligence",
    description: "Evidence-backed investigations with source provenance and clear next actions.",
    images: ["/marketplaces-monitor-enterprise-v5.png"],
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
