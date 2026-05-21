import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore",
  description:
    "Marketplace Risk Intelligence Platform for eBay, Amazon, Walmart, SHEIN and TikTok Shop sellers.",

  metadataBase: new URL("https://shadowscore.io"),

  openGraph: {
    title: "ShadowScore",
    description:
      "Detect trust decay before enforcement.",
    url: "https://shadowscore.io",
    siteName: "ShadowScore",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShadowScore",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ShadowScore",
    description:
      "Marketplace Risk Intelligence",
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/favicon.ico",
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