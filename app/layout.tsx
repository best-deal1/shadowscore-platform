import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Trust & Risk Intelligence Platform",
  description:
    "Trust and risk intelligence for marketplaces, payments, businesses and digital operators before restrictions, payment holds or trust failures occur.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Trust & Risk Intelligence Platform",
    description:
      "Trust and risk intelligence for marketplace sellers, payment risk and digital business decisions.",
    url: "https://shadowscore.io",
    siteName: "ShadowScore",
    images: [
      { url: "/marketplaces-monitor-v8.png", width: 1200, height: 630, alt: "ShadowScore Trust & Risk Intelligence Platform" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowScore | Trust & Risk Intelligence Platform",
    description: "Trust and risk intelligence before reviews, holds and restrictions escalate.",
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
