import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Marketplace Trust Intelligence",
  description:
    "Independent marketplace trust assessments for sellers facing MC011, MC999, payout holds, tracking issues, verification reviews and policy exposure.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Marketplace Trust Intelligence",
    description:
      "Evidence-based marketplace trust assessment for sellers, agencies and multi-store operators.",
    url: "https://shadowscore.io",
    siteName: "ShadowScore",
    images: [
      { url: "/shadowscore-og.jpg", width: 1200, height: 630, alt: "ShadowScore Marketplace Trust Intelligence" },
      { url: "/shadowscore-shield-v8.png", width: 1024, height: 1024, alt: "ShadowScore shield" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowScore | Marketplace Trust Intelligence",
    description: "Evidence-based marketplace trust assessment before enforcement escalates.",
    images: ["/shadowscore-og.jpg"],
  },
  icons: { icon: "/shadowscore-shield-v8.png", shortcut: "/shadowscore-shield-v8.png", apple: "/shadowscore-shield-v8.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
