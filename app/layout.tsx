import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Marketplace Risk Intelligence",
  description:
    "The marketplace already decided you're risky. ShadowScore tells you first.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Marketplace Risk Intelligence",
    description:
      "Cyber-intelligence for marketplace sellers. Detect hidden risk before payout holds, reviews and restrictions.",
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
    description: "Cyber-intelligence for marketplace sellers.",
    images: ["/shadowscore-og.jpg"],
  },
  icons: {
    icon: "/shadowscore-shield-final-v4.png",
    shortcut: "/shadowscore-shield-final-v4.png",
    apple: "/shadowscore-shield-final-v4.png",
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
