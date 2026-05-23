import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Marketplace Risk Intelligence",
  description:
    "The marketplace already formed an opinion about your account. ShadowScore lets you see it before enforcement begins.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Marketplace Risk Intelligence",
    description:
      "Enterprise marketplace exposure intelligence for sellers, agencies and multi-store operators.",
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
    description: "Marketplace exposure intelligence before enforcement begins.",
    images: ["/shadowscore-og.jpg"],
  },
  icons: {
    icon: "/shadowscore-shield-v8.png",
    shortcut: "/shadowscore-shield-v8.png",
    apple: "/shadowscore-shield-v8.png",
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
