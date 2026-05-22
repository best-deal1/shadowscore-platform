import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Marketplace Risk Intelligence",
  description:
    "Cyber-intelligence for marketplace sellers. Detect trust decay, payout exposure and enforcement patterns before sellers know they are at risk.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Marketplace Risk Intelligence",
    description:
      "Your marketplace is scoring you right now. ShadowScore detects trust decay before enforcement.",
    url: "https://shadowscore.io",
    siteName: "ShadowScore",
    images: [
      {
        url: "/shadowscore-og.jpg",
        width: 1200,
        height: 630,
        alt: "ShadowScore Marketplace Risk Intelligence",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowScore | Marketplace Risk Intelligence",
    description:
      "Detect marketplace trust decay before payout holds, account reviews and enforcement.",
    images: ["/shadowscore-og.jpg"],
  },
  icons: {
    icon: "/shadowscore-main-logo.jpg",
    shortcut: "/shadowscore-main-logo.jpg",
    apple: "/shadowscore-main-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
